import os
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.db.models import (
    RepositoryGradeModel,
    RepositoryIndexModel,
    ProjectCaseStudyModel,
    VisitorLeadModel,
    AchievementModel,
    BlogModel,
    ResumeSettingModel
)

def upsert_repository_grade(db: Session, grade_data: Dict[str, Any]) -> RepositoryGradeModel:
    repo_name = grade_data.get("repo_name")
    existing = db.query(RepositoryGradeModel).filter(RepositoryGradeModel.repo_name == repo_name).first()

    if not existing:
        existing = RepositoryGradeModel(repo_name=repo_name)
        db.add(existing)

    existing.owner = grade_data.get("owner", "")
    existing.full_name = grade_data.get("full_name", f"{existing.owner}/{repo_name}")
    existing.score = grade_data.get("score", 0)
    existing.grade = grade_data.get("grade", "C")
    existing.breakdown = grade_data.get("breakdown", {})
    existing.feedback = grade_data.get("feedback", [])
    existing.language = grade_data.get("language")
    existing.stars = grade_data.get("stars", 0)
    existing.forks = grade_data.get("forks", 0)
    existing.html_url = grade_data.get("html_url")
    existing.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(existing)
    return existing

def get_all_repository_grades(db: Session) -> List[RepositoryGradeModel]:
    return db.query(RepositoryGradeModel).order_by(RepositoryGradeModel.score.desc()).all()

def upsert_repository_index(db: Session, index_data: Dict[str, Any]) -> RepositoryIndexModel:
    repo_name = index_data.get("repo_name")
    existing = db.query(RepositoryIndexModel).filter(RepositoryIndexModel.repo_name == repo_name).first()

    if not existing:
        existing = RepositoryIndexModel(repo_name=repo_name)
        db.add(existing)

    existing.owner = index_data.get("owner", "")
    existing.full_name = index_data.get("full_name", f"{existing.owner}/{repo_name}")
    existing.readme_content = index_data.get("readme", {}).get("content")
    existing.recent_commits = index_data.get("recent_activity", {}).get("commits", [])
    existing.architecture_manifests = index_data.get("architecture_manifests", {}).get("files", {})
    existing.tree_summary = index_data.get("tree_structure_summary", {})
    existing.languages = index_data.get("languages", {})
    existing.indexed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(existing)
    return existing

def get_repository_index(db: Session, repo_name: str) -> Optional[RepositoryIndexModel]:
    return db.query(RepositoryIndexModel).filter(RepositoryIndexModel.repo_name == repo_name).first()

def upsert_project_case_study(db: Session, case_data: Dict[str, Any]) -> ProjectCaseStudyModel:
    raw_name = case_data.get("name") or case_data.get("id") or "project"
    raw_owner = case_data.get("owner", "")
    project_id = case_data.get("id") or raw_name.lower().replace("_", "-")

    # Strict multi-field deduplication query
    existing = db.query(ProjectCaseStudyModel).filter(
        (ProjectCaseStudyModel.id == project_id) |
        (ProjectCaseStudyModel.repo_name.ilike(raw_name))
    ).first()

    if not existing:
        existing = ProjectCaseStudyModel(id=project_id)
        db.add(existing)

    existing.repo_name = case_data.get("name", project_id)
    existing.owner = case_data.get("owner", "")
    existing.title = case_data.get("title", case_data.get("name", "Project"))
    existing.is_featured = case_data.get("is_featured", False)
    existing.is_team_project = case_data.get("is_team_project", False)
    existing.category = case_data.get("category", "Engineering")
    existing.tagline = case_data.get("tagline", "")
    existing.tags = case_data.get("tags", [])
    existing.description = case_data.get("description", "")
    existing.architecture_overview = case_data.get("architecture_overview", "")
    existing.core_capabilities = case_data.get("core_capabilities", [])
    existing.performance_metrics = case_data.get("performance_metrics", [])
    existing.live_url = case_data.get("liveUrl", "")
    existing.repo_url = case_data.get("repoUrl", "")
    existing.image = case_data.get("image", "")
    existing.year = case_data.get("year", "2026")
    existing.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(existing)
    return existing

def get_featured_case_studies(db: Session) -> List[ProjectCaseStudyModel]:
    return db.query(ProjectCaseStudyModel).filter(ProjectCaseStudyModel.is_featured == True).all()

def get_all_case_studies(db: Session) -> List[ProjectCaseStudyModel]:
    return db.query(ProjectCaseStudyModel).order_by(ProjectCaseStudyModel.updated_at.desc()).all()

def get_case_study_by_id(db: Session, project_id: str) -> Optional[ProjectCaseStudyModel]:
    return db.query(ProjectCaseStudyModel).filter(ProjectCaseStudyModel.id == project_id).first()

# ==========================================
# Visitor Leads CRUD
# ==========================================
def create_visitor_lead(db: Session, lead_data: Dict[str, Any]) -> VisitorLeadModel:
    lead = VisitorLeadModel(
        visitor_name=lead_data.get("visitor_name", "Visitor"),
        email=lead_data.get("email", "Not specified"),
        message=lead_data.get("message", ""),
        project_scope=lead_data.get("project_scope", "General Collaboration"),
        status=lead_data.get("status", "pending"),
        notes=lead_data.get("notes", "")
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

def get_all_visitor_leads(db: Session, status: Optional[str] = None) -> List[VisitorLeadModel]:
    q = db.query(VisitorLeadModel)
    if status and status != "all":
        q = q.filter(VisitorLeadModel.status == status)
    return q.order_by(VisitorLeadModel.created_at.desc()).all()

def update_visitor_lead_status(db: Session, lead_id: int, status: str, notes: Optional[str] = None) -> Optional[VisitorLeadModel]:
    lead = db.query(VisitorLeadModel).filter(VisitorLeadModel.id == lead_id).first()
    if not lead:
        return None
    lead.status = status
    if notes is not None:
        lead.notes = notes
    lead.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(lead)
    return lead

def delete_visitor_lead(db: Session, lead_id: int) -> bool:
    lead = db.query(VisitorLeadModel).filter(VisitorLeadModel.id == lead_id).first()
    if not lead:
        return False
    db.delete(lead)
    db.commit()
    return True

# ==========================================
# Achievements & Milestones CRUD
# ==========================================
def upsert_achievement(db: Session, ach_data: Dict[str, Any]) -> AchievementModel:
    import re
    raw_title = ach_data.get("title", "Achievement")
    slug = ach_data.get("id") or re.sub(r"[^a-zA-Z0-9_-]+", "-", raw_title.lower()).strip("-")
    
    existing = db.query(AchievementModel).filter(AchievementModel.id == slug).first()
    if not existing:
        existing = AchievementModel(id=slug)
        db.add(existing)

    existing.title = raw_title
    existing.category = ach_data.get("category", "Milestone")
    existing.date = ach_data.get("date", "2026")
    existing.description = ach_data.get("description", "")
    existing.proof_url = ach_data.get("proof_url", "")
    existing.icon = ach_data.get("icon", "trophy")
    existing.tags = ach_data.get("tags", [])
    existing.is_featured = ach_data.get("is_featured", True)
    existing.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(existing)
    return existing

def get_all_achievements(db: Session) -> List[AchievementModel]:
    return db.query(AchievementModel).order_by(AchievementModel.created_at.desc()).all()

def get_public_achievements(db: Session) -> List[AchievementModel]:
    return db.query(AchievementModel).filter(AchievementModel.is_featured == True).order_by(AchievementModel.created_at.desc()).all()

def delete_achievement(db: Session, ach_id: str) -> bool:
    item = db.query(AchievementModel).filter(AchievementModel.id == ach_id).first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True

# ==========================================
# Blogs & Thoughts CRUD
# ==========================================
def upsert_blog(db: Session, blog_data: Dict[str, Any]) -> BlogModel:
    import re
    raw_title = blog_data.get("title", "Blog Post")
    slug = blog_data.get("id") or re.sub(r"[^a-zA-Z0-9_-]+", "-", raw_title.lower()).strip("-")

    existing = db.query(BlogModel).filter(BlogModel.id == slug).first()
    if not existing:
        existing = BlogModel(id=slug)
        db.add(existing)

    existing.title = raw_title
    existing.summary = blog_data.get("summary", "")
    existing.content = blog_data.get("content", "")
    existing.cover_image = blog_data.get("cover_image", "")
    existing.external_url = blog_data.get("external_url", "")
    existing.tags = blog_data.get("tags", [])
    existing.read_time = blog_data.get("read_time", "3 min read")
    existing.is_published = blog_data.get("is_published", True)
    existing.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(existing)
    return existing

def get_all_blogs(db: Session) -> List[BlogModel]:
    return db.query(BlogModel).order_by(BlogModel.published_at.desc()).all()

def get_published_blogs(db: Session) -> List[BlogModel]:
    return db.query(BlogModel).filter(BlogModel.is_published == True).order_by(BlogModel.published_at.desc()).all()

def get_blog_by_id_or_slug(db: Session, slug_or_id: str) -> Optional[BlogModel]:
    return db.query(BlogModel).filter(BlogModel.id == slug_or_id).first()

def increment_blog_views(db: Session, slug_or_id: str):
    blog = db.query(BlogModel).filter(BlogModel.id == slug_or_id).first()
    if blog:
        blog.views = (blog.views or 0) + 1
        db.commit()

def delete_blog(db: Session, blog_id: str) -> bool:
    item = db.query(BlogModel).filter(BlogModel.id == blog_id).first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True

# ==========================================
# Resume / CV Settings CRUD
# ==========================================
def get_resume_settings(db: Session) -> ResumeSettingModel:
    """Returns the active resume configuration row (creates singleton default if none exists)."""
    setting = db.query(ResumeSettingModel).filter(ResumeSettingModel.id == 1).first()
    if not setting:
        setting = ResumeSettingModel(
            id=1,
            filename="Mihir_Patil_Resume.pdf",
            file_path=None,
            external_url=None,
            size_bytes=0,
            download_count=0,
            is_active=True
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

def upsert_resume_settings(
    db: Session,
    filename: str,
    file_path: Optional[str] = None,
    external_url: Optional[str] = None,
    size_bytes: int = 0,
    file_data: Optional[bytes] = None
) -> ResumeSettingModel:
    """Updates the active resume configuration with optional database binary persistence."""
    setting = get_resume_settings(db)
    setting.filename = filename or "Mihir_Patil_Resume.pdf"
    if file_path is not None:
        setting.file_path = file_path
    if external_url is not None:
        setting.external_url = external_url
    if size_bytes > 0:
        setting.size_bytes = size_bytes
    if file_data is not None:
        setting.file_data = file_data
    setting.is_active = True
    setting.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(setting)
    return setting

def increment_resume_download_count(db: Session):
    """Increments the total public download telemetry counter."""
    setting = get_resume_settings(db)
    setting.download_count = (setting.download_count or 0) + 1
    db.commit()

def delete_resume_settings(db: Session) -> ResumeSettingModel:
    """Resets the resume file settings and clears database binary cache."""
    setting = get_resume_settings(db)
    if setting.file_path and os.path.exists(setting.file_path):
        try:
            os.remove(setting.file_path)
        except Exception:
            pass
    setting.file_path = None
    setting.file_data = None
    setting.external_url = None
    setting.size_bytes = 0
    setting.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(setting)
    return setting

