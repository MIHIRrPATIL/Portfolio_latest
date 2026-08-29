import re
from typing import List, Dict, Any
from app.agent.nodes.base import BaseNode
from app.agent.state import MasterAgentState, AgentIntent, ToolCallPayload, ToolResultPayload
from app.agent.tools.live_demo_tool import live_demo_tool
from app.agent.tools.code_inspector_tool import code_inspector_tool
from app.agent.tools.lead_dispatch_tool import lead_dispatch_tool
from app.agent.tools.database_query_tool import database_query_tool
from app.agent.tools.graph_query_tool import graph_query_tool
from app.agent.tools.github_code_search_tool import github_code_search_tool

class ToolExecutionNode(BaseNode):
    """
    Autonomous Tool Execution Node.
    Evaluates state and executes registered tools:
    - GraphRAG Knowledge Graph Search
    - Read-Only RBAC PostgreSQL Database Query Proxy
    - Live Deployment URL Resolver
    - Code AST Inspector
    - GitHub Live Repository & Source Code Search
    - Lead Dispatcher
    """
    name = "tool_execution_node"

    async def execute(self, state: MasterAgentState) -> MasterAgentState:
        q_lower = state.user_query.lower()

        # 1. Autonomous Database Query (via RBAC Proxy)
        if state.intent == AgentIntent.DATABASE_ANALYTICS or any(w in q_lower for w in ["grade", "score", "ranked", "ranking", "how many repos", "database", "sql", "top rated", "case studies"]):
            # Synthesize safe read-only query
            sql = "SELECT repo_name, score, grade, language, stars FROM repository_grades ORDER BY score DESC LIMIT 5"
            if "case studies" in q_lower or "featured" in q_lower or "projects list" in q_lower:
                sql = "SELECT id, title, category, live_url FROM project_case_studies WHERE is_featured = true LIMIT 6"
            elif "python" in q_lower:
                sql = "SELECT repo_name, score, grade FROM repository_grades WHERE language = 'Python' ORDER BY score DESC LIMIT 5"
            elif "rust" in q_lower or "tauri" in q_lower:
                sql = "SELECT repo_name, score, grade FROM repository_grades WHERE language ILIKE '%Rust%' ORDER BY score DESC LIMIT 5"

            state.tool_calls.append(ToolCallPayload(
                tool_name=database_query_tool.name,
                arguments={"sql_query": sql}
            ))
            res = await database_query_tool.execute(sql_query=sql)
            state.tool_results.append(ToolResultPayload(
                tool_name=database_query_tool.name,
                result=res
            ))

        # 2. Live Demo URL Resolver
        if any(w in q_lower for w in ["live", "demo", "deploy", "website", "url", "link", "app", "view"]) and state.target_repo_ids:
            for repo_id in state.target_repo_ids:
                state.tool_calls.append(ToolCallPayload(
                    tool_name=live_demo_tool.name,
                    arguments={"repo_id": repo_id}
                ))
                res = await live_demo_tool.execute(repo_id=repo_id)
                state.tool_results.append(ToolResultPayload(
                    tool_name=live_demo_tool.name,
                    result=res
                ))
                if res.get("live_url"):
                    state.ui_badges.append({
                        "label": f"Live Demo: {repo_id.upper()}",
                        "url": res["live_url"]
                    })

        # 3. Live GitHub Source File / Repo Search
        file_path_match = re.search(r"[\w/-]+\.(?:py|ts|tsx|js|jsx|rs|go|json|md|toml|yml|yaml|sql)", q_lower)
        should_inspect_code = (
            any(w in q_lower for w in [
                "github", "file tree", "source file", "show me file", "raw code", "commits", "contents of",
                "search through", "search the codebase", "search codebase", "in the code", "what model",
                "default model", "default ai model", "which model", "writing agents", "codebase"
            ])
            or file_path_match
            or (state.intent == AgentIntent.CODE_DEEPDIVE and len(state.graph_context) < 3)
        )

        if should_inspect_code:
            target_repo = state.target_repo_ids[0] if state.target_repo_ids else "VaultAgent"
            target_file = file_path_match.group(0) if file_path_match else None

            state.tool_calls.append(ToolCallPayload(
                tool_name=github_code_search_tool.name,
                arguments={"repo_name": target_repo, "file_path": target_file, "query": state.user_query}
            ))
            res = await github_code_search_tool.execute(repo_name=target_repo, file_path=target_file, query=state.user_query)
            state.tool_results.append(ToolResultPayload(
                tool_name=github_code_search_tool.name,
                result=res
            ))

        # 4. Code AST Inspector (for targeted deep dive queries)
        if state.intent == AgentIntent.CODE_DEEPDIVE and state.target_functions:
            for func_name in state.target_functions[:2]:
                state.tool_calls.append(ToolCallPayload(
                    tool_name=code_inspector_tool.name,
                    arguments={"symbol_or_path": func_name}
                ))
                res = await code_inspector_tool.execute(symbol_or_path=func_name)
                state.tool_results.append(ToolResultPayload(
                    tool_name=code_inspector_tool.name,
                    result=res
                ))

        # 5. Collaboration & Lead Dispatch
        if state.intent == AgentIntent.COLLABORATION:
            has_contact_info = bool(re.search(r"[\w.-]+@[\w.-]+\.\w+|@[\w_]+|\b\d{10}\b", state.user_query))
            if has_contact_info:
                state.tool_calls.append(ToolCallPayload(
                    tool_name=lead_dispatch_tool.name,
                    arguments={"message": state.user_query}
                ))
                res = await lead_dispatch_tool.execute(message=state.user_query)
                state.tool_results.append(ToolResultPayload(
                    tool_name=lead_dispatch_tool.name,
                    result=res
                ))
            
            state.ui_badges.append({
                "type": "contact_sync",
                "label": "Schedule Collaboration Sync",
                "url": "/#connect"
            })

        return state

tool_execution_node = ToolExecutionNode()
