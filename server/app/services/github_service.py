import httpx
from typing import List, Dict, Any, Optional
from app.config import settings
from app.services.grader_service import RepositoryGrader

class GitHubService:
    """
    GitHub API Integration Service.
    Uses Personal Access Tokens to fetch public/private repos, file trees, and metadata.
    """

    def __init__(self):
        self.base_url = "https://api.github.com"
        self.token = settings.GITHUB_PERSONAL_ACCESS_TOKEN
        self.username = settings.GITHUB_USERNAME

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Portfolio-FastAPI-Server"
        }
        if self.token and self.token != "your_github_pat_token_here":
            headers["Authorization"] = f"token {self.token}"
        return headers

    async def fetch_user_repositories(self, username: Optional[str] = None) -> List[Dict[str, Any]]:
        target_user = username or self.username
        async with httpx.AsyncClient(headers=self._get_headers()) as client:
            # If authenticated and fetching own repos, use /user/repos to include private repos
            if self.token and target_user == self.username:
                url = f"{self.base_url}/user/repos?sort=updated&per_page=100"
            else:
                url = f"{self.base_url}/users/{target_user}/repos?sort=updated&per_page=100"

            response = await client.get(url)
            if response.status_code != 200:
                raise Exception(f"GitHub API Error [{response.status_code}]: {response.text}")
            return response.json()

    async def fetch_repository_tree(self, owner: str, repo: str) -> List[str]:
        async with httpx.AsyncClient(headers=self._get_headers()) as client:
            # Get default branch head tree
            url = f"{self.base_url}/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                return [item["path"] for item in data.get("tree", []) if "path" in item]
            return []

    async def fetch_and_grade_all_repos(self, username: Optional[str] = None) -> List[Dict[str, Any]]:
        target_user = username or self.username
        repos = await self.fetch_user_repositories(target_user)
        graded_results = []

        for repo in repos:
            owner = repo.get("owner", {}).get("login", target_user)
            repo_name = repo.get("name")
            
            # Fetch file tree for accurate test/config detection
            tree_paths = []
            try:
                tree_paths = await self.fetch_repository_tree(owner, repo_name)
            except Exception:
                tree_paths = []

            graded_info = RepositoryGrader.evaluate(repo, tree_paths)
            graded_results.append(graded_info)

        # Sort by score descending
        graded_results.sort(key=lambda x: x["score"], reverse=True)
        return graded_results

github_service = GitHubService()
