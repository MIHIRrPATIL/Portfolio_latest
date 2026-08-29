import hmac
import hashlib
from fastapi import APIRouter, Request, Header, HTTPException, status, BackgroundTasks
from app.config import settings
from app.services.indexer_service import indexer_service
from app.services.ai_service import ai_service
from app.db.session import SessionLocal
from app.db.crud import upsert_project_case_study

router = APIRouter(prefix="/github", tags=["GitHub Webhook"])

def verify_github_signature(payload: bytes, signature_header: str, secret: str) -> bool:
    """
    Verifies that incoming webhook payload signature matches HMAC SHA-256 digest
    generated with GITHUB_WEBHOOK_SECRET.
    """
    if not secret:
        return True

    if not signature_header or not signature_header.startswith("sha256="):
        return False

    expected_signature = signature_header.split("sha256=")[1]
    mac = hmac.new(secret.encode("utf-8"), msg=payload, digestmod=hashlib.sha256)
    computed_signature = mac.hexdigest()

    return hmac.compare_digest(computed_signature, expected_signature)

async def _background_reindex_pushed_repo(owner: str, repo_name: str):
    """Asynchronous background task to re-index ONLY the pushed repository."""
    try:
        print(f"🔔 Webhook push event! Selective re-indexing: {owner}/{repo_name}...")
        repo_index = await indexer_service.index_repository(owner, repo_name)
        case_study = await ai_service.analyze_and_generate_case_study(repo_index)
        
        db = SessionLocal()
        upsert_project_case_study(db, case_study)
        db.close()
        print(f"✅ Successfully updated DB case study for pushed repo: {repo_name}")
    except Exception as e:
        print(f"⚠️ Error re-indexing pushed repo {repo_name}: {str(e)}")

@router.post("/webhook")
async def handle_github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_github_event: str = Header(None, alias="X-GitHub-Event"),
    x_hub_signature_256: str = Header(None, alias="X-Hub-Signature-256")
):
    """
    GitHub Webhook Handler.
    Receives push/repo events, validates HMAC SHA-256 signature, and selectively re-indexes changed repos.
    """
    raw_payload = await request.body()

    # Validate HMAC Signature
    if settings.GITHUB_WEBHOOK_SECRET:
        if not verify_github_signature(raw_payload, x_hub_signature_256, settings.GITHUB_WEBHOOK_SECRET):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid X-Hub-Signature-256 signature. Webhook verification failed."
            )

    json_payload = await request.json()

    # Handle Webhook Ping Event
    if x_github_event == "ping":
        return {
            "status": "success",
            "message": "GitHub Webhook connection verified successfully!",
            "zen": json_payload.get("zen")
        }

    # Handle Push Event
    if x_github_event == "push":
        repo_info = json_payload.get("repository", {})
        full_name = repo_info.get("full_name")
        repo_name = repo_info.get("name")
        owner = repo_info.get("owner", {}).get("login", settings.GITHUB_USERNAME)
        pusher = json_payload.get("pusher", {}).get("name")
        ref = json_payload.get("ref")

        # Selective Re-indexing for ONLY this changed repo in the background
        if repo_name and owner:
            background_tasks.add_task(_background_reindex_pushed_repo, owner, repo_name)

        return {
            "status": "processed",
            "event": "push",
            "repository": full_name,
            "pusher": pusher,
            "branch": ref,
            "message": f"Push event acknowledged for {full_name}. Selective background re-indexing queued."
        }

    # Handle Repository Event
    if x_github_event == "repository":
        action = json_payload.get("action")
        repo_name = json_payload.get("repository", {}).get("full_name")

        return {
            "status": "processed",
            "event": "repository",
            "action": action,
            "repository": repo_name
        }

    return {
        "status": "received",
        "event": x_github_event,
        "message": "Event received successfully."
    }
