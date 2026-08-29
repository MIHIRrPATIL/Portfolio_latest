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

class VisitorLeadModel(Base):
    """Stores incoming client & collaboration inquiries from chat & contact terminal."""
    __tablename__ = "visitor_leads"

    id = Column(Integer, primary_key=True, index=True)
    visitor_name = Column(String(255), default="Visitor")
    email = Column(String(255), index=True, nullable=False)
    message = Column(Text, nullable=False)
    project_scope = Column(String(255), default="General Collaboration")
    status = Column(String(50), default="pending", index=True)  # pending, reviewed, contacted, archived
    notes = Column(Text, nullable=True)  # Internal admin notes
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class AchievementModel(Base):
    """Stores career achievements, hackathon wins, research milestones & certifications."""
    __tablename__ = "achievements"

    id = Column(String(255), primary_key=True, index=True)
    title = Column(String(512), nullable=False)
    category = Column(String(255), default="Milestone", index=True)  # Hackathon, Research, Open Source, Milestone, Recognition
    date = Column(String(100), default="2026")
    description = Column(Text, nullable=False)
    proof_url = Column(String(1024), nullable=True)
    icon = Column(String(100), default="trophy")  # trophy, award, star, zap, code, shield
    tags = Column(JSON, default=list)
    is_featured = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class BlogModel(Base):
    """Stores published engineering thoughts, technical articles, and external blog links."""
    __tablename__ = "blogs"

    id = Column(String(255), primary_key=True, index=True)
    title = Column(String(512), nullable=False)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=True)  # Full markdown body
    cover_image = Column(String(1024), nullable=True)
    external_url = Column(String(1024), nullable=True)  # Medium, Substack, Dev.to, Hashnode, etc.
    tags = Column(JSON, default=list)
    read_time = Column(String(50), default="3 min read")
    is_published = Column(Boolean, default=True, index=True)
    views = Column(Integer, default=0)
    published_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
