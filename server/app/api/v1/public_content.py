from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, EmailStr
from app.db.session import SessionLocal
from app.db.crud import (
    get_public_achievements,
    get_published_blogs,
    get_blog_by_id_or_slug,
    increment_blog_views,
    create_visitor_lead
)

router = APIRouter(prefix="/public", tags=["Public Content (Blogs & Achievements)"])

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
async def submit_public_inquiry(req: PublicInquiryRequest):
    """Allows visitors to dispatch contact requests directly into the Admin Inbox."""
    with SessionLocal() as db:
        lead = create_visitor_lead(db, {
            "visitor_name": req.name or "Visitor",
            "email": req.email,
            "message": req.message,
            "project_scope": req.project_scope or "General Collaboration",
            "status": "pending"
        })
        return {
            "success": True,
            "lead_id": lead.id,
            "message": "Thank you! Your collaboration inquiry has been securely delivered to Mihir's inbox."
        }
