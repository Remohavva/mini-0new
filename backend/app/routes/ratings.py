from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.dependencies import get_current_user
from app.supabase_client import supabase

router = APIRouter(prefix="/ratings", tags=["ratings"])

class RatingCreate(BaseModel):
    ride_id: str
    reviewee_id: str
    rating: int
    comment: Optional[str] = None

class RatingResponse(BaseModel):
    id: str
    ride_id: str
    reviewer_id: str
    reviewee_id: str
    rating: int
    comment: Optional[str]
    created_at: str

@router.post("/", response_model=RatingResponse)
def create_rating(payload: RatingCreate, current_user=Depends(get_current_user)):
    if not 1 <= payload.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    # Verify ride is completed
    ride = supabase.table("rides").select("status,rider_id").eq("id", payload.ride_id).single().execute()
    if not ride.data:
        raise HTTPException(status_code=404, detail="Ride not found")
    if ride.data["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only rate completed rides")

    # Verify reviewer was part of this ride (either rider or accepted passenger)
    user_id = current_user["id"]
    is_rider = ride.data["rider_id"] == user_id
    if not is_rider:
        req = supabase.table("ride_requests").select("id").eq("ride_id", payload.ride_id).eq("requester_id", user_id).eq("status", "accepted").execute()
        if not req.data:
            raise HTTPException(status_code=403, detail="You were not part of this ride")

    # Can't rate yourself
    if payload.reviewee_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot rate yourself")

    res = supabase.table("ratings").insert({
        "ride_id": payload.ride_id,
        "reviewer_id": user_id,
        "reviewee_id": payload.reviewee_id,
        "rating": payload.rating,
        "comment": payload.comment,
    }).execute()

    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to submit rating")
    return res.data[0]

@router.get("/user/{user_id}")
def get_user_ratings(user_id: str, current_user=Depends(get_current_user)):
    ratings = supabase.table("ratings").select("*").eq("reviewee_id", user_id).order("created_at", desc=True).execute()
    data = ratings.data or []
    avg = round(sum(r["rating"] for r in data) / len(data), 1) if data else None
    return {"ratings": data, "avg_rating": avg, "total": len(data)}

@router.get("/ride/{ride_id}/mine")
def get_my_ride_rating(ride_id: str, current_user=Depends(get_current_user)):
    res = supabase.table("ratings").select("*").eq("ride_id", ride_id).eq("reviewer_id", current_user["id"]).execute()
    return res.data[0] if res.data else None
