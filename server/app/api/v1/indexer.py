from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List, Dict, Any
from app.services.indexer_service import indexer_service
from app.config import settings

router = APIRouter(prefix="/indexer", tags=["Codebase Indexer"])

@router.post("/all", response_model=List[Dict[str, Any]])
async def index_all_repositories(username: Optional[str] = Query(None, description="GitHub Username")):
    """
    Run codebase indexer across all user repositories to extract READMEs,
    commit diffs, language stats, and core architecture manifests.
    """
    try:
        target_username = username or settings.GITHUB_USERNAME
        results = await indexer_service.index_all_user_repos(target_username)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index repositories: {str(e)}"
        )

@router.post("/{repo_name}")
async def index_single_repository(repo_name: str, owner: Optional[str] = Query(None, description="Repository owner")):
    """
    Run indexer on a single repository on-demand.
    """
    try:
        target_owner = owner or settings.GITHUB_USERNAME
        index_data = await indexer_service.index_repository(target_owner, repo_name)
        return index_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index repository '{repo_name}': {str(e)}"
        )

@router.get("/{repo_name}")
async def get_repository_index(repo_name: str):
    """
    Retrieve cached index artifact for a repository.
    """
    cached = indexer_service.get_cached_index(repo_name)
    if not cached:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No index artifact found for repository '{repo_name}'. Run POST /api/v1/indexer/{repo_name} to generate."
        )
    return cached
