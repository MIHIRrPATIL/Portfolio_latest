import httpx
import base64
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
        self.token = settings.effective_github_token
        self.username = settings.GITHUB_USERNAME
        self.timeout = httpx.Timeout(15.0, connect=6.0)

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Portfolio-FastAPI-Server"
        }
        token = settings.effective_github_token or self.token
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def fetch_user_repositories(self, username: Optional[str] = None) -> List[Dict[str, Any]]:
        target_user = username or self.username
        try:
            async with httpx.AsyncClient(headers=self._get_headers(), timeout=self.timeout) as client:
                if self.token and target_user == self.username:
                    url = f"{self.base_url}/user/repos?sort=updated&per_page=100"
                else:
                    url = f"{self.base_url}/users/{target_user}/repos?sort=updated&per_page=100"

                response = await client.get(url)
                if response.status_code != 200:
                    print(f"⚠️ GitHub API returned HTTP {response.status_code}: {response.text[:200]}")
                    return []
                return response.json()
        except Exception as e:
            print(f"⚠️ GitHub API Network / Timeout Warning in fetch_user_repositories: {str(e)}")
            return []

    async def fetch_repository_tree(self, owner: str, repo: str) -> List[str]:
        try:
            async with httpx.AsyncClient(headers=self._get_headers(), timeout=self.timeout) as client:
                url = f"{self.base_url}/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    return [item["path"] for item in data.get("tree", []) if "path" in item]
        except Exception as e:
            print(f"⚠️ Error fetching tree for {owner}/{repo}: {str(e)}")
        return []

    async def fetch_readme_content(self, owner: str, repo: str) -> Optional[str]:
        """Fetch raw decoded README content for a repository."""
        try:
            async with httpx.AsyncClient(headers=self._get_headers(), timeout=self.timeout) as client:
                url = f"{self.base_url}/repos/{owner}/{repo}/readme"
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    content_b64 = data.get("content", "")
                    if content_b64:
                        try:
                            return base64.b64decode(content_b64).decode("utf-8", errors="replace")
                        except Exception:
                            return None
        except Exception as e:
            print(f"⚠️ Error fetching README for {owner}/{repo}: {str(e)}")
        return None

    async def fetch_repository_deployment_url(self, owner: str, repo: str) -> Optional[str]:
        """
        Queries official GitHub Deployments API (/repos/{owner}/{repo}/deployments)
        and fetches active deployment environment_url created by Vercel, Render, GitHub Actions, etc.
        """
        try:
            async with httpx.AsyncClient(headers=self._get_headers(), timeout=self.timeout) as client:
                url = f"{self.base_url}/repos/{owner}/{repo}/deployments"
                response = await client.get(url)
                if response.status_code == 200:
                    deployments = response.json()
                    for d in deployments:
                        dep_id = d.get("id")
                        status_url = f"{self.base_url}/repos/{owner}/{repo}/deployments/{dep_id}/statuses"
                        s_resp = await client.get(status_url)
                        if s_resp.status_code == 200:
                            statuses = s_resp.json()
                            for s in statuses:
                                if s.get("state") == "success" and s.get("environment_url"):
                                    return s.get("environment_url")
        except Exception as e:
            print(f"⚠️ Error fetching GitHub Deployments for {owner}/{repo}: {str(e)}")
        return None

    async def fetch_recent_commits(self, owner: str, repo: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Fetch the most recent commits including messages, dates, and modified file paths."""
        try:
            async with httpx.AsyncClient(headers=self._get_headers(), timeout=self.timeout) as client:
                url = f"{self.base_url}/repos/{owner}/{repo}/commits?per_page={limit}"
                response = await client.get(url)
                if response.status_code != 200:
                    return []
                
                commits_data = response.json()
                results = []

                for item in commits_data:
                    sha = item.get("sha", "")[:7]
                    commit_info = item.get("commit", {})
                    author = commit_info.get("author", {}).get("name", "Unknown")
                    date = commit_info.get("author", {}).get("date", "")
                    message = commit_info.get("message", "")

                    files_changed = []
                    if sha:
                        try:
                            detail_url = f"{self.base_url}/repos/{owner}/{repo}/commits/{sha}"
                            detail_res = await client.get(detail_url)
                            if detail_res.status_code == 200:
                                detail_data = detail_res.json()
                                files_changed = [f.get("filename") for f in detail_data.get("files", []) if f.get("filename")]
                        except Exception:
                            pass

                    results.append({
                        "sha": sha,
                        "author": author,
                        "date": date,
                        "message": message,
                        "files_changed": files_changed
                    })
                return results
        except Exception as e:
            print(f"⚠️ Error fetching commits for {owner}/{repo}: {str(e)}")
        return []

    async def fetch_file_content(self, owner: str, repo: str, file_path: str, max_lines: int = 400) -> Optional[str]:
        """Fetch and truncate text content of a single source file."""
        try:
            async with httpx.AsyncClient(headers=self._get_headers(), timeout=self.timeout) as client:
                url = f"{self.base_url}/repos/{owner}/{repo}/contents/{file_path}"
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    content_b64 = data.get("content", "")
                    if content_b64:
                        try:
                            decoded = base64.b64decode(content_b64).decode("utf-8", errors="replace")
                            lines = decoded.splitlines()
                            if len(lines) > max_lines:
                                return "\n".join(lines[:max_lines])
                            return decoded
                        except Exception:
                            return None
        except Exception as e:
            print(f"⚠️ Error fetching file {file_path} for {owner}/{repo}: {str(e)}")
        return None

    async def fetch_languages(self, owner: str, repo: str) -> Dict[str, int]:
        """Fetch language byte counts for a repository."""
        try:
            async with httpx.AsyncClient(headers=self._get_headers(), timeout=self.timeout) as client:
                url = f"{self.base_url}/repos/{owner}/{repo}/languages"
                response = await client.get(url)
                if response.status_code == 200:
                    return response.json()
        except Exception:
            pass
        return {}

    async def fetch_and_grade_all_repos(self, username: Optional[str] = None) -> List[Dict[str, Any]]:
        from app.db.session import SessionLocal
        from app.db.crud import upsert_repository_grade

        target_user = username or self.username
        repos = await self.fetch_user_repositories(target_user)
        graded_results = []

        db = SessionLocal()
        try:
            for repo in repos:
                owner = repo.get("owner", {}).get("login", target_user)
                repo_name = repo.get("name")
                
                tree_paths = []
                try:
                    tree_paths = await self.fetch_repository_tree(owner, repo_name)
                except Exception:
                    tree_paths = []

                graded_info = RepositoryGrader.evaluate(repo, tree_paths)
                graded_info["owner"] = owner
                
                upsert_repository_grade(db, graded_info)
                graded_results.append(graded_info)
        finally:
            db.close()

        graded_results.sort(key=lambda x: x["score"], reverse=True)
        return graded_results

github_service = GitHubService()
