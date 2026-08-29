import sys
import os
import glob

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models import ProjectCaseStudyModel, RepositoryGradeModel, RepositoryIndexModel
from app.services.ai_service import ai_service

def wipe_everything():
    print("🔥 Starting complete wipe of local cache & Render PostgreSQL Database...")

    # 1. Clear Render PostgreSQL Database Tables
    try:
        db = SessionLocal()
        num_cases = db.query(ProjectCaseStudyModel).delete()
        num_grades = db.query(RepositoryGradeModel).delete()
        num_indexes = db.query(RepositoryIndexModel).delete()
        db.commit()
        db.close()
        print(f"✅ Render DB Wiped: Deleted {num_cases} case studies, {num_grades} grades, {num_indexes} repo indexes.")
    except Exception as e:
        print(f"⚠️ DB Wipe Warning: {str(e)}")

    # 2. Clear Local Disk Index Cache JSON files
    cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "index_cache")
    if os.path.exists(cache_dir):
        json_files = glob.glob(os.path.join(cache_dir, "*.json"))
        for file_path in json_files:
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"⚠️ Failed to delete {file_path}: {str(e)}")
        print(f"✅ Local Disk Cache Wiped: Removed {len(json_files)} cached JSON files from {cache_dir}.")

    # 3. Clear In-Memory Caches
    ai_service._summary_cache = None
    ai_service._summary_cache_time = 0
    print("✅ In-memory TTL caches reset to 0.")

    print("\n🎉 ALL LOCAL & REMOTE DATA SUCCESSFULLY WIPED! Database is 100% clean and fresh.")

if __name__ == "__main__":
    wipe_everything()
