import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models import ProjectCaseStudyModel, RepositoryGradeModel, RepositoryIndexModel

def deduplicate_database():
    db = SessionLocal()
    print("🔍 Scanning database for duplicate repository records...")

    # 1. Deduplicate ProjectCaseStudyModel
    all_case_studies = db.query(ProjectCaseStudyModel).all()
    seen = {}
    duplicates_removed = 0

    for study in all_case_studies:
        # Key by owner + normalized repo name
        owner = (study.owner or "").lower()
        repo = (study.repo_name or study.id or "").lower().replace("_", "-")
        key = f"{owner}/{repo}"

        if key in seen:
            prev = seen[key]
            # Keep whichever record has longer description / details
            prev_len = len(prev.description or "") + len(prev.architecture_overview or "")
            curr_len = len(study.description or "") + len(study.architecture_overview or "")

            if curr_len > prev_len:
                print(f"🗑️ Removing stale duplicate case study: {prev.id} (keeping richer {study.id})")
                db.delete(prev)
                seen[key] = study
            else:
                print(f"🗑️ Removing duplicate case study: {study.id} (keeping {prev.id})")
                db.delete(study)
            duplicates_removed += 1
        else:
            seen[key] = study

    # 2. Deduplicate RepositoryGradeModel
    all_grades = db.query(RepositoryGradeModel).all()
    seen_grades = {}
    grade_dups_removed = 0

    for grade in all_grades:
        key = (grade.repo_name or "").lower()
        if key in seen_grades:
            db.delete(grade)
            grade_dups_removed += 1
        else:
            seen_grades[key] = grade

    db.commit()
    db.close()
    print(f"✅ Deduplication Complete! Removed {duplicates_removed} duplicate case studies and {grade_dups_removed} duplicate grades.")

if __name__ == "__main__":
    deduplicate_database()
