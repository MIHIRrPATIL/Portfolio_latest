import time
from typing import Dict, Any
from app.agent.tools.base import BaseTool

class LeadDispatchTool(BaseTool):
    """
    Lead & Collaboration Dispatcher Tool.
    Captures visitor contact info, project scope, and collaboration proposals
    into a structured queue ready for the future Admin Notification flow.
    """
    name = "dispatch_lead"
    description = "Captures visitor contact info and project scope for Mihir's collaboration sync."

    async def execute(self, message: str, visitor_name: str = "Visitor", email: str = "", project_scope: str = "", **kwargs) -> Dict[str, Any]:
        payload = {
            "timestamp": time.time(),
            "visitor_name": visitor_name or "Visitor",
            "email": email or "Not specified",
            "project_scope": project_scope or "General Engineering Inquiries",
            "message": message,
            "status": "queued_for_admin"
        }

        print(f"📬 [LEAD DISPATCH QUEUE] Captured inquiry from {payload['visitor_name']} ({payload['email']}): {message}")

        return {
            "success": True,
            "status": "queued",
            "lead_payload": payload,
            "message": "Inquiry recorded into dispatch queue. Mihir will review and sync back directly."
        }

lead_dispatch_tool = LeadDispatchTool()
