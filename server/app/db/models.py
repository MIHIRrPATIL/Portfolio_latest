from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone

Base = declarative_base()

class RepositoryGradeModel(Base):
    """Stores evaluation scores and feedback for each repository."""
    __tablename__ = "repository_grades"

    id = Column(Integer, primary_key=True, index=True)
    repo_name = Column(String(255), unique=True, index=True, nullable=False)
    owner = Column(String(255), nullable=False)
    full_name = Column(String(512), nullable=False)
    score = Column(Integer, default=0)
    grade = Column(String(10), default="C")
    breakdown = Column(JSON, default=dict)
    feedback = Column(JSON, default=list)
    language = Column(String(100), nullable=True)
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    html_url = Column(String(1024), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class RepositoryIndexModel(Base):
    """Stores raw codebase indexing metadata, READMEs, and commit diffs."""
    __tablename__ = "repository_indexes"

    id = Column(Integer, primary_key=True, index=True)
    repo_name = Column(String(255), unique=True, index=True, nullable=False)
    owner = Column(String(255), nullable=False)
    full_name = Column(String(512), nullable=False)
    readme_content = Column(Text, nullable=True)
    recent_commits = Column(JSON, default=list)
    architecture_manifests = Column(JSON, default=dict)
    tree_summary = Column(JSON, default=dict)
    languages = Column(JSON, default=dict)
    indexed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class ProjectCaseStudyModel(Base):
    """Stores Gemini AI generated project narratives and portfolio metadata."""
    __tablename__ = "project_case_studies"

    id = Column(String(255), primary_key=True, index=True)
    repo_name = Column(String(255), index=True, nullable=False)
    owner = Column(String(255), nullable=False)
    title = Column(String(512), nullable=False)
    is_featured = Column(Boolean, default=False, index=True)
    is_team_project = Column(Boolean, default=False, index=True)
    category = Column(String(255), nullable=True)
    tagline = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    description = Column(Text, nullable=True)
    architecture_overview = Column(Text, nullable=True)
    core_capabilities = Column(JSON, default=list)
    performance_metrics = Column(JSON, default=list)
    live_url = Column(String(1024), nullable=True)
    repo_url = Column(String(1024), nullable=True)
    image = Column(String(1024), nullable=True)
    year = Column(String(50), default="2026")
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
