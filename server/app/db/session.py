import os
from contextlib import contextmanager
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, NullPool
from app.config import settings
from app.db.models import Base

db_url = settings.normalized_database_url

# Configure connection pooling parameters
is_sqlite = db_url.startswith("sqlite")
is_transaction_pooler = "pooler" in db_url or ":6543" in db_url

if is_sqlite:
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
elif is_transaction_pooler:
    # Use NullPool for external transaction poolers (e.g. PgBouncer / Supabase port 6543)
    engine = create_engine(
        db_url,
        poolclass=NullPool,
        pool_pre_ping=True
    )
else:
    # Transaction-optimized QueuePool for PostgreSQL (Lean memory profile for 512MB RAM tiers)
    engine = create_engine(
        db_url,
        poolclass=QueuePool,
        pool_size=5,           # Base pool size
        max_overflow=5,        # Max temporary burst connections
        pool_recycle=300,      # Recycle connections every 5 minutes (prevents idle timeouts)
        pool_timeout=15,       # 15s wait timeout before erroring
        pool_pre_ping=True     # Test connection liveness before checking out from pool
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initializes database tables and ensures schema columns exist."""
    try:
        Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            try:
                if is_sqlite:
                    conn.execute(text("ALTER TABLE resume_settings ADD COLUMN file_data BLOB;"))
                else:
                    conn.execute(text("ALTER TABLE resume_settings ADD COLUMN IF NOT EXISTS file_data BYTEA;"))
                conn.commit()
            except Exception:
                pass
        print(f"✅ Database connection pool active on: {db_url.split('@')[-1] if '@' in db_url else db_url}")
    except Exception as e:
        print(f"⚠️ Error initializing database: {str(e)}")

@contextmanager
def get_db_transaction():
    """
    Transaction-Scoped Context Manager:
    Acquires a connection from the pool, runs the atomic transaction,
    commits automatically, and immediately returns the connection back to the pool.
    """
    db: Session = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def get_db():
    """FastAPI Dependency for database sessions with strict lifecycle closing."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
