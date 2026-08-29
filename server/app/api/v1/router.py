from fastapi import APIRouter
from app.api.v1.webhook import router as webhook_router
from app.api.v1.repos import router as repos_router
from app.api.v1.indexer import router as indexer_router
from app.api.v1.ai import router as ai_router
from app.api.v1.graph import router as graph_router
from app.api.v1.agent import router as agent_router
from app.api.v1.admin import router as admin_router
from app.api.v1.public_content import router as public_content_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(webhook_router)
api_v1_router.include_router(repos_router)
api_v1_router.include_router(indexer_router)
api_v1_router.include_router(ai_router)
api_v1_router.include_router(graph_router)
api_v1_router.include_router(agent_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(public_content_router)

