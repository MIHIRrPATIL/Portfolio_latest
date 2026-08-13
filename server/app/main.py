from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import api_v1_router

app = FastAPI(
    title="Portfolio GitHub Webhook & Grading Server",
    description="FastAPI Backend for GitHub Webhook verification, repository fetching, and automated code grading.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_v1_router)

@app.get("/", tags=["Health"])
async def root_health_check():
    return {
        "status": "online",
        "service": "Portfolio GitHub Webhook & Grading Engine",
        "version": "1.0.0",
        "configured_user": settings.GITHUB_USERNAME,
        "token_configured": bool(settings.GITHUB_PERSONAL_ACCESS_TOKEN and settings.GITHUB_PERSONAL_ACCESS_TOKEN != "your_github_pat_token_here"),
        "webhook_secret_configured": bool(settings.GITHUB_WEBHOOK_SECRET and settings.GITHUB_WEBHOOK_SECRET != "your_super_secret_webhook_key_here"),
        "docs": "/docs"
    }
