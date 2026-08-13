from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List, Dict, Any
from app.services.github_service import github_service
from app.config import settings

router = APIRouter(prefix="/repos", tags=["Repositories & Grading"])

@router.get("", response_model=List[Dict[str, Any]])
async def get_all_repositories(username: Optional[str] = Query(None, description="GitHub Username to fetch repos for")):
    """
    Fetch and return all repositories for the configured GitHub user
    complete with automated engineering evaluation grades.
    """
    try:
        target_username = username or settings.GITHUB_USERNAME
        results = await github_service.fetch_and_grade_all_repos(target_username)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch and grade repositories: {str(e)}"
        )

@router.get("/{repo_name}/grade")
async def get_single_repository_grade(repo_name: str, username: Optional[str] = None):
    """
    Fetch and return detailed grade breakdown for a single repository.
    """
    try:
        target_username = username or settings.GITHUB_USERNAME
        all_repos = await github_service.fetch_and_grade_all_repos(target_username)
        
        matched_repo = next((r for r in all_repos if r["repo_name"].lower() == repo_name.lower()), None)
        if not matched_repo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Repository '{repo_name}' not found for user '{target_username}'"
            )

        return matched_repo
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating repository '{repo_name}': {str(e)}"
        )

@router.post("/sync")
async def sync_and_regrade_repositories():
    """
    Force sync GitHub API data and re-evaluate all repository grades.
    """
    try:
        results = await github_service.fetch_and_grade_all_repos(settings.GITHUB_USERNAME)
        return {
            "status": "success",
            "count": len(results),
            "message": f"Successfully re-graded {len(results)} repositories for {settings.GITHUB_USERNAME}.",
            "top_graded": results[:3] if len(results) >= 3 else results
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {str(e)}"
        )
