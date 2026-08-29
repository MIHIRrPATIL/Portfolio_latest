from typing import Dict, Any, List
from app.agent.tools.base import BaseTool
from app.graph.graph_store import graph_store

class CodeInspectorTool(BaseTool):
    name = "inspect_code_ast"
    description = "Retrieves the exact code snippet, signature, docstring, and calling dependencies of a function or file."

    async def execute(self, symbol_or_path: str, **kwargs) -> Dict[str, Any]:
        # Perform graph lookup
        results = graph_store.hybrid_graph_query(symbol_or_path, top_k=1)
        if results:
            match = results[0]
            node = match.matched_node
            return {
                "symbol": node.name,
                "type": node.type,
                "path": node.path,
                "signature": node.signature,
                "docstring": node.docstring,
                "code_snippet": node.code_snippet,
                "called_functions": [f.name for f in match.called_functions],
                "technologies": match.technologies
            }

        return {
            "error": f"Symbol or file '{symbol_or_path}' not found in Knowledge Graph."
        }

code_inspector_tool = CodeInspectorTool()
