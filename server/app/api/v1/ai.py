from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List, Dict, Any
from app.services.ai_service import ai_service
from app.config import settings

router = APIRouter(prefix="/ai", tags=["Gen AI Engine"])

@router.post("/generate", response_model=Dict[str, Any])
async def generate_portfolio_with_ai(username: Optional[str] = Query(None, description="GitHub Username")):
    """
    Triggers Gemini 2.5 Flash to analyze all codebase index artifacts,
    select flagship projects for the homepage, and generate technical case studies.
    """
    try:
        target_username = username or settings.GITHUB_USERNAME
        db = await ai_service.generate_and_update_portfolio_database(target_username)
        return {
            "status": "success",
            "message": f"Successfully generated portfolio case studies using Gemini AI for {target_username}.",
            "featured_count": len(db.get("featured_projects", [])),
            "total_count": len(db.get("all_projects", [])),
            "data": db
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate portfolio with Gemini AI: {str(e)}"
        )

@router.get("/projects/featured", response_model=List[Dict[str, Any]])
async def get_featured_homepage_projects():
    """
    Get 6 top flagship projects across distinct domains and tech stacks for the homepage hero.
    """
    summaries = await ai_service.get_fast_project_summaries(settings.GITHUB_USERNAME)
    
    # Priority flagship list representing 6 distinct domains:
    # 1. AI Speech (CDAC_ASR)
    # 2. Autonomous Agents (VaultAgent)
    # 3. Systems/OS (ReflectOS)
    # 4. Algo Trading (GreeksLab)
    # 5. AI Recruitment (HireAI)
    # 6. Edge ML/FedLearning (IPD)
    flagship_order = ["cdac-asr", "vaultagent", "reflectos", "greekslab", "hireai", "ipd"]
    
    summary_map = {s.get("id", "").lower(): s for s in summaries}
    
    featured = []
    for f_id in flagship_order:
        if f_id in summary_map:
            featured.append(summary_map[f_id])
            
    # Fill remaining spots up to 6 if any flagship is missing
    if len(featured) < 6:
        for s in summaries:
            if s not in featured and len(featured) < 6:
                featured.append(s)
                
    return featured[:6]

@router.get("/projects/all", response_model=List[Dict[str, Any]])
async def get_all_portfolio_projects():
    """
    Get non-blocking fast project summaries for the /projects archive page.
    """
    return await ai_service.get_fast_project_summaries(settings.GITHUB_USERNAME)

@router.get("/stats", response_model=Dict[str, Any])
async def get_portfolio_stats():
    """
    Get dynamic portfolio metrics (total repos, languages & frameworks count) without LLM calls.
    """
    return await ai_service.get_portfolio_stats(settings.GITHUB_USERNAME)

@router.get("/projects/{project_id}", response_model=Dict[str, Any])
async def get_single_project_detail(project_id: str):
    """
    Get detailed case study narrative for a specific project.
    Triggers smart lazy indexing & AI generation ONLY for this repository if not yet indexed in DB.
    """
    try:
        return await ai_service.get_or_generate_single_project(project_id)
    except Exception as e:
        print(f"⚠️ Error handling single project detail for '{project_id}': {str(e)}")
        fallback_index = {
            "repo_name": project_id,
            "owner": settings.GITHUB_USERNAME,
            "languages": {"Python": 100},
            "readme": {"content": f"Project case study for {project_id}."},
            "recent_activity": {"commits": []}
        }
        res = ai_service._rule_based_fallback(fallback_index)
        res["id"] = project_id
        return res
