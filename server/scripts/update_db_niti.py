import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models import ProjectCaseStudyModel

def fix_niti():
    db = SessionLocal()
    niti = db.query(ProjectCaseStudyModel).filter(
        (ProjectCaseStudyModel.id.in_(["niti-ai", "niti_ai"])) |
        (ProjectCaseStudyModel.repo_name.ilike("niti-ai")) |
        (ProjectCaseStudyModel.repo_name.ilike("niti_ai"))
    ).first()

    if niti:
        niti.live_url = "https://nitiai.vercel.app"
        db.commit()
        print(f"✅ Updated PostgreSQL DB record for '{niti.id}' -> live_url = '{niti.live_url}'")
    else:
        print("ℹ️ NitiAI record not found in DB yet. It will use the live URL mapping automatically on fetch.")
    db.close()

if __name__ == "__main__":
    fix_niti()
