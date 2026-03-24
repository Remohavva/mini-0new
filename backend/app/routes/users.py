from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.supabase_client import supabase
from app.models.schemas import UserProfile, UserProfileUpdate

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserProfile)
def get_my_profile(current_user=Depends(get_current_user)):
    res = supabase.table("profiles").select("*").eq("id", current_user["id"]).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data

@router.put("/me", response_model=UserProfile)
def update_my_profile(payload: UserProfileUpdate, current_user=Depends(get_current_user)):
    res = supabase.table("profiles").update(payload.model_dump(exclude_none=True)).eq("id", current_user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Update failed")
    return res.data[0]

@router.get("/{user_id}", response_model=UserProfile)
def get_user_profile(user_id: str, current_user=Depends(get_current_user)):
    res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    return res.data
