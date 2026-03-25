from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.supabase_client import supabase

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/")
def get_notifications(current_user=Depends(get_current_user)):
    res = supabase.table("notifications").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).limit(30).execute()
    return res.data or []

@router.get("/unread-count")
def unread_count(current_user=Depends(get_current_user)):
    res = supabase.table("notifications").select("id", count="exact").eq("user_id", current_user["id"]).eq("read", False).execute()
    return {"count": res.count or 0}

@router.patch("/{notification_id}/read")
def mark_read(notification_id: str, current_user=Depends(get_current_user)):
    supabase.table("notifications").update({"read": True}).eq("id", notification_id).eq("user_id", current_user["id"]).execute()
    return {"ok": True}

@router.patch("/read-all")
def mark_all_read(current_user=Depends(get_current_user)):
    supabase.table("notifications").update({"read": True}).eq("user_id", current_user["id"]).eq("read", False).execute()
    return {"ok": True}
