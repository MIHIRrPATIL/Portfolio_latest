from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import api_v1_router
from app.db.session import init_db
from app.utils.memory import get_process_memory_mb, trim_memory

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    from app.graph.graph_store import graph_store
    graph_store.load_all_graphs()
    trim_memory()
    ram_mb = get_process_memory_mb()
    print(f"[STARTUP] Initialized Knowledge Graph: {graph_store.graph.number_of_nodes()} nodes, {graph_store.graph.number_of_edges()} edges. RAM usage: {ram_mb} MB")
    yield
    trim_memory()

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
        "ram_usage_mb": get_process_memory_mb(),
        "configured_user": settings.GITHUB_USERNAME,
        "token_configured": bool(settings.effective_github_token),
        "webhook_secret_configured": bool(settings.GITHUB_WEBHOOK_SECRET and settings.GITHUB_WEBHOOK_SECRET != "your_super_secret_webhook_key_here"),
        "docs": "/docs"
    }

@app.post("/health/trim", tags=["Health"])
async def force_trim_memory():
    """Manual trigger to flush OS heap pages back to the kernel."""
    return trim_memory()
