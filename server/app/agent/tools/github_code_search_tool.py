import re
from typing import Dict, Any, List, Optional
from app.agent.tools.base import BaseTool
from app.services.github_service import github_service
from app.config import settings

class GitHubCodeSearchTool(BaseTool):
    """
    Autonomous Live GitHub Code & Repository Search Tool.
    Allows the agent to dynamically inspect file trees, fetch raw source file contents,
    read commit histories, and locate specific algorithms on GitHub.
    """
    name = "search_github_repo"
    description = "Searches and retrieves live repository file trees, raw source code files, and recent commits directly from GitHub."

    async def execute(self, repo_name: str, file_path: Optional[str] = None, query: Optional[str] = None, owner: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        target_owner = owner or settings.GITHUB_USERNAME
        clean_repo = repo_name.replace("https://github.com/", "").split("/")[-1].strip()

        # If a specific file path is requested, fetch and return raw code lines
        if file_path:
            content = await github_service.fetch_file_content(target_owner, clean_repo, file_path, max_lines=250)
            if content:
                return {
                    "owner": target_owner,
                    "repo": clean_repo,
                    "file_path": file_path,
                    "content": content,
                    "lines_count": len(content.splitlines())
                }
            return {
                "owner": target_owner,
                "repo": clean_repo,
                "file_path": file_path,
                "error": f"File '{file_path}' could not be fetched or does not exist."
            }

        # Otherwise fetch repository file tree and recent commits
        tree = await github_service.fetch_repository_tree(target_owner, clean_repo) or []
        commits = await github_service.fetch_recent_commits(target_owner, clean_repo, limit=3) or []

        # If a keyword/query is provided (e.g. 'model', 'agent', 'config', 'app'), find best matching file
        matched_file_content = None
        matched_path = None

        # Extract potential search terms dynamically from query words (len >= 3)
        search_terms = []
        if query:
            q_words = re.findall(r"[a-zA-Z0-9_-]{3,}", query.lower())
            stopwords = {"what", "which", "where", "when", "does", "have", "with", "this", "that", "from", "show", "tell", "explain", "about", "using", "used", "code", "file", "repo", "project"}
            search_terms = [w for w in q_words if w not in stopwords]

        # Fallback to key entrypoint/architecture files if no specific terms match
        fallback_terms = ["main", "app", "index", "server", "model", "agent", "align", "requirements.txt", "cargo.toml", "package.json", "go.mod"]
        for fb in fallback_terms:
            if fb not in search_terms:
                search_terms.append(fb)

        for st in search_terms:
            for p in tree:
                if st in p.lower() and not any(ign in p for ign in ["node_modules", "dist", ".git", "__pycache__", ".next", "target"]):
                    matched_path = p
                    matched_file_content = await github_service.fetch_file_content(target_owner, clean_repo, p, max_lines=200)
                    if matched_file_content:
                        break
            if matched_file_content:
                break

        res_payload: Dict[str, Any] = {
            "owner": target_owner,
            "repo": clean_repo,
            "total_files": len(tree),
            "sample_files": tree[:25],
            "recent_commits": [
                {"message": c.get("message"), "author": c.get("author"), "date": c.get("date")}
                for c in commits
            ]
        }

        if matched_path and matched_file_content:
            res_payload["inspected_source_file"] = {
                "path": matched_path,
                "content": matched_file_content
            }

        return res_payload

github_code_search_tool = GitHubCodeSearchTool()
