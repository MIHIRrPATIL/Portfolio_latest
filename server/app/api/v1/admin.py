import os
import shutil
from fastapi import APIRouter, Header, HTTPException, Depends, Query, Body, File, UploadFile, Form
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.db.session import SessionLocal
from app.db.crud import (
    get_all_visitor_leads,
    update_visitor_lead_status,
    delete_visitor_lead,
    upsert_achievement,
    get_all_achievements,
    delete_achievement,
    upsert_blog,
    get_all_blogs,
    delete_blog,
    get_resume_settings,
    upsert_resume_settings,
    delete_resume_settings
)

router = APIRouter(prefix="/admin", tags=["Admin Portal & Content Manager"])

ADMIN_MASTER_KEY = os.environ.get("ADMIN_SECRET_KEY", "mihir-portfolio-2026")

def verify_admin_auth(x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")):
    """
    Strict Admin Authentication Dependency.
    Rejects any unauthenticated or visitor access with HTTP 401 Unauthorized.
    """
    if not x_admin_key or x_admin_key.strip() != ADMIN_MASTER_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid or missing administrative passkey."
        )
    return True

# ==========================================
# Auth Verification Endpoint
# ==========================================
class AuthVerifyRequest(BaseModel):
    passkey: str = Field(..., min_length=1)

@router.post("/auth/verify")
async def verify_admin_passkey(req: AuthVerifyRequest):
    if req.passkey.strip() == ADMIN_MASTER_KEY:
        return {"valid": True, "token": req.passkey.strip(), "message": "Admin session authorized."}
    raise HTTPException(status_code=401, detail="Invalid administrative passkey.")

# ==========================================
# Dashboard Stats Overview
# ==========================================
@router.get("/stats", dependencies=[Depends(verify_admin_auth)])
async def get_admin_dashboard_stats():
    with SessionLocal() as db:
        all_leads = get_all_visitor_leads(db)
        pending_leads = [l for l in all_leads if l.status == "pending"]
        all_ach = get_all_achievements(db)
        all_blogs = get_all_blogs(db)
        published_blogs = [b for b in all_blogs if b.is_published]

        return {
            "total_leads": len(all_leads),
            "pending_leads": len(pending_leads),
            "total_achievements": len(all_ach),
            "total_blogs": len(all_blogs),
            "published_blogs": len(published_blogs)
        }

# ==========================================
# Visitor Leads Inbox Endpoints
# ==========================================
@router.get("/leads", dependencies=[Depends(verify_admin_auth)])
async def list_visitor_leads(status: Optional[str] = Query("all")):
    with SessionLocal() as db:
        leads = get_all_visitor_leads(db, status=status)
        return [
            {
                "id": l.id,
                "visitor_name": l.visitor_name,
                "email": l.email,
                "message": l.message,
                "project_scope": l.project_scope,
                "status": l.status,
                "notes": l.notes,
                "created_at": l.created_at.isoformat() if l.created_at else None,
                "updated_at": l.updated_at.isoformat() if l.updated_at else None
            }
            for l in leads
        ]

class UpdateLeadRequest(BaseModel):
    status: str = Field(..., description="pending, reviewed, contacted, archived")
    notes: Optional[str] = None

@router.patch("/leads/{lead_id}", dependencies=[Depends(verify_admin_auth)])
async def update_lead(lead_id: int, req: UpdateLeadRequest):
    with SessionLocal() as db:
        updated = update_visitor_lead_status(db, lead_id=lead_id, status=req.status, notes=req.notes)
        if not updated:
            raise HTTPException(status_code=404, detail=f"Lead with id {lead_id} not found.")
        return {"success": True, "lead_id": lead_id, "status": updated.status}

@router.delete("/leads/{lead_id}", dependencies=[Depends(verify_admin_auth)])
async def delete_lead(lead_id: int):
    with SessionLocal() as db:
        success = delete_visitor_lead(db, lead_id=lead_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Lead with id {lead_id} not found.")
        return {"success": True, "deleted_lead_id": lead_id}

# ==========================================
# Achievements & Milestones Endpoints
# ==========================================
class AchievementPayload(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=2)
    category: str = Field(default="Milestone")
    date: str = Field(default="2026")
    description: str = Field(..., min_length=5)
    proof_url: Optional[str] = ""
    icon: Optional[str] = "trophy"
    tags: List[str] = Field(default_factory=list)
    is_featured: bool = True

@router.get("/achievements", dependencies=[Depends(verify_admin_auth)])
async def list_admin_achievements():
    with SessionLocal() as db:
        items = get_all_achievements(db)
        return [
            {
                "id": a.id,
                "title": a.title,
                "category": a.category,
                "date": a.date,
                "description": a.description,
                "proof_url": a.proof_url,
                "icon": a.icon,
                "tags": a.tags or [],
                "is_featured": a.is_featured,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in items
        ]

@router.post("/achievements", dependencies=[Depends(verify_admin_auth)])
async def create_or_update_achievement(payload: AchievementPayload):
    with SessionLocal() as db:
        saved = upsert_achievement(db, payload.model_dump())
        return {"success": True, "id": saved.id, "title": saved.title}

@router.put("/achievements/{ach_id}", dependencies=[Depends(verify_admin_auth)])
async def edit_achievement(ach_id: str, payload: AchievementPayload):
    data = payload.model_dump()
    data["id"] = ach_id
    with SessionLocal() as db:
        saved = upsert_achievement(db, data)
        return {"success": True, "id": saved.id, "title": saved.title}

@router.delete("/achievements/{ach_id}", dependencies=[Depends(verify_admin_auth)])
async def delete_admin_achievement(ach_id: str):
    with SessionLocal() as db:
        success = delete_achievement(db, ach_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Achievement '{ach_id}' not found.")
        return {"success": True, "deleted_id": ach_id}

# ==========================================
# Blogs & Thoughts Endpoints
# ==========================================
class BlogPayload(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=2)
    summary: str = Field(..., min_length=5)
    content: Optional[str] = ""
    cover_image: Optional[str] = ""
    external_url: Optional[str] = ""
    tags: List[str] = Field(default_factory=list)
    read_time: Optional[str] = "3 min read"
    is_published: bool = True

@router.get("/blogs", dependencies=[Depends(verify_admin_auth)])
async def list_admin_blogs():
    with SessionLocal() as db:
        items = get_all_blogs(db)
        return [
            {
                "id": b.id,
                "title": b.title,
                "summary": b.summary,
                "content": b.content,
                "cover_image": b.cover_image,
                "external_url": b.external_url,
                "tags": b.tags or [],
                "read_time": b.read_time,
                "is_published": b.is_published,
                "views": b.views,
                "published_at": b.published_at.isoformat() if b.published_at else None,
                "created_at": b.created_at.isoformat() if b.created_at else None
            }
            for b in items
        ]

@router.post("/blogs", dependencies=[Depends(verify_admin_auth)])
async def create_or_update_blog(payload: BlogPayload):
    with SessionLocal() as db:
        saved = upsert_blog(db, payload.model_dump())
        return {"success": True, "id": saved.id, "title": saved.title}

@router.put("/blogs/{blog_id}", dependencies=[Depends(verify_admin_auth)])
async def edit_blog(blog_id: str, payload: BlogPayload):
    data = payload.model_dump()
    data["id"] = blog_id
    with SessionLocal() as db:
        saved = upsert_blog(db, data)
        return {"success": True, "id": saved.id, "title": saved.title}

@router.delete("/blogs/{blog_id}", dependencies=[Depends(verify_admin_auth)])
async def delete_admin_blog(blog_id: str):
    with SessionLocal() as db:
        success = delete_blog(db, blog_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Blog '{blog_id}' not found.")
        return {"success": True, "deleted_id": blog_id}

# ==========================================
# Resume / CV Management Endpoints
# ==========================================
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

@router.get("/resume", dependencies=[Depends(verify_admin_auth)])
async def get_admin_resume_info():
    """Returns active resume metadata, download telemetry, and status."""
    with SessionLocal() as db:
        res = get_resume_settings(db)
        has_file = bool(res.file_data or (res.file_path and os.path.exists(res.file_path)))
        return {
            "filename": res.filename,
            "has_file": has_file,
            "external_url": res.external_url,
            "size_bytes": res.size_bytes if has_file else 0,
            "download_count": res.download_count,
            "is_active": res.is_active,
            "updated_at": res.updated_at.isoformat() if res.updated_at else None
        }

@router.post("/resume/upload", dependencies=[Depends(verify_admin_auth)])
async def upload_admin_resume(
    file: Optional[UploadFile] = File(None),
    external_url: Optional[str] = Form(None)
):
    """
    Upload a new Resume PDF or update the external resume cloud link.
    Stores raw PDF bytes in PostgreSQL for 100% restart persistence and caches on disk.
    """
    with SessionLocal() as db:
        target_filename = "Mihir_Patil_Resume.pdf"
        file_path = None
        file_bytes = None
        size_bytes = 0

        if file:
            if not file.filename.lower().endswith(".pdf"):
                raise HTTPException(status_code=400, detail="Only PDF (.pdf) documents are accepted.")

            target_filename = file.filename
            file_bytes = await file.read()
            size_bytes = len(file_bytes)

            if size_bytes > 15 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="PDF size exceeds maximum 15MB limit.")

            dest_path = os.path.join(UPLOADS_DIR, "resume.pdf")
            try:
                with open(dest_path, "wb") as buffer:
                    buffer.write(file_bytes)
                file_path = dest_path
            except Exception:
                pass

        saved = upsert_resume_settings(
            db,
            filename=target_filename,
            file_path=file_path,
            external_url=external_url.strip() if external_url else None,
            size_bytes=size_bytes,
            file_data=file_bytes
        )

        has_file = bool(saved.file_data or (saved.file_path and os.path.exists(saved.file_path)))
        return {
            "success": True,
            "message": "Resume updated and permanently persisted to database successfully.",
            "filename": saved.filename,
            "has_file": has_file,
            "size_bytes": saved.size_bytes,
            "external_url": saved.external_url,
            "updated_at": saved.updated_at.isoformat() if saved.updated_at else None
        }

@router.delete("/resume", dependencies=[Depends(verify_admin_auth)])
async def reset_admin_resume():
    """Deletes uploaded resume file and resets settings."""
    with SessionLocal() as db:
        res = delete_resume_settings(db)
        return {"success": True, "message": "Resume reset to default state."}

# ==========================================
# Email Notification Test Endpoint
# ==========================================
@router.post("/email/test", dependencies=[Depends(verify_admin_auth)])
async def send_test_notification_email():
    """Sends a sample inquiry notification to verify SMTP / Email settings."""
    from app.services.email_service import email_service
    from app.config import settings
    
    await email_service.send_lead_notification(
        visitor_name="Portfolio Admin Test",
        email=settings.NOTIFICATION_EMAIL or "test@example.com",
        project_scope="Autonomous Systems & Distributed AI",
        message="This is a test notification verifying that your SMTP email alert system is operational!",
        lead_id=999
    )
    return {
        "success": True,
        "message": f"Test email triggered to {settings.NOTIFICATION_EMAIL}. Check your inbox.",
        "recipient": settings.NOTIFICATION_EMAIL,
        "smtp_host": settings.SMTP_HOST,
        "smtp_user": settings.SMTP_USER
    }

