from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.supabase_client import supabase

router = APIRouter(prefix="/verification", tags=["verification"])

class VerificationSubmit(BaseModel):
    license_url: str  # uploaded to Supabase storage by frontend

@router.post("/submit")
def submit_verification(payload: VerificationSubmit, current_user=Depends(get_current_user)):
    supabase.table("profiles").update({
        "license_url": payload.license_url,
        "verification_status": "pending",
    }).eq("id", current_user["id"]).execute()
    return {"message": "Verification submitted. You'll be notified once reviewed."}

@router.get("/status")
def get_status(current_user=Depends(get_current_user)):
    res = supabase.table("profiles").select("verification_status,is_verified,license_url").eq("id", current_user["id"]).single().execute()
    return res.data

# Admin-only: approve or reject
@router.patch("/review/{user_id}")
def review_verification(user_id: str, action: str, current_user=Depends(get_current_user)):
    # Simple admin check — in production use a proper role system
    admin_ids = ["your-admin-user-id"]  # replace with your Supabase user ID
    if current_user["id"] not in admin_ids:
        raise HTTPException(status_code=403, detail="Admin only")
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Invalid action")
    update = {
        "verification_status": "verified" if action == "approve" else "rejected",
        "is_verified": action == "approve",
    }
    supabase.table("profiles").update(update).eq("id", user_id).execute()
    # Notify user
    status_text = "approved ✅" if action == "approve" else "rejected ❌"
    supabase.table("notifications").insert({
        "user_id": user_id,
        "type": "verification_update",
        "title": f"Verification {status_text}",
        "body": "Your rider verification has been reviewed." if action == "approve" else "Your verification was rejected. Please resubmit with a clearer photo.",
    }).execute()
    return {"message": f"User {action}d"}
