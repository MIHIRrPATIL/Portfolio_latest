import os
import json
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from app.services.github_service import github_service
from app.config import settings

# Key architecture filenames to always prioritize for indexing
KEY_ARCH_MANIFESTS = {
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "go.mod",
    "cargo.toml",
    "dockerfile",
    "docker-compose.yml"
}

IGNORED_DIRECTORIES = {
    "node_modules", ".next", "dist", "build", "__pycache__", ".git", ".venv",
    "venv", "env", "tests", "test", "spec", "coverage", ".github", ".husky"
}

ALLOWED_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".rs", ".go", ".js", ".jsx", ".toml", ".sql"
}

def score_source_file_priority(path: str) -> int:
    """Ranks importance of files so core architectural modules are indexed first."""
    p_lower = path.lower()
    score = 10

    # High priority manifest/entry points
    basename = os.path.basename(p_lower)
    if basename in KEY_ARCH_MANIFESTS:
        return 100
    if basename in ["main.py", "app.py", "index.ts", "app.ts", "server.py", "lib.rs", "main.rs", "app.tsx", "page.tsx"]:
        return 90

    # Core architecture directories
    if any(k in p_lower for k in ["core/", "models/", "pipeline/", "engine/", "services/", "agent/", "graph/", "src-tauri/"]):
        score += 40
    if any(k in p_lower for k in ["api/", "routes/", "controllers/", "lib/", "components/"]):
        score += 25
    if any(k in p_lower for k in ["utils/", "helpers/", "types/"]):
        score += 15

    # Penalize deep nesting
    depth = path.count("/")
    score -= depth * 3

    return score

class RepositoryIndexer:
    """
    Codebase Indexer Engine.
    Processes a repository to extract README markdown, recent commit diffs,
    language statistics, and up to 20 core architecture source files into a unified AST Graph artifact.
    """

    def __init__(self):
        self.cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "index_cache")
        os.makedirs(self.cache_dir, exist_ok=True)

    def _get_cache_path(self, repo_name: str) -> str:
        safe_name = repo_name.replace("/", "_").replace("\\", "_")
        return os.path.join(self.cache_dir, f"{safe_name}.json")

    async def index_repository(self, owner: str, repo_name: str) -> Dict[str, Any]:
        """
        Builds a comprehensive LLM-ready and Graph-ready index payload for a single repository.
        """
        print(f"🔍 Indexing repository: {owner}/{repo_name}...")

        # 1. Fetch README content
        readme_text = await github_service.fetch_readme_content(owner, repo_name)

        # 2. Fetch recent commits (last 5 commits with changed files)
        recent_commits = (await github_service.fetch_recent_commits(owner, repo_name, limit=5)) or []

        # 3. Fetch full tree & identify up to 20 high-priority architecture files
        tree_paths = (await github_service.fetch_repository_tree(owner, repo_name)) or []
        
        candidate_paths: List[Tuple[str, int]] = []
        for path in tree_paths:
            parts = path.split("/")
            if any(p.lower() in IGNORED_DIRECTORIES for p in parts[:-1]):
                continue
            
            ext = os.path.splitext(path)[1].lower()
            basename = os.path.basename(path).lower()
            if ext in ALLOWED_EXTENSIONS or basename in KEY_ARCH_MANIFESTS:
                candidate_paths.append((path, score_source_file_priority(path)))

        # Sort candidates by architectural priority descending
        candidate_paths.sort(key=lambda x: x[1], reverse=True)
        selected_paths = [p[0] for p in candidate_paths[:18]]

        # Concurrently fetch contents for all selected source files
        async def fetch_single_file(path: str) -> Tuple[str, Optional[str]]:
            content = await github_service.fetch_file_content(owner, repo_name, path, max_lines=300)
            return path, content

        fetch_tasks = [fetch_single_file(p) for p in selected_paths]
        fetched_results = await asyncio.gather(*fetch_tasks, return_exceptions=True)

        key_files_content: Dict[str, str] = {}
        file_tree: List[Dict[str, str]] = []

        for res in fetched_results:
            if isinstance(res, tuple) and res[1]:
                path, content = res
                key_files_content[path] = content
                file_tree.append({"path": path, "content": content})

        # 4. Fetch languages breakdown
        languages = await github_service.fetch_languages(owner, repo_name)

        # 5. Synthesize Unified Index Artifact
        indexed_data = {
            "repo_name": repo_name,
            "owner": owner,
            "full_name": f"{owner}/{repo_name}",
            "indexed_at": datetime.now(timezone.utc).isoformat(),
            "readme": {
                "present": readme_text is not None,
                "content": readme_text or "No README provided."
            },
            "recent_activity": {
                "commit_count": len(recent_commits),
                "commits": recent_commits
            },
            "architecture_manifests": {
                "file_count": len(key_files_content),
                "files": key_files_content
            },
            "file_tree": file_tree,
            "tree_structure_summary": {
                "total_files": len(tree_paths),
                "sample_tree": tree_paths[:30]
            },
            "languages": languages
        }

        # Save to local cache directory
        cache_path = self._get_cache_path(repo_name)
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(indexed_data, f, indent=2, ensure_ascii=False)

        # Build & persist AST Code Knowledge Graph with Call Dependencies
        try:
            from app.graph.builder import graph_builder
            await graph_builder.build_and_store_project_graph(owner, repo_name, {
                "languages": languages,
                "key_files_content": key_files_content,
                "file_tree": file_tree,
                "readme": {"content": readme_text}
            })
        except Exception as e:
            print(f"⚠️ Failed to build code knowledge graph for {repo_name}: {str(e)}")

        # Persist to database
        try:
            from app.db.session import SessionLocal
            from app.db.crud import upsert_repository_index
            db = SessionLocal()
            upsert_repository_index(db, indexed_data)
            db.close()
        except Exception as e:
            print(f"⚠️ Failed to save index to DB: {str(e)}")

        print(f"✅ Successfully indexed {repo_name} ({len(key_files_content)} files parsed) -> {cache_path}")
        return indexed_data

    def get_cached_index(self, repo_name: str) -> Optional[Dict[str, Any]]:
        """Retrieve stored index artifact from DB or local cache."""
        try:
            from app.db.session import SessionLocal
            from app.db.crud import get_repository_index
            db = SessionLocal()
            db_item = get_repository_index(db, repo_name)
            db.close()
            if db_item:
                return {
                    "repo_name": db_item.repo_name,
                    "owner": db_item.owner,
                    "full_name": db_item.full_name,
                    "readme": {"present": bool(db_item.readme_content), "content": db_item.readme_content or ""},
                    "recent_activity": {"commits": db_item.recent_commits or []},
                    "architecture_manifests": {"files": db_item.architecture_manifests or {}},
                    "tree_structure_summary": db_item.tree_summary or {},
                    "languages": db_item.languages or {}
                }
        except Exception:
            pass

        cache_path = self._get_cache_path(repo_name)
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return None

indexer_service = RepositoryIndexer()
