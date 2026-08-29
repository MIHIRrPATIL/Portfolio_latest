from typing import List, Dict, Any
from app.agent.nodes.base import BaseNode
from app.agent.state import MasterAgentState
from app.graph.graph_store import graph_store

class GraphRAGNode(BaseNode):
    """
    Executes BM25 search and graph edge traversal across the Knowledge Graph
    to inject precise code snippets, call chains, and project context into state.
    """
    name = "graphrag_retriever"

    async def execute(self, state: MasterAgentState) -> MasterAgentState:
        # Build optimized query representation
        query_parts = [state.user_query]
        if state.target_repo_ids:
            query_parts.extend(state.target_repo_ids)
        if state.target_functions:
            query_parts.extend(state.target_functions)

        query_text = " ".join(query_parts)

        # Retrieve top 4 most relevant AST symbols / subgraphs
        results = graph_store.hybrid_graph_query(query_text, top_k=4)

        context_items = []
        for r in results:
            item = {
                "matched_symbol": r.matched_node.name,
                "node_type": r.matched_node.type,
                "repo_id": r.matched_node.repo_id,
                "file_path": r.matched_node.path,
                "signature": r.matched_node.signature,
                "docstring": r.matched_node.docstring,
                "code_snippet": r.matched_node.code_snippet,
                "parent_project": r.parent_project.name if r.parent_project else r.matched_node.repo_id,
                "called_functions": [f.name for f in r.called_functions],
                "technologies": r.technologies
            }
            context_items.append(item)

        state.graph_context = context_items
        return state

graphrag_node = GraphRAGNode()
