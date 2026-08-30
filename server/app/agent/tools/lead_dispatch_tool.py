import time
from typing import Dict, Any
from app.agent.tools.base import BaseTool
from app.db.session import SessionLocal
from app.db.crud import create_visitor_lead

class LeadDispatchTool(BaseTool):
    """
    Lead & Collaboration Dispatcher Tool.
    Captures visitor contact info, project scope, and collaboration proposals
    into PostgreSQL database table `visitor_leads` for the Admin Inbox.
    """
    name = "dispatch_lead"
    description = "Captures visitor contact info and project scope for Mihir's collaboration sync."

    async def execute(self, message: str, visitor_name: str = "Visitor", email: str = "", project_scope: str = "", **kwargs) -> Dict[str, Any]:
        payload = {
            "visitor_name": visitor_name or "Visitor",
            "email": email or "Not specified",
            "project_scope": project_scope or "General Engineering Collaboration",
            "message": message,
            "status": "pending"
        }

        lead_id = None
        try:
            with SessionLocal() as db:
                created = create_visitor_lead(db, payload)
                lead_id = created.id
        except Exception as e:
            print(f"⚠️ Error persisting lead to DB: {str(e)}")

        # Dispatch async email notification in background
        try:
            from app.services.email_service import email_service
            import asyncio
            asyncio.create_task(
                email_service.send_lead_notification(
                    visitor_name=payload["visitor_name"],
                    email=payload["email"],
                    project_scope=payload["project_scope"],
                    message=payload["message"],
                    lead_id=lead_id
                )
            )
        except Exception as e:
            print(f"⚠️ Error initiating background email task: {str(e)}")

        print(f"📬 [LEAD DISPATCH QUEUE #{lead_id}] Captured inquiry from {payload['visitor_name']} ({payload['email']}): {message}")

        return {
            "success": True,
            "status": "queued",
            "lead_id": lead_id,
            "lead_payload": payload,
            "message": "Inquiry recorded directly into Mihir's Admin Inbox. Mihir will review and sync back directly."
        }

lead_dispatch_tool = LeadDispatchTool()
