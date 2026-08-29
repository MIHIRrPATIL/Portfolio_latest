from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.agent.orchestrator import agent_orchestrator

router = APIRouter(prefix="/agent", tags=["Agentic AI Chatbot"])

class ChatRequest(BaseModel):
    session_id: str = Field(default="default_session")
    query: str = Field(..., min_length=1, description="User question or prompt")
    chat_history: List[Dict[str, str]] = Field(default_factory=list)
    pathname: Optional[str] = Field(default=None, description="Active client route path (e.g. /projects/cdac-asr, /graph, /)")
    page_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadata of currently viewed page/project")

@router.post("/chat")
async def chat_with_agent(req: ChatRequest):
    """
    Synchronous Chat Endpoint:
    Runs the Master Agentic Workflow and returns full response, GraphRAG context, and UI badges.
    """
    state = await agent_orchestrator.run(
        session_id=req.session_id,
        user_query=req.query,
        chat_history=req.chat_history,
        pathname=req.pathname,
        page_context=req.page_context
    )
    return {
        "session_id": state.session_id,
        "intent": state.intent,
        "target_repos": state.target_repo_ids,
        "response": state.final_text,
        "ui_badges": state.ui_badges,
        "suggested_followups": state.suggested_followups,
        "graph_context_count": len(state.graph_context),
        "pathname": state.pathname,
        "page_context": state.page_context
    }

@router.post("/stream")
async def stream_chat_with_agent(req: ChatRequest):
    """
    Server-Sent Events (SSE) Streaming Endpoint:
    Streams LLM persona tokens, GraphRAG metadata, and UI badge chips in real time.
    """
    return StreamingResponse(
        agent_orchestrator.stream(
            session_id=req.session_id,
            user_query=req.query,
            chat_history=req.chat_history,
            pathname=req.pathname,
            page_context=req.page_context
        ),
        media_type="text/event-stream"
    )
