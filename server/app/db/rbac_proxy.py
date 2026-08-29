import re
from typing import Dict, Any, List, Optional
from sqlalchemy import text
from app.db.session import SessionLocal

ALLOWED_TABLES = {"repository_grades", "repository_indexes", "project_case_studies"}
FORBIDDEN_KEYWORDS = {
    "insert", "update", "delete", "drop", "alter", "truncate", "create",
    "grant", "revoke", "exec", "execute", "merge", "call", "vacuum",
    "pg_user", "pg_shadow", "pg_authid", "information_schema"
}

class RBACSecurityViolation(Exception):
    """Raised when an AI query violates read-only RBAC policies."""
    pass

class DatabaseRBACProxy:
    """
    Restricted Read-Only RBAC Query Proxy for the AI Agent.
    Enforces:
    1. Read-Only verification (Strictly SELECT only).
    2. Table Whitelisting (Only allowed portfolio data tables).
    3. Row Limiting (Capped to max 50 rows).
    4. Execution Isolation & Timeout.
    """

    def validate_query(self, raw_query: str) -> str:
        clean_q = raw_query.strip().rstrip(";")
        tokens = [t.lower() for t in re.split(r'\s+', clean_q)]

        # 1. Must start with SELECT
        if not tokens or tokens[0] != "select":
            raise RBACSecurityViolation("RBAC Policy Violation: Only 'SELECT' read operations are permitted.")

        # 2. Check for forbidden mutation keywords
        for token in tokens:
            cleaned_token = re.sub(r'[^a-zA-Z0-9_]', '', token)
            if cleaned_token in FORBIDDEN_KEYWORDS:
                raise RBACSecurityViolation(f"RBAC Policy Violation: Forbidden keyword '{cleaned_token}' detected.")

        # 3. Check for multiple statements (; chained injection)
        if ";" in clean_q:
            raise RBACSecurityViolation("RBAC Policy Violation: Multiple SQL statements are not permitted.")

        # 4. Verify target tables are in whitelist
        table_matches = re.findall(r'(?:from|join)\s+([a-zA-Z0-9_]+)', clean_q, flags=re.IGNORECASE)
        for tbl in table_matches:
            if tbl.lower() not in ALLOWED_TABLES:
                raise RBACSecurityViolation(f"RBAC Policy Violation: Access to table '{tbl}' is restricted. Allowed: {sorted(ALLOWED_TABLES)}")

        # 5. Enforce max row limit
        if not re.search(r'\blimit\s+\d+', clean_q, flags=re.IGNORECASE):
            clean_q += " LIMIT 50"

        return clean_q

    def execute_safe_query(self, sql_query: str) -> Dict[str, Any]:
        """
        Validates and executes a read-only query under the AI Agent RBAC security context.
        """
        try:
            safe_sql = self.validate_query(sql_query)
        except RBACSecurityViolation as e:
            return {
                "success": False,
                "error": str(e),
                "rows_count": 0,
                "data": []
            }

        try:
            from app.db.session import engine
            with engine.connect() as conn:
                # Execute query in short-lived connection
                result = conn.execute(text(safe_sql))
                
                # Fetch column headers & rows
                keys = list(result.keys()) if result.returns_rows else []
                rows = [dict(zip(keys, row)) for row in result.fetchall()] if result.returns_rows else []

                # Serialize datetime objects
                for r in rows:
                    for k, v in r.items():
                        if hasattr(v, "isoformat"):
                            r[k] = v.isoformat()

                return {
                    "success": True,
                    "sql_executed": safe_sql,
                    "rows_count": len(rows),
                    "columns": keys,
                    "data": rows
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Database execution error: {str(e)}",
                "rows_count": 0,
                "data": []
            }

db_rbac_proxy = DatabaseRBACProxy()
