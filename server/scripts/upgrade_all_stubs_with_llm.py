import sys
import os
import asyncio
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ai_service import ai_service
from app.services.indexer_service import indexer_service
from app.services.github_service import github_service
from app.config import settings
from app.db.session import SessionLocal
from app.db.crud import upsert_project_case_study, get_all_case_studies

async def upgrade_all_case_studies():
    print("🚀 Starting OpenRouter AI Case Study Upgrade Pipeline...")
    target_user = settings.GITHUB_USERNAME
    repos = await github_service.fetch_user_repositories(target_user)
    print(f"📦 Found {len(repos)} repositories for user {target_user}.")

    db = SessionLocal()
    existing_cases = {c.id: c for c in get_all_case_studies(db)}
    db.close()

    upgraded_count = 0

    for r in repos:
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
            print(f"\n⚡ Upgrading '{owner}/{name}' with OpenRouter LLM...")
            try:
                repo_index = await indexer_service.index_repository(owner, name)
                case_study = await ai_service.analyze_and_generate_case_study(repo_index)
                case_study["id"] = project_id
                case_study["name"] = name
                case_study["owner"] = owner

                db = SessionLocal()
                upsert_project_case_study(db, case_study)
                db.close()
                upgraded_count += 1
                print(f"✅ Upgraded '{name}' -> Title: '{case_study.get('title')}'")
            except Exception as e:
                print(f"⚠️ Error upgrading '{name}': {str(e)}")
        else:
            print(f"✔️ '{name}' already has full deep case study.")

    print(f"\n🎉 Finished! Upgraded {upgraded_count} project case studies with full OpenRouter AI analysis.")

if __name__ == "__main__":
    asyncio.run(upgrade_all_case_studies())
