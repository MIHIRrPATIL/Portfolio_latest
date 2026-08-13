from fastapi import APIRouter
from app.api.v1.webhook import router as webhook_router
from app.api.v1.repos import router as repos_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(webhook_router)
api_v1_router.include_router(repos_router)
