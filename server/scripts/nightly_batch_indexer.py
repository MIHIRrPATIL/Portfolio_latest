import sys
import os
import asyncio
import time
import gc

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ai_service import ai_service
from app.services.indexer_service import indexer_service
from app.services.github_service import github_service
from app.config import settings
from app.db.session import SessionLocal
from app.db.crud import upsert_project_case_study, get_all_case_studies

# Concurrency Mutex to prevent duplicate parallel cron executions
_INDEXING_LOCK = asyncio.Lock()
_IS_INDEXING = False

async def run_nightly_batch_indexing(batch_size: int = 5):
    """
    Nightly Batch AI Case Study Generator.
    Runs at midnight every night:
    - Finds projects that are missing full AI case studies (stubs).
    - Processes a safe batch (default: 5 repos per night) with delays to prevent rate limits (HTTP 429).
    - Saves generated AI case studies to PostgreSQL database.
    - Prevents parallel duplicate execution to protect container memory.
    """
    global _IS_INDEXING
    if _IS_INDEXING or _INDEXING_LOCK.locked():
        print("⚠️ [NIGHTLY CRON] Batch indexing is ALREADY running in background. Skipping duplicate trigger.")
        return

    async with _INDEXING_LOCK:
        _IS_INDEXING = True
        try:
            print("🌙 [NIGHTLY CRON] Starting Midnight AI Case Study Batch Indexer...")
            target_user = settings.GITHUB_USERNAME

            try:
                repos = await github_service.fetch_user_repositories(target_user)
                # Filter personal repos + explicit team repos
                known_team_repos = {"cdac-asr", "cdac_asr", "hireai", "greekslab", "portfolio--main", "ipd", "synapse"}
                filtered_repos = [
                    r for r in repos
                    if r.get("owner", {}).get("login", "").lower() == target_user.lower() or
                       r.get("name", "").lower() in known_team_repos
                ]
            except Exception as e:
                print(f"⚠️ [NIGHTLY CRON] Error fetching user repositories: {str(e)}")
                return

            db = SessionLocal()
            try:
                existing_cases = {c.id: c for c in get_all_case_studies(db)}
            finally:
                db.close()

            unindexed = []
            for r in filtered_repos:
                name = r.get("name")
                owner = r.get("owner", {}).get("login", target_user)
                project_id = name.lower().replace("_", "-")

                existing = existing_cases.get(project_id)
                is_stub = True
                if existing:
                    is_stub = (
                        "Click to trigger" in (existing.architecture_overview or "") or
                        "Automated portfolio case study" in (existing.description or "") or
                        "repository built by" in (existing.description or "") or
                        len(existing.description or "") < 100 or
                        not existing.architecture_overview or
                        len(existing.architecture_overview) < 100
                    )

                if is_stub:
                    unindexed.append({"name": name, "owner": owner, "id": project_id})

            print(f"📊 [NIGHTLY CRON] Progress: {len(filtered_repos) - len(unindexed)}/{len(filtered_repos)} repositories fully indexed. {len(unindexed)} stubs remaining.")

            if not unindexed:
                print("🎉 [NIGHTLY CRON] All projects have been fully indexed with AI! Nothing to do tonight.")
                return

            # Process batch for tonight
            batch = unindexed[:batch_size]
            print(f"⚡ [NIGHTLY CRON] Processing tonight's batch of {len(batch)} repositories...")

            processed_count = 0
            for item in batch:
                name = item["name"]
                owner = item["owner"]
                project_id = item["id"]

                print(f"\n🧠 Indexing & Synthesizing AI Case Study for '{owner}/{name}'...")
                try:
                    repo_index = await indexer_service.index_repository(owner, name)
                    case_study = await ai_service.analyze_and_generate_case_study(repo_index)
                    case_study["id"] = project_id
                    case_study["name"] = name
                    case_study["owner"] = owner

                    db = SessionLocal()
                    try:
                        upsert_project_case_study(db, case_study)
                    finally:
                        db.close()

                    processed_count += 1
                    print(f"✅ Saved AI Case Study for '{name}' -> Title: '{case_study.get('title')}'")

                    # Force memory garbage collection between repository runs
                    del repo_index
                    del case_study
                    gc.collect()

                    # Delay 3 seconds between LLM calls to prevent rate limits
                    await asyncio.sleep(3.0)
                except Exception as e:
                    print(f"⚠️ [NIGHTLY CRON] Error generating case study for '{name}': {str(e)}")

            print(f"\n🌙 [NIGHTLY CRON] Nightly batch completed! Upgraded {processed_count} projects tonight. {len(unindexed) - processed_count} stubs remaining for upcoming nights.")
        finally:
            _IS_INDEXING = False

if __name__ == "__main__":
    asyncio.run(run_nightly_batch_indexing(batch_size=5))
