from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import api_v1_router
from app.db.session import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    from app.graph.graph_store import graph_store
    graph_store.load_all_graphs()
    print(f"🕸️ [GRAPH STORE] Initialized Knowledge Graph: {graph_store.graph.number_of_nodes()} nodes, {graph_store.graph.number_of_edges()} edges.")
    yield

app = FastAPI(
    title="Portfolio GitHub Webhook & Grading Server",
    description="FastAPI Backend for GitHub Webhook verification, repository fetching, and automated code grading.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Bulletproof Dynamic CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API Router
app.include_router(api_v1_router)

@app.api_route("/", methods=["GET", "HEAD"], tags=["Health"])
async def root_health_check():
    return {
        "status": "online",
        "service": "Portfolio GitHub Webhook & Grading Engine",
        "version": "1.0.0",
        "configured_user": settings.GITHUB_USERNAME,
        "token_configured": bool(settings.effective_github_token),
        "webhook_secret_configured": bool(settings.GITHUB_WEBHOOK_SECRET and settings.GITHUB_WEBHOOK_SECRET != "your_super_secret_webhook_key_here"),
        "docs": "/docs"
    }
