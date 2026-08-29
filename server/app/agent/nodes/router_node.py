import re
from typing import List, Dict, Optional
from app.agent.nodes.base import BaseNode
from app.agent.state import MasterAgentState, AgentIntent

PROJECT_ALIASES: Dict[str, List[str]] = {
    "cdac-asr": ["cdac-asr", "cdac_asr", "cdac asr", "cdac", "cdac speech"],
    "vaultagent": ["vaultagent", "vault agent", "vault_agent"],
    "reflectos": ["reflectos", "reflect os", "reflect_os", "cloud os", "web desktop"],
    "hireai": ["hireai", "hire ai", "hire_ai", "mock interview system"],
    "ipd": ["ipd", "federated learning", "incremental learning", "fedavg"],
    "greekslab": ["greekslab", "greeks lab", "greeks_lab", "black scholes", "options pricing"],
    "niti-ai": ["niti-ai", "niti ai", "niti_ai", "nitiai", "legal intelligence"],
    "synapse": ["synapse engine", "synapse", "neural search engine"],
    "hi-pace-wealth": ["hi-pace-wealth", "hipace wealth", "hi-pace", "hipace"]
}

class IntentRouterNode(BaseNode):
    """
    Classifies user intent and extracts target repository and code entities from the query,
    dynamically incorporating client active route and page context with strict word-boundary matching.
    """
    name = "intent_router"

    async def execute(self, state: MasterAgentState) -> MasterAgentState:
        q_lower = state.user_query.lower().strip()
        pathname = (state.pathname or "").strip().lower()
        page_ctx = state.page_context or {}

        # 0. Detect active project from page context or route slug
        active_repo_from_route: Optional[str] = page_ctx.get("active_project_id") or page_ctx.get("id")
        if not active_repo_from_route and pathname.startswith("/projects/"):
            slug = pathname.replace("/projects/", "").split("/")[0].split("?")[0].strip()
            if slug:
                active_repo_from_route = slug

        # 1. Entity Extraction with Strict Word Boundary Matching
        found_repos = set()
        for repo_id, aliases in PROJECT_ALIASES.items():
            for alias in aliases:
                pattern = rf"\b{re.escape(alias.lower())}\b"
                if re.search(pattern, q_lower):
                    found_repos.add(repo_id)
                    break

        # Contextual inheritance: If query refers to "this", "the project", "here", or asks general architectural questions while on a project page
        context_triggers = ["this", "here", "it", "the project", "architecture", "tech stack", "languages", "metrics", "demo", "repo", "how does it work", "capabilities", "features", "deployment", "github"]
        if not found_repos and active_repo_from_route and (any(t in q_lower for t in context_triggers) or len(q_lower.split()) <= 6):
            for k in PROJECT_ALIASES.keys():
                if k in active_repo_from_route or active_repo_from_route in k:
                    found_repos.add(k)
                    break
            if not found_repos:
                found_repos.add(active_repo_from_route)

        state.target_repo_ids = list(found_repos)

        # 2. Extract potential function / symbol names (e.g. `def evaluate_candidate`, `scan_vault()`)
        symbol_matches = re.findall(r"(?:def|function|class)?\s*([a-zA-Z_][a-zA-Z0-9_]{3,})\s*(?:\(|$)", q_lower)
        clean_symbols = [s for s in symbol_matches if s not in ["what", "how", "tell", "explain", "show", "give", "code", "file", "this", "here"]]
        state.target_functions = clean_symbols

        # 3. Intent Classification with Route Context
        if any(w in q_lower for w in ["hire", "collaborate", "contact", "email", "schedule", "freelance", "reach out", "work with", "call"]):
            state.intent = AgentIntent.COLLABORATION
        elif any(w in q_lower for w in ["grade", "score", "ranked", "ranking", "database", "sql", "top rated", "how many repos", "statistics"]):
            state.intent = AgentIntent.DATABASE_ANALYTICS
        elif pathname == "/graph" and any(w in q_lower for w in ["graph", "node", "edge", "relation", "clusters", "connection", "rag", "graphrag"]):
            state.intent = AgentIntent.TECH_STACK_QUERY
        elif state.target_functions or any(w in q_lower for w in ["function", "code snippet", "ast", "signature", "class", "def ", "source code", "implementation", "call graph"]):
            state.intent = AgentIntent.CODE_DEEPDIVE
        elif any(w in q_lower for w in ["tech", "stack", "framework", "library", "python", "typescript", "rust", "go", "react", "nextjs", "three.js"]):
            state.intent = AgentIntent.TECH_STACK_QUERY
        elif any(w in q_lower for w in ["experience", "career", "background", "education", "hackathon", "cdac research", "intern", "bio"]):
            state.intent = AgentIntent.CAREER_EXPERIENCE
        elif state.target_repo_ids or any(w in q_lower for w in ["project", "build", "architecture", "demo", "overview", "what did you make"]):
            state.intent = AgentIntent.PROJECT_EXPLAIN
        else:
            state.intent = AgentIntent.GENERAL_CHITCHAT

        return state

intent_router_node = IntentRouterNode()
