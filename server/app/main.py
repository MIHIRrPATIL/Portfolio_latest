from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import api_v1_router
from app.db.session import init_db

async def schedule_nightly_indexing():
    import asyncio
    from datetime import datetime, timezone, timedelta
    try:
        from zoneinfo import ZoneInfo
        IST = ZoneInfo("Asia/Kolkata")
    except Exception:
        IST = timezone(timedelta(hours=5, minutes=30))

    from scripts.nightly_batch_indexer import run_nightly_batch_indexing

    while True:
        try:
            now_ist = datetime.now(IST)
            next_midnight_ist = (now_ist + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            seconds_until_midnight = (next_midnight_ist - now_ist).total_seconds()
            
            hours = int(seconds_until_midnight // 3600)
            minutes = int((seconds_until_midnight % 3600) // 60)
            print(f"⏰ [SCHEDULER] Nightly Midnight Cron active (IST / Asia/Kolkata). Next run in {hours}h {minutes}m (at 00:00 IST).")
            
            await asyncio.sleep(seconds_until_midnight)
            await run_nightly_batch_indexing(batch_size=5)
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"⚠️ [SCHEDULER] Error in nightly cron loop: {str(e)}")
            await asyncio.sleep(3600)

@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    init_db()
    from app.graph.graph_store import graph_store
    graph_store.load_all_graphs()
    print(f"🕸️ [GRAPH STORE] Initialized Knowledge Graph: {graph_store.graph.number_of_nodes()} nodes, {graph_store.graph.number_of_edges()} edges.")
    cron_task = asyncio.create_task(schedule_nightly_indexing())
    yield
    cron_task.cancel()

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

@app.get("/", tags=["Health"])
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
