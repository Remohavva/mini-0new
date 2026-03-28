from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.supabase_client import supabase
from app.models.schemas import UserProfile, UserProfileUpdate, SavedLocationCreate, SavedLocationResponse

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

@router.get("/me/locations", response_model=list[SavedLocationResponse])
def get_my_locations(current_user=Depends(get_current_user)):
    res = supabase.table("saved_locations").select("*").eq("user_id", current_user["id"]).execute()
    return res.data or []

@router.post("/me/locations", response_model=SavedLocationResponse)
def create_location(payload: SavedLocationCreate, current_user=Depends(get_current_user)):
    data = payload.model_dump()
    data["user_id"] = current_user["id"]
    res = supabase.table("saved_locations").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to save location")
    return res.data[0]

@router.delete("/me/locations/{location_id}")
def delete_location(location_id: str, current_user=Depends(get_current_user)):
    res = supabase.table("saved_locations").delete().eq("id", location_id).eq("user_id", current_user["id"]).execute()
    return {"message": "Location deleted"}

