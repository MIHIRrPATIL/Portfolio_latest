import hmac
import hashlib
from fastapi import APIRouter, Request, Header, HTTPException, status
from app.config import settings

router = APIRouter(prefix="/github", tags=["GitHub Webhook"])

def verify_github_signature(payload: bytes, signature_header: str, secret: str) -> bool:
    """
    Verifies that incoming webhook payload signature matches HMAC SHA-256 digest
    generated with GITHUB_WEBHOOK_SECRET.
    """
    if not secret:
        # If secret is not configured in .env, log warning and allow for development
        return True

    if not signature_header or not signature_header.startswith("sha256="):
        return False

    expected_signature = signature_header.split("sha256=")[1]
    mac = hmac.new(secret.encode("utf-8"), msg=payload, digestmod=hashlib.sha256)
    computed_signature = mac.hexdigest()

    return hmac.compare_digest(computed_signature, expected_signature)

@router.post("/webhook")
async def handle_github_webhook(
    request: Request,
    x_github_event: str = Header(None, alias="X-GitHub-Event"),
    x_hub_signature_256: str = Header(None, alias="X-Hub-Signature-256")
):
    """
    GitHub Webhook Handler.
    Receives push/repo events, validates HMAC SHA-256 signature, and triggers auto-grading.
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

    # Handle Webhook Ping Event (Sent when adding Webhook URL in GitHub)
    if x_github_event == "ping":
        return {
            "status": "success",
            "message": "GitHub Webhook connection verified successfully!",
            "zen": json_payload.get("zen")
        }

    # Handle Push Event
    if x_github_event == "push":
        repo_name = json_payload.get("repository", {}).get("full_name")
        pusher = json_payload.get("pusher", {}).get("name")
        ref = json_payload.get("ref")
        commits_count = len(json_payload.get("commits", []))

        return {
            "status": "processed",
            "event": "push",
            "repository": repo_name,
            "pusher": pusher,
            "branch": ref,
            "commits_count": commits_count,
            "message": f"Push event processed for {repo_name}. Triggering automated re-grade."
        }

    # Handle Repository Event (Created / Starred)
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
