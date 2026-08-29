import time
from typing import Dict, Any, List, Optional
from app.agent.nodes.base import BaseNode
from app.agent.state import MasterAgentState, ChatMessage

class InMemorySessionStore:
    """
    High-Performance In-Memory Shodh Session Memory.
    Maintains active conversational context, user preferences, and explored entities
    per session with automatic sliding window retention.
    """
    def __init__(self, max_sessions: int = 500, max_turns: int = 16):
        self.max_sessions = max_sessions
        self.max_turns = max_turns
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.session_timestamps: Dict[str, float] = {}

    def get_session(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.sessions:
            if len(self.sessions) >= self.max_sessions:
                # Evict oldest session
                oldest = min(self.session_timestamps.items(), key=lambda x: x[1])[0]
                self.sessions.pop(oldest, None)
                self.session_timestamps.pop(oldest, None)

            self.sessions[session_id] = {
                "turns": [],
                "explored_repos": set(),
                "user_interests": set(),
                "lead_details": {}
            }
        self.session_timestamps[session_id] = time.time()
        return self.sessions[session_id]

    def record_turn(self, session_id: str, user_text: str, assistant_text: str, repos: List[str] = None):
        session = self.get_session(session_id)
        session["turns"].append({"role": "user", "content": user_text, "ts": time.time()})
        session["turns"].append({"role": "assistant", "content": assistant_text, "ts": time.time()})

        # Trim turns to max window
        if len(session["turns"]) > self.max_turns * 2:
            session["turns"] = session["turns"][-self.max_turns * 2:]

        if repos:
            for r in repos:
                session["explored_repos"].add(r)

    def record_lead(self, session_id: str, lead_data: Dict[str, Any]):
        session = self.get_session(session_id)
        session["lead_details"].update(lead_data)

shodh_store = InMemorySessionStore()

class ShodhMemoryRecallNode(BaseNode):
    """
    Recalls episodic conversational memories, topic threads, and user preferences from Shodh Memory.
    """
    name = "shodh_memory_recall"

    async def execute(self, state: MasterAgentState) -> MasterAgentState:
        session = shodh_store.get_session(state.session_id)
        
        # Populate episodic context
        episodic_items = []
        if session["explored_repos"]:
            episodic_items.append({
                "type": "previously_explored_projects",
                "projects": list(session["explored_repos"])
            })

        if session["lead_details"]:
            episodic_items.append({
                "type": "visitor_contact_info",
                "details": session["lead_details"]
            })

        # Restore past conversation turns if chat_history was empty
        if not state.chat_history and session["turns"]:
            state.chat_history = [
                ChatMessage(role=t["role"], content=t["content"]) 
                for t in session["turns"]
            ]

        state.episodic_context = episodic_items
        return state

class ShodhMemoryCommitNode(BaseNode):
    """
    Commits current turn entities, Q&A pairs, and visitor insights into Shodh Memory.
    """
    name = "shodh_memory_commit"

    async def execute(self, state: MasterAgentState) -> MasterAgentState:
        if state.final_text:
            shodh_store.record_turn(
                session_id=state.session_id,
                user_text=state.user_query,
                assistant_text=state.final_text,
                repos=state.target_repo_ids
            )
        return state

shodh_recall_node = ShodhMemoryRecallNode()
shodh_commit_node = ShodhMemoryCommitNode()
