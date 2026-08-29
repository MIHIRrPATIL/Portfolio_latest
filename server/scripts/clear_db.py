import sys
import os
import shutil

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models import ProjectCaseStudyModel, RepositoryGradeModel, RepositoryIndexModel

def clear_all_database_data():
    print("⚠️ Wiping all records from database tables...")
    db = SessionLocal()
    
    try:
        num_cases = db.query(ProjectCaseStudyModel).delete()
        num_grades = db.query(RepositoryGradeModel).delete()
        num_indexes = db.query(RepositoryIndexModel).delete()
        db.commit()
        print(f"🗑️ Deleted {num_cases} project case studies.")
        print(f"🗑️ Deleted {num_grades} repository grades.")
        print(f"🗑️ Deleted {num_indexes} repository indexes.")
    except Exception as e:
        db.rollback()
        print(f"❌ DB Wipe error: {str(e)}")
    finally:
        db.close()

    # Clear disk cache
    cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "index_cache")
    if os.path.exists(cache_dir):
        for f in os.listdir(cache_dir):
            file_path = os.path.join(cache_dir, f)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                print(f"⚠️ Warning removing cache file {f}: {str(e)}")
        print("🧹 Disk index cache cleared.")

    print("✨ Database and cache fully cleared! Next request will start fresh.")

if __name__ == "__main__":
    clear_all_database_data()
