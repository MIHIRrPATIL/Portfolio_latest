from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from enum import Enum

class AgentIntent(str, Enum):
    PROJECT_EXPLAIN = "PROJECT_EXPLAIN"
    CODE_DEEPDIVE = "CODE_DEEPDIVE"
    TECH_STACK_QUERY = "TECH_STACK_QUERY"
    CAREER_EXPERIENCE = "CAREER_EXPERIENCE"
    COLLABORATION = "COLLABORATION"
    DATABASE_ANALYTICS = "DATABASE_ANALYTICS"
    GENERAL_CHITCHAT = "GENERAL_CHITCHAT"

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text content")

class ToolCallPayload(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)

class ToolResultPayload(BaseModel):
    tool_name: str
    result: Any
    success: bool = True
    error: Optional[str] = None

class MasterAgentState(BaseModel):
    # Session & Identification
    session_id: str
    visitor_id: Optional[str] = None
    user_query: str
    chat_history: List[ChatMessage] = Field(default_factory=list)
    pathname: Optional[str] = None
    page_context: Optional[Dict[str, Any]] = None

    # Cognitive Context (Shodh Memory)
    episodic_context: List[Dict[str, Any]] = Field(default_factory=list)
    user_persona: Dict[str, Any] = Field(default_factory=dict)

    # Inferred Intent & Extracted Entities
    intent: Optional[AgentIntent] = None
    target_repo_ids: List[str] = Field(default_factory=list)
    target_functions: List[str] = Field(default_factory=list)

    # GraphRAG & Multi-Source Retrieved Knowledge
    graph_context: List[Dict[str, Any]] = Field(default_factory=list)
    relevant_projects: List[Dict[str, Any]] = Field(default_factory=list)
    relevant_achievements: List[Dict[str, Any]] = Field(default_factory=list)
    case_study_context: Optional[Dict[str, Any]] = None

    # Autonomous Tool Calls
    tool_calls: List[ToolCallPayload] = Field(default_factory=list)
    tool_results: List[ToolResultPayload] = Field(default_factory=list)

    # Output & UI Interactive Badges
    final_text: str = ""
    llm_provider: Optional[str] = None
    ui_badges: List[Dict[str, str]] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)
