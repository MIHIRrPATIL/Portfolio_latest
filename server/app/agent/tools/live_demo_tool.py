import asyncio
from typing import Dict, Any, Optional
from app.agent.tools.base import BaseTool
from app.db.rbac_proxy import db_rbac_proxy

KNOWN_DEMO_MAP: Dict[str, Dict[str, str]] = {
    "reflectos": {
        "title": "ReflectOS — Cloud Web Desktop",
        "live_url": "https://reflectos.vercel.app",
        "demo_type": "Live Web Application"
    },
    "hireai": {
        "title": "HireAI — Candidate Assessment Platform",
        "live_url": "https://hireai.vercel.app",
        "demo_type": "Live Web Application"
    },
    "vaultagent": {
        "title": "VaultAgent — Autonomous Password & Credential Vault",
        "live_url": "https://github.com/MIHIRrPATIL/VaultAgent/releases",
        "demo_type": "Desktop Tauri Binary"
    },
    "cdac-asr": {
        "title": "CDAC Speech-to-Text & Phoneme Model Pipeline",
        "live_url": "https://github.com/MIHIRrPATIL/CDAC_ASR",
        "demo_type": "Acoustic Model Checkpoint & Pipeline"
    },
    "greekslab": {
        "title": "GreeksLab — Black-Scholes Derivatives Simulator",
        "live_url": "https://github.com/MIHIRrPATIL/GreeksLab",
        "demo_type": "Algorithmic Trading Engine"
    },
    "ipd": {
        "title": "IPD — Incremental Federated Learning Framework",
        "live_url": "https://github.com/MIHIRrPATIL/IPD",
        "demo_type": "Distributed Federated Pipeline"
    }
}

class LiveDemoTool(BaseTool):
    name = "resolve_live_demo"
    description = "Resolves the live deployment URL, interactive demo link, or release binaries for a project repository."

    async def execute(self, repo_id: str, **kwargs) -> Dict[str, Any]:
        clean_id = repo_id.lower().replace("_", "-")

        # 1. First check DB Case Studies table
        sql = f"SELECT id, title, live_url, repo_url, category FROM project_case_studies WHERE id = '{clean_id}' LIMIT 1"
        db_res = await asyncio.to_thread(db_rbac_proxy.execute_safe_query, sql)
        if db_res.get("success") and db_res.get("rows"):
            row = db_res["rows"][0]
            if row.get("live_url"):
                return {
                    "success": True,
                    "repo_id": clean_id,
                    "title": row.get("title", clean_id),
                    "live_url": row.get("live_url"),
                    "demo_type": "Verified Live Deployment"
                }

        # 2. Fallback to Known Demo Map
        if clean_id in KNOWN_DEMO_MAP:
            info = KNOWN_DEMO_MAP[clean_id]
            return {
                "success": True,
                "repo_id": clean_id,
                "title": info["title"],
                "live_url": info["live_url"],
                "demo_type": info["demo_type"]
            }

        return {
            "success": False,
            "repo_id": clean_id,
            "live_url": f"https://github.com/MIHIRrPATIL/{clean_id}",
            "message": f"No separate web host; code and installation instructions available on GitHub."
        }

live_demo_tool = LiveDemoTool()
