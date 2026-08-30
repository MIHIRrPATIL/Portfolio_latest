import os
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Response
from fastapi.responses import FileResponse, RedirectResponse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, EmailStr
from app.services.email_service import email_service
from app.db.session import SessionLocal
from app.db.crud import (
    get_public_achievements,
    get_published_blogs,
    get_blog_by_id_or_slug,
    increment_blog_views,
    create_visitor_lead,
    get_resume_settings,
    increment_resume_download_count
)

router = APIRouter(prefix="/public", tags=["Public Content (Blogs & Achievements & Resume)"])

# ==========================================
# Public Achievements
# ==========================================
@router.get("/achievements")
async def list_public_achievements():
    """Returns all featured career milestones, hackathon wins, and achievements."""
    with SessionLocal() as db:
        items = get_public_achievements(db)
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
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in items
        ]

# ==========================================
# Public Blogs & Thoughts
# ==========================================
@router.get("/blogs")
async def list_public_blogs():
    """Returns published blogs, engineering thoughts, and external writeups."""
    with SessionLocal() as db:
        items = get_published_blogs(db)
        return [
            {
                "id": b.id,
                "title": b.title,
                "summary": b.summary,
                "cover_image": b.cover_image,
                "external_url": b.external_url,
                "tags": b.tags or [],
                "read_time": b.read_time,
                "views": b.views,
                "published_at": b.published_at.isoformat() if b.published_at else None
            }
            for b in items
        ]

@router.get("/blogs/{slug}")
async def get_single_blog(slug: str):
    """Returns full Markdown content for a single blog post and records visitor view."""
    with SessionLocal() as db:
        blog = get_blog_by_id_or_slug(db, slug)
        if not blog or not blog.is_published:
            raise HTTPException(status_code=404, detail=f"Blog article '{slug}' not found.")
        increment_blog_views(db, slug)
        return {
            "id": blog.id,
            "title": blog.title,
            "summary": blog.summary,
            "content": blog.content,
            "cover_image": blog.cover_image,
            "external_url": blog.external_url,
            "tags": blog.tags or [],
            "read_time": blog.read_time,
            "views": blog.views,
            "published_at": blog.published_at.isoformat() if blog.published_at else None
        }

# ==========================================
# Public Visitor Contact / Inquiry Form
# ==========================================
class PublicInquiryRequest(BaseModel):
    name: Optional[str] = "Visitor"
    email: str = Field(..., min_length=3, description="Visitor contact email or handle")
    message: str = Field(..., min_length=2, description="Project scope or inquiry message")
    project_scope: Optional[str] = "General Collaboration"

@router.post("/inquire")
async def submit_public_inquiry(req: PublicInquiryRequest, background_tasks: BackgroundTasks):
    """Allows visitors to dispatch contact requests directly into the Admin Inbox and email notification queue."""
    with SessionLocal() as db:
        lead = create_visitor_lead(db, {
            "visitor_name": req.name or "Visitor",
            "email": req.email,
            "message": req.message,
            "project_scope": req.project_scope or "General Collaboration",
            "status": "pending"
        })

        # Queue non-blocking email notification in background
        background_tasks.add_task(
            email_service.send_lead_notification,
            visitor_name=req.name or "Visitor",
            email=req.email,
            project_scope=req.project_scope or "General Collaboration",
            message=req.message,
            lead_id=lead.id
        )

        return {
            "success": True,
            "lead_id": lead.id,
            "message": "Thank you! Your collaboration inquiry has been securely delivered to Mihir's inbox."
        }

# ==========================================
# Public Resume / CV Downloader
# ==========================================
@router.get("/resume")
async def download_public_resume():
    """
    Public Resume Downloader.
    Streams active PDF document directly from PostgreSQL binary storage, local disk, or redirects to external link.
    """
    with SessionLocal() as db:
        setting = get_resume_settings(db)
        safe_filename = setting.filename or "Mihir_Patil_Resume.pdf"

        # 1. If PDF bytes are stored in PostgreSQL, stream directly from DB! (100% persistent across container restarts)
        if setting.file_data:
            increment_resume_download_count(db)
            return Response(
                content=setting.file_data,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{safe_filename}"',
                    "Content-Length": str(len(setting.file_data))
                }
            )

        # 2. If file exists on local storage, stream it as attachment
        if setting.file_path and os.path.exists(setting.file_path):
            increment_resume_download_count(db)
            return FileResponse(
                path=setting.file_path,
                media_type="application/pdf",
                filename=safe_filename,
                headers={"Content-Disposition": f'attachment; filename="{safe_filename}"'}
            )

        # 3. If external cloud URL is configured, redirect
        if setting.external_url:
            increment_resume_download_count(db)
            return RedirectResponse(url=setting.external_url, status_code=307)

        # 4. Fallback: if no uploaded resume, generate informative 404
        raise HTTPException(
            status_code=404,
            detail="Resume document is currently being updated. Please check back shortly or connect directly."
        )

@router.get("/resume/metadata")
async def get_public_resume_metadata():
    """Returns availability and metadata of Mihir's CV."""
    with SessionLocal() as db:
        setting = get_resume_settings(db)
        has_file = bool(setting.file_data or (setting.file_path and os.path.exists(setting.file_path)))
        has_external = bool(setting.external_url)

        return {
            "available": has_file or has_external,
            "filename": setting.filename,
            "size_bytes": len(setting.file_data) if setting.file_data else (setting.size_bytes if has_file else 0),
            "has_direct_file": has_file,
            "external_url": setting.external_url if not has_file else None,
            "updated_at": setting.updated_at.isoformat() if setting.updated_at else None
        }

