import json
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.agent.state import MasterAgentState, ChatMessage
from app.agent.nodes.memory_node import shodh_recall_node, shodh_commit_node
from app.agent.nodes.router_node import intent_router_node
from app.agent.nodes.graphrag_node import graphrag_node
from app.agent.nodes.tool_node import tool_execution_node
from app.agent.nodes.synth_node import synth_node

class MasterAgentOrchestrator:
    """
    Master Agentic Workflow Orchestrator.
    Coordinates Shodh memory recall, route context resolution, intent routing, GraphRAG retrieval,
    autonomous tool execution, and streamed persona response generation.
    """

    async def run(
        self,
        session_id: str,
        user_query: str,
        chat_history: List[Dict[str, str]] = None,
        pathname: Optional[str] = None,
        page_context: Optional[Dict[str, Any]] = None
    ) -> MasterAgentState:
        history_msgs = [ChatMessage(**m) for m in (chat_history or [])]
        state = MasterAgentState(
            session_id=session_id,
            user_query=user_query,
            chat_history=history_msgs,
            pathname=pathname,
            page_context=page_context or {}
        )

        # 1. Shodh Memory Recall
        state = await shodh_recall_node.execute(state)

        # 2. Intent & Entity Routing
        state = await intent_router_node.execute(state)

        # 3. GraphRAG Knowledge Retrieval
        state = await graphrag_node.execute(state)

        # 4. Tool Execution Loop
        state = await tool_execution_node.execute(state)

        # 5. Response Synthesis
        state = await synth_node.execute(state)

        # 6. Shodh Memory Commit
        state = await shodh_commit_node.execute(state)

        return state

    async def stream(
        self,
        session_id: str,
        user_query: str,
        chat_history: List[Dict[str, str]] = None,
        pathname: Optional[str] = None,
        page_context: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        history_msgs = [ChatMessage(**m) for m in (chat_history or [])]
        state = MasterAgentState(
            session_id=session_id,
            user_query=user_query,
            chat_history=history_msgs,
            pathname=pathname,
            page_context=page_context or {}
        )

        # 1. Shodh Memory Recall
        state = await shodh_recall_node.execute(state)

        # 2. Intent & Entity Routing
        state = await intent_router_node.execute(state)

        # 3. GraphRAG Knowledge Retrieval
        state = await graphrag_node.execute(state)

        # 4. Tool Execution Loop
        state = await tool_execution_node.execute(state)

        # Send initial metadata header (JSON event)
        meta_event = {
            "type": "meta",
            "intent": state.intent,
            "target_repos": state.target_repo_ids,
            "graph_matches_count": len(state.graph_context),
            "tool_calls_count": len(state.tool_calls),
            "ui_badges": state.ui_badges,
            "pathname": state.pathname,
            "page_context": state.page_context
        }
        yield f"event: meta\ndata: {json.dumps(meta_event)}\n\n"

        # 5. Stream LLM Tokens
        async for token in synth_node.stream_execute(state):
            token_event = {"type": "token", "content": token}
            yield f"event: token\ndata: {json.dumps(token_event)}\n\n"

        # 6. Shodh Memory Commit
        state = await shodh_commit_node.execute(state)

        # Send final completion event
        done_event = {
            "type": "done",
            "provider": state.llm_provider,
            "ui_badges": state.ui_badges,
            "suggested_followups": state.suggested_followups
        }
        yield f"event: done\ndata: {json.dumps(done_event)}\n\n"

agent_orchestrator = MasterAgentOrchestrator()
