import re
from typing import List, Dict, Any, Set
from sqlalchemy import or_
from app.agent.nodes.base import BaseNode
from app.agent.state import MasterAgentState
from app.graph.graph_store import graph_store
from app.db.session import SessionLocal
from app.db.models import ProjectCaseStudyModel, AchievementModel, BlogModel, RepositoryGradeModel

class GraphRAGNode(BaseNode):
    """
    Unified Multi-Source Knowledge Retrieval Node:
    Traverses the full Knowledge Graph (AST functions, call chains, technologies)
    AND searches PostgreSQL DB (Project Case Studies, Achievements, Blogs, Repository Grades)
    to dynamically discover matching projects, capabilities, and architectures.
    """
    name = "graphrag_retriever"

    async def execute(self, state: MasterAgentState) -> MasterAgentState:
        q_lower = state.user_query.lower()
        
        # Extract meaningful search tokens from user query
        stop_words = {"the", "and", "for", "with", "this", "that", "what", "how", "why", "are", "you", "your", "name", "need", "like", "would", "want", "hire", "collaborate", "about"}
        tokens = [t for t in re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", q_lower) if t not in stop_words]

        # 1. Graph Store Semantic Lexical Search & Multi-Hop Edge Traversal
        query_parts = [state.user_query]
        if state.target_repo_ids:
            query_parts.extend(state.target_repo_ids)
        if state.target_functions:
            query_parts.extend(state.target_functions)

        query_text = " ".join(query_parts)
        graph_results = graph_store.hybrid_graph_query(query_text, top_k=6)

        context_items = []
        discovered_repos: Set[str] = set(state.target_repo_ids)

        for r in graph_results:
            parent_name = r.parent_project.name if r.parent_project else r.matched_node.repo_id
            if parent_name and parent_name not in ["global", "root"]:
                discovered_repos.add(parent_name.lower().replace("_", "-").strip())

            item = {
                "matched_symbol": r.matched_node.name,
                "node_type": r.matched_node.type,
                "repo_id": r.matched_node.repo_id,
                "file_path": r.matched_node.path,
                "signature": r.matched_node.signature,
                "docstring": r.matched_node.docstring,
                "code_snippet": r.matched_node.code_snippet,
                "parent_project": parent_name,
                "called_functions": [f.name for f in r.called_functions],
                "technologies": r.technologies
            }
            context_items.append(item)

        state.graph_context = context_items

        # 2. Database Multi-Entity Querying (PostgreSQL / SQLite)
        try:
            with SessionLocal() as db:
                # Query all Project Case Studies
                all_projects = db.query(ProjectCaseStudyModel).all()
                matched_projects = []

                for p in all_projects:
                    # Score project relevance based on title, category, description, tags, and architecture
                    proj_text = f"{p.id} {p.title} {p.category or ''} {p.tagline or ''} {p.description or ''} {p.architecture_overview or ''} {' '.join(p.tags or [])}".lower()
                    
                    # Direct match with discovered repos or query tokens
                    p_slug = p.id.lower().replace("_", "-").strip()
                    is_direct_match = p_slug in discovered_repos or p_slug in q_lower
                    
                    token_matches = sum(1 for t in tokens if t in proj_text)
                    if is_direct_match or token_matches >= 1:
                        matched_projects.append({
                            "id": p.id,
                            "slug": p_slug,
                            "title": p.title,
                            "category": p.category,
                            "tagline": p.tagline,
                            "description": (p.description or "")[:280],
                            "architecture_overview": (p.architecture_overview or "")[:280],
                            "tags": p.tags or [],
                            "live_url": p.live_url,
                            "repo_url": p.repo_url,
                            "match_score": 10 if is_direct_match else token_matches
                        })
                        discovered_repos.add(p_slug)

                # Sort by relevance match score
                matched_projects.sort(key=lambda x: x["match_score"], reverse=True)
                state.relevant_projects = matched_projects[:4]

                # Query relevant achievements & research milestones
                all_achievements = db.query(AchievementModel).all()
                matched_achievements = []
                for a in all_achievements:
                    ach_text = f"{a.title} {a.description} {a.category} {' '.join(a.tags or [])}".lower()
                    if any(t in ach_text for t in tokens):
                        matched_achievements.append({
                            "title": a.title,
                            "category": a.category,
                            "date": a.date,
                            "description": a.description,
                            "proof_url": a.proof_url
                        })
                state.relevant_achievements = matched_achievements[:3]

        except Exception as e:
            print(f"⚠️ [GRAPHRAG DB RETRIEVAL ERROR] {str(e)}")

        state.target_repo_ids = list(discovered_repos)
        return state

graphrag_node = GraphRAGNode()
