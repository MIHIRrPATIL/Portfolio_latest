from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.db.models import RepositoryGradeModel, RepositoryIndexModel, ProjectCaseStudyModel

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
