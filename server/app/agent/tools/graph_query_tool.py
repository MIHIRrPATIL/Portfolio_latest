from typing import Dict, Any, List
from app.agent.tools.base import BaseTool
from app.graph.graph_store import graph_store

class GraphRAGQueryTool(BaseTool):
    """
    Autonomous GraphRAG Query Tool:
    Allows the AI Agent to perform BM25 semantic queries over code functions,
    docstrings, technologies, and follow multi-hop CALLS and IMPORTS edges.
    """
    name = "query_knowledge_graph"
    description = "Searches the Code AST Knowledge Graph for functions, files, docstrings, and call chains using BM25 and graph traversal."

    async def execute(self, query: str, top_k: int = 3, **kwargs) -> Dict[str, Any]:
        if graph_store.graph.number_of_nodes() == 0:
            graph_store.load_all_graphs()

        results = graph_store.hybrid_graph_query(query, top_k=top_k)
        
        matches = []
        for r in results:
            matches.append({
                "symbol": r.matched_node.name,
                "type": r.matched_node.type,
                "repo_id": r.matched_node.repo_id,
                "path": r.matched_node.path,
                "signature": r.matched_node.signature,
                "docstring": r.matched_node.docstring,
                "code_snippet": r.matched_node.code_snippet,
                "called_functions": [f.name for f in r.called_functions],
                "technologies": r.technologies
            })

        return {
            "query": query,
            "matched_count": len(matches),
            "results": matches
        }

graph_query_tool = GraphRAGQueryTool()
