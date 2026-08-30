import os
import json
import networkx as nx
from typing import Dict, Any, List, Optional, Tuple
from rank_bm25 import BM25Okapi
from app.graph.schema import GraphNode, GraphEdge, NodeType, RelationType, GraphQueryResult

class KnowledgeGraphStore:
    """
    High-Performance Graph Store backed by NetworkX & BM25 Search.
    Manages Project -> File -> Function hierarchy, inter-function call chains,
    and semantic BM25 snippet retrieval.
    """

    def __init__(self):
        self.graph = nx.DiGraph()
        self.storage_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data", "graph_store"
        )
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # BM25 Search Index
        self._bm25_index: Optional[BM25Okapi] = None
        self._indexed_nodes: List[GraphNode] = []
        
        # Auto-load cached subgraphs on startup
        try:
            self.load_all_graphs()
        except Exception as e:
            print(f"Notice loading initial graphs: {str(e)}")

    def add_node(self, node: GraphNode):
        self.graph.add_node(node.id, data=node.model_dump())

    def add_edge(self, edge: GraphEdge):
        self.graph.add_edge(
            edge.source_id,
            edge.target_id,
            relation_type=edge.relation_type,
            properties=edge.properties
        )

    def get_node(self, node_id: str) -> Optional[GraphNode]:
        if node_id in self.graph:
            node_dict = self.graph.nodes[node_id].get("data")
            if node_dict:
                return GraphNode(**node_dict)
            return GraphNode(
                id=node_id,
                type=NodeType.TECHNOLOGY if node_id.startswith("tech:") else NodeType.FUNCTION,
                name=node_id.split(":")[-1],
                repo_id=node_id.split(":")[0] if ":" in node_id else "global"
            )
        return None

    def get_neighbors(self, node_id: str, direction: str = "out") -> List[Tuple[GraphNode, str]]:
        """Returns neighboring nodes and relationship types."""
        results = []
        if node_id not in self.graph:
            return results

        if direction in ["out", "both"]:
            for target in self.graph.successors(node_id):
                edge_data = self.graph.get_edge_data(node_id, target) or {}
                rel = edge_data.get("relation_type", "RELATED_TO")
                node_data = self.get_node(target)
                if node_data:
                    results.append((node_data, rel))

        if direction in ["in", "both"]:
            for source in self.graph.predecessors(node_id):
                edge_data = self.graph.get_edge_data(source, node_id) or {}
                rel = edge_data.get("relation_type", "RELATED_TO")
                node_data = self.get_node(source)
                if node_data:
                    results.append((node_data, rel))

        return results

    def get_call_dependencies(self, func_node_id: str, max_depth: int = 2) -> List[GraphNode]:
        """
        Traverses outbound CALLS edges to discover downstream functions invoked by this function.
        """
        visited = set()
        dependencies = []
        queue = [(func_node_id, 0)]

        while queue:
            curr_id, depth = queue.pop(0)
            if curr_id in visited or depth > max_depth:
                continue
            visited.add(curr_id)

            if curr_id in self.graph:
                for target in self.graph.successors(curr_id):
                    edge_data = self.graph.get_edge_data(curr_id, target) or {}
                    if edge_data.get("relation_type") == RelationType.CALLS:
                        target_node = self.get_node(target)
                        if target_node:
                            dependencies.append(target_node)
                            queue.append((target, depth + 1))

        return dependencies

    def build_bm25_index(self):
        """
        Indexes all function, file, technology, and project nodes into a BM25 ranking structure for instant lexical search.
        """
        self._indexed_nodes = []
        corpus = []

        for node_id in self.graph.nodes:
            node_data = self.get_node(node_id)
            if not node_data:
                continue

            props_str = " ".join(str(v) for v in (node_data.properties or {}).values())
            doc_text = f"{node_data.name} {node_data.repo_id} {node_data.path or ''} {node_data.docstring or ''} {node_data.signature or ''} {node_data.code_snippet or ''} {props_str}"
            tokens = self._tokenize(doc_text)
            if tokens:
                corpus.append(tokens)
                self._indexed_nodes.append(node_data)

        if corpus:
            self._bm25_index = BM25Okapi(corpus)

    def _tokenize(self, text: str) -> List[str]:
        return [t.lower() for t in text.replace("_", " ").replace("-", " ").replace(".", " ").split() if len(t) > 1]

    def bm25_search(self, query: str, top_k: int = 3) -> List[Tuple[GraphNode, float]]:
        """
        Performs BM25 keyword rank search across the entire knowledge graph.
        """
        if not self._bm25_index or not self._indexed_nodes:
            self.build_bm25_index()

        if not self._bm25_index:
            return []

        tokens = self._tokenize(query)
        if not tokens:
            return []

        scores = self._bm25_index.get_scores(tokens)
        scored_pairs = list(zip(self._indexed_nodes, scores))
        scored_pairs.sort(key=lambda x: x[1], reverse=True)

        return [(node, float(score)) for node, score in scored_pairs[:top_k] if score > 0]

    def hybrid_graph_query(self, query: str, top_k: int = 3) -> List[GraphQueryResult]:
        """
        Executes BM25 Lexical Search + Graph Edge Traversal (GraphRAG).
        For each matched node, traverses relationships to retrieve:
        - Parent file & project
        - Downstream called functions
        - Technologies used
        """
        matches = self.bm25_search(query, top_k=top_k)
        results = []

        for node, score in matches:
            # 1. Discover called functions via CALLS edges
            called_funcs = self.get_call_dependencies(node.id, max_depth=2)

            # 2. Discover parent file & project via predecessors
            parent_file = None
            parent_project = None
            technologies = []

            for parent_node, rel in self.get_neighbors(node.id, direction="in"):
                if parent_node.type == NodeType.FILE:
                    parent_file = parent_node
                    # Find project owning this file
                    for proj_node, p_rel in self.get_neighbors(parent_node.id, direction="in"):
                        if proj_node.type == NodeType.PROJECT:
                            parent_project = proj_node

            # 3. Discover technology dependencies
            for target_node, rel in self.get_neighbors(node.id, direction="out"):
                if target_node.type == NodeType.TECHNOLOGY or rel == RelationType.IMPORTS:
                    technologies.append(target_node.name)

            results.append(GraphQueryResult(
                matched_node=node,
                score=score,
                parent_file=parent_file,
                parent_project=parent_project,
                called_functions=called_funcs,
                technologies=technologies,
                dependency_chain=[f.name for f in called_funcs]
            ))

        return results

    def save_project_graph(self, repo_id: str):
        """Saves a project's subgraph to persistent JSON."""
        subgraph_nodes = []
        subgraph_edges = []

        for node_id in self.graph.nodes:
            node_data = self.get_node(node_id)
            if node_data and node_data.repo_id == repo_id:
                subgraph_nodes.append(node_data.model_dump())

        for u, v, data in self.graph.edges(data=True):
            node_u = self.get_node(u)
            if node_u and node_u.repo_id == repo_id:
                subgraph_edges.append({
                    "source_id": u,
                    "target_id": v,
                    "relation_type": data.get("relation_type"),
                    "properties": data.get("properties", {})
                })

        payload = {
            "repo_id": repo_id,
            "nodes_count": len(subgraph_nodes),
            "edges_count": len(subgraph_edges),
            "nodes": subgraph_nodes,
            "edges": subgraph_edges
        }

        path = os.path.join(self.storage_dir, f"{repo_id}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    def save(self):
        """Persists all subgraphs and rebuilds BM25 search index."""
        repos = set()
        for node_id in self.graph.nodes:
            node_data = self.get_node(node_id)
            if node_data and node_data.repo_id and node_data.repo_id != "global":
                repos.add(node_data.repo_id)
        for repo_id in repos:
            self.save_project_graph(repo_id)
        self.build_bm25_index()

    def load_all_graphs(self):
        """Loads all cached project graphs from disk."""
        if not os.path.exists(self.storage_dir):
            return

        self.graph.clear()
        for fname in os.listdir(self.storage_dir):
            if fname.endswith(".json"):
                fpath = os.path.join(self.storage_dir, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        for n in data.get("nodes", []):
                            self.add_node(GraphNode(**n))
                        for e in data.get("edges", []):
                            self.add_edge(GraphEdge(**e))
                except Exception as e:
                    print(f"⚠️ Error loading graph {fname}: {str(e)}")

        self.build_bm25_index()

graph_store = KnowledgeGraphStore()
