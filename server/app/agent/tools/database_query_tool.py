import asyncio
from typing import Dict, Any, List
from app.agent.tools.base import BaseTool
from app.db.rbac_proxy import db_rbac_proxy

class DatabaseQueryTool(BaseTool):
    """
    Restricted RBAC Database Query Tool for the AI Agent.
    Allows executing read-only SQL queries against public portfolio tables:
    - `project_case_studies` (id, title, category, is_featured, live_url, repo_url, year, etc.)
    - `repository_grades` (repo_name, score, grade, language, stars, forks, etc.)
    - `repository_indexes` (repo_name, owner, indexed_at, etc.)
    """
    name = "query_database"
    description = "Executes read-only SQL analytical queries against PostgreSQL DB (allowed tables: project_case_studies, repository_grades, repository_indexes)."

    async def execute(self, sql_query: str, **kwargs) -> Dict[str, Any]:
        result = await asyncio.to_thread(db_rbac_proxy.execute_safe_query, sql_query)
        if not result.get("success"):
            return {
                "success": False,
                "error": result.get("error", "Database query failed"),
                "rows": []
            }

        rows = result.get("rows", [])
        return {
            "success": True,
            "row_count": len(rows),
            "rows": rows,
            "sql": sql_query
        }

database_query_tool = DatabaseQueryTool()
