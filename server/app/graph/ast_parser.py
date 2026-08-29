import ast
import re
from typing import List, Tuple, Dict, Any, Set
from app.graph.schema import GraphNode, GraphEdge, NodeType, RelationType

class PythonASTVisitor(ast.NodeVisitor):
    """
    AST Visitor that traverses Python abstract syntax trees to extract:
    - Top-level and class-level functions
    - Function signatures, docstrings, code snippets
    - Function call hierarchy (Function A -> CALLS -> Function B)
    - Module imports
    """
    def __init__(self, repo_id: str, file_path: str, source_lines: List[str]):
        self.repo_id = repo_id
        self.file_path = file_path
        self.source_lines = source_lines
        self.nodes: List[GraphNode] = []
        self.edges: List[GraphEdge] = []
        self.current_function: Optional[str] = None
        self.defined_functions: Set[str] = set()
        self.file_imports: Set[str] = set()

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            self.file_imports.add(alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module:
            self.file_imports.add(node.module)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self._process_function(node, is_async=False)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self._process_function(node, is_async=True)

    def _process_function(self, node, is_async: bool):
        func_name = node.name
        self.defined_functions.add(func_name)
        
        # Determine line numbers
        start_line = node.lineno
        end_line = getattr(node, 'end_lineno', start_line + len(node.body))
        snippet = "\n".join(self.source_lines[start_line - 1 : end_line])

        # Extract arguments signature
        args_list = [arg.arg for arg in node.args.args]
        sig = f"{'async ' if is_async else ''}def {func_name}({', '.join(args_list)})"

        # Extract docstring
        docstring = ast.get_docstring(node) or ""

        func_id = f"{self.repo_id}:{self.file_path}:{func_name}"

        # Create Function Node
        func_node = GraphNode(
            id=func_id,
            type=NodeType.FUNCTION,
            name=func_name,
            repo_id=self.repo_id,
            path=self.file_path,
            signature=sig,
            docstring=docstring,
            code_snippet=snippet[:2500], # Cap max snippet size
            start_line=start_line,
            end_line=end_line,
            properties={"is_async": is_async, "args": args_list}
        )
        self.nodes.append(func_node)

        # Connect File -> DEFINES -> Function
        file_node_id = f"{self.repo_id}:{self.file_path}"
        self.edges.append(GraphEdge(
            source_id=file_node_id,
            target_id=func_id,
            relation_type=RelationType.DEFINES
        ))

        # Inspect internal function calls
        previous_func = self.current_function
        self.current_function = func_id
        
        # Traverse body to find Call expressions
        for stmt in node.body:
            for call_node in ast.walk(stmt):
                if isinstance(call_node, ast.Call):
                    callee_name = None
                    if isinstance(call_node.func, ast.Name):
                        callee_name = call_node.func.id
                    elif isinstance(call_node.func, ast.Attribute):
                        callee_name = call_node.func.attr

                    if callee_name and callee_name != func_name:
                        # Target can be local function or imported module
                        target_id = f"{self.repo_id}:{self.file_path}:{callee_name}"
                        self.edges.append(GraphEdge(
                            source_id=func_id,
                            target_id=target_id,
                            relation_type=RelationType.CALLS,
                            properties={"callee_name": callee_name}
                        ))

        self.current_function = previous_func

class CodeASTExtractor:
    """
    Multi-language AST & Call Graph Extractor.
    Parses Python, TypeScript, JavaScript, Go, and Rust source files
    into structured GraphNodes and inter-function Call edges.
    """

    @staticmethod
    def parse_python(repo_id: str, file_path: str, source_code: str) -> Tuple[List[GraphNode], List[GraphEdge]]:
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []

        file_node_id = f"{repo_id}:{file_path}"
        
        # Create File Node
        file_node = GraphNode(
            id=file_node_id,
            type=NodeType.FILE,
            name=file_path.split("/")[-1],
            repo_id=repo_id,
            path=file_path,
            properties={"language": "Python", "loc": len(source_code.splitlines())}
        )
        nodes.append(file_node)

        # Connect Project -> CONTAINS_FILE -> File
        edges.append(GraphEdge(
            source_id=repo_id,
            target_id=file_node_id,
            relation_type=RelationType.CONTAINS_FILE
        ))

        try:
            tree = ast.parse(source_code)
            source_lines = source_code.splitlines()
            visitor = PythonASTVisitor(repo_id, file_path, source_lines)
            visitor.visit(tree)

            nodes.extend(visitor.nodes)
            edges.extend(visitor.edges)

            # Add IMPORTS edges
            for imp in visitor.file_imports:
                edges.append(GraphEdge(
                    source_id=file_node_id,
                    target_id=f"tech:{imp.lower()}",
                    relation_type=RelationType.IMPORTS,
                    properties={"module": imp}
                ))
        except Exception as e:
            # Fall back to regex parser for truncated/partial source files
            gen_nodes, gen_edges = CodeASTExtractor.parse_generic(repo_id, file_path, source_code, "Python")
            nodes.extend([n for n in gen_nodes if n.type == NodeType.FUNCTION])
            edges.extend([e for e in gen_edges if getattr(e, 'relation_type', '') == RelationType.DEFINES])

        return nodes, edges

    @staticmethod
    def parse_generic(repo_id: str, file_path: str, source_code: str, language: str) -> Tuple[List[GraphNode], List[GraphEdge]]:
        """
        Extracts functions and components from TypeScript, JavaScript, Go, or Rust using regex analysis.
        """
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []

        file_node_id = f"{repo_id}:{file_path}"
        file_node = GraphNode(
            id=file_node_id,
            type=NodeType.FILE,
            name=file_path.split("/")[-1],
            repo_id=repo_id,
            path=file_path,
            properties={"language": language, "loc": len(source_code.splitlines())}
        )
        nodes.append(file_node)
        edges.append(GraphEdge(
            source_id=repo_id,
            target_id=file_node_id,
            relation_type=RelationType.CONTAINS_FILE
        ))

        # Regex for JS/TS functions & components
        func_patterns = [
            r'(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)',
            r'(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>',
            r'func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)', # Go
            r'pub\s+(?:async\s+)?fn\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)'   # Rust
        ]

        lines = source_code.splitlines()
        for idx, line in enumerate(lines):
            for pat in func_patterns:
                match = re.search(pat, line)
                if match:
                    func_name = match.group(1)
                    params = match.group(2) if len(match.groups()) > 1 else ""
                    func_id = f"{repo_id}:{file_path}:{func_name}"

                    # Slice a 30-line code snippet window
                    snippet = "\n".join(lines[idx : min(idx + 35, len(lines))])
                    
                    fn_node = GraphNode(
                        id=func_id,
                        type=NodeType.FUNCTION,
                        name=func_name,
                        repo_id=repo_id,
                        path=file_path,
                        signature=f"{func_name}({params})",
                        code_snippet=snippet,
                        start_line=idx + 1,
                        properties={"language": language}
                    )
                    nodes.append(fn_node)
                    edges.append(GraphEdge(
                        source_id=file_node_id,
                        target_id=func_id,
                        relation_type=RelationType.DEFINES
                    ))
                    break

        return nodes, edges

    @classmethod
    def extract(cls, repo_id: str, file_path: str, source_code: str) -> Tuple[List[GraphNode], List[GraphEdge]]:
        ext = file_path.split(".")[-1].lower() if "." in file_path else ""
        if ext == "py":
            return cls.parse_python(repo_id, file_path, source_code)
        elif ext in ["ts", "tsx"]:
            return cls.parse_generic(repo_id, file_path, source_code, "TypeScript")
        elif ext in ["js", "jsx"]:
            return cls.parse_generic(repo_id, file_path, source_code, "JavaScript")
        elif ext == "go":
            return cls.parse_generic(repo_id, file_path, source_code, "Go")
        elif ext == "rs":
            return cls.parse_generic(repo_id, file_path, source_code, "Rust")
        else:
            return [], []
