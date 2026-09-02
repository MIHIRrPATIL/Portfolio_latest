from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, List, Optional
from app.graph.graph_store import graph_store
from app.graph.schema import GraphQueryResult

router = APIRouter(prefix="/graph", tags=["Knowledge Graph"])

@router.get("/query", response_model=List[GraphQueryResult])
async def query_knowledge_graph(
    q: str = Query(..., description="Query phrase or code concept (e.g. 'audio phoneme alignment')"),
    top_k: int = Query(3, ge=1, le=10, description="Max matched nodes to return")
):
    """
    GraphRAG Query Endpoint:
    Performs BM25 search over all repository function/file nodes
    and traverses edges to return downstream called functions, parent files, and technologies.
    """
    results = graph_store.hybrid_graph_query(q, top_k=top_k)
    return results

@router.get("/project/{repo_id}")
async def get_project_graph(repo_id: str):
    """
    Returns the complete subgraph for a specific project.
    """
    normalized_id = repo_id.lower().replace("_", "-")
    nodes = []
    edges = []

    for node_id in graph_store.graph.nodes:
        node = graph_store.get_node(node_id)
        if node and (node.repo_id == normalized_id or node.id == normalized_id):
            nodes.append(node.model_dump())

    for u, v, data in graph_store.graph.edges(data=True):
        node_u = graph_store.get_node(u)
        if node_u and (node_u.repo_id == normalized_id or node_u.id == normalized_id):
            edges.append({
                "source": u,
                "target": v,
                "relation": data.get("relation_type", "RELATED")
            })

    if not nodes:
        raise HTTPException(status_code=404, detail=f"No graph found for project '{repo_id}'")

    return {
        "repo_id": normalized_id,
        "nodes_count": len(nodes),
        "edges_count": len(edges),
        "nodes": nodes,
        "edges": edges
    }

@router.get("/all")
@router.get("/data")
async def get_all_graphs(project: Optional[str] = Query(None, description="Optional repo_id filter")):
    """
    Returns nodes and edges for the Neural Graph visualizer.
    """
    if graph_store.graph.number_of_nodes() == 0:
        graph_store.load_all_graphs()

    nodes = []
    edges = []
    filter_proj = project.lower().replace("_", "-") if project else None

    for node_id in graph_store.graph.nodes:
        node = graph_store.get_node(node_id)
        if not node:
            continue
        if filter_proj and node.repo_id != filter_proj and node.id != filter_proj:
            continue
        nodes.append(node.model_dump())

    allowed_node_ids = {n["id"] for n in nodes}

    for u, v, data in graph_store.graph.edges(data=True):
        if u in allowed_node_ids and v in allowed_node_ids:
            edges.append({
                "source": u,
                "target": v,
                "relation": data.get("relation_type", "RELATED")
            })

    # Extract list of all available project IDs for the filter dropdown
    all_projects = sorted(list({n["repo_id"] for n in nodes if n["repo_id"] not in ["global", "tech"]}))

    return {
        "nodes_count": len(nodes),
        "edges_count": len(edges),
        "projects": all_projects,
        "nodes": nodes,
        "edges": edges
    }

@router.get("/stats")
async def get_graph_stats():
    """Returns overall knowledge graph metrics."""
    if graph_store.graph.number_of_nodes() == 0:
        graph_store.load_all_graphs()

    return {
        "total_nodes": graph_store.graph.number_of_nodes(),
        "total_edges": graph_store.graph.number_of_edges()
    }
