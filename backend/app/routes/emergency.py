from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.dependencies import get_current_user
from app.supabase_client import supabase

router = APIRouter(prefix="/emergency", tags=["emergency"])

class EmergencyContact(BaseModel):
    name: str
    phone: str

class SOSPayload(BaseModel):
    lat: float
    lon: float
    ride_id: Optional[str] = None

@router.get("/contact")
def get_contact(current_user=Depends(get_current_user)):
    res = supabase.table("emergency_contacts").select("*").eq("user_id", current_user["id"]).execute()
    return res.data[0] if res.data else None

@router.post("/contact")
def save_contact(payload: EmergencyContact, current_user=Depends(get_current_user)):
    existing = supabase.table("emergency_contacts").select("id").eq("user_id", current_user["id"]).execute()
    if existing.data:
        res = supabase.table("emergency_contacts").update({"name": payload.name, "phone": payload.phone}).eq("user_id", current_user["id"]).execute()
    else:
        res = supabase.table("emergency_contacts").insert({"user_id": current_user["id"], "name": payload.name, "phone": payload.phone}).execute()
    return res.data[0]

@router.post("/sos")
def trigger_sos(payload: SOSPayload, current_user=Depends(get_current_user)):
    # Get user profile
    profile = supabase.table("profiles").select("full_name,phone").eq("id", current_user["id"]).single().execute()
    contact = supabase.table("emergency_contacts").select("*").eq("user_id", current_user["id"]).execute()

    maps_link = f"https://www.google.com/maps?q={payload.lat},{payload.lon}"
    ride_info = f" Ride ID: {payload.ride_id}" if payload.ride_id else ""

    # Log the SOS event
    supabase.table("notifications").insert({
        "user_id": current_user["id"],
        "type": "sos_triggered",
        "title": "🆘 SOS Triggered",
        "body": f"Your SOS was sent. Location: {maps_link}{ride_info}",
        "ride_id": payload.ride_id,
    }).execute()

    return {
        "ok": True,
        "maps_link": maps_link,
        "contact": contact.data[0] if contact.data else None,
        "message": "SOS triggered. Share this link with your emergency contact.",
    }
