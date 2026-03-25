from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.dependencies import get_current_user
from app.supabase_client import supabase
from app.models.schemas import RideCreate, RideResponse, RideRequestCreate, RideRequestResponse, FareNegotiate
from app.email import send_ride_accepted_email
from app.notifications import create_notification

import math

RATE_PER_KM = 4
MIN_FARE = 20

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

router = APIRouter(prefix="/rides", tags=["rides"])

@router.post("/", response_model=RideResponse)
def create_ride(payload: RideCreate, current_user=Depends(get_current_user)):
    data = payload.model_dump()
    data["rider_id"] = current_user["id"]
    data["status"] = "open"
    data["departure_time"] = data["departure_time"].isoformat()
    # Auto-calculate fare from coords if not provided
    if not data.get("suggested_fare") and all(data.get(k) for k in ["origin_lat", "origin_lon", "destination_lat", "destination_lon"]):
        km = haversine_km(data["origin_lat"], data["origin_lon"], data["destination_lat"], data["destination_lon"])
        data["suggested_fare"] = max(round(km * RATE_PER_KM), MIN_FARE)
    res = supabase.table("rides").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create ride")
    return res.data[0]

@router.get("/", response_model=list[RideResponse])
def list_rides(
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    status: Optional[str] = Query("open"),
    current_user=Depends(get_current_user),
):
    query = supabase.table("rides").select("*")
    if origin:
        query = query.ilike("origin", f"%{origin}%")
    if destination:
        query = query.ilike("destination", f"%{destination}%")
    if status:
        query = query.eq("status", status)
    res = query.order("departure_time").execute()
    return res.data or []

@router.get("/my", response_model=list[RideResponse])
def my_rides(current_user=Depends(get_current_user)):
    res = supabase.table("rides").select("*").eq("rider_id", current_user["id"]).execute()
    return res.data or []

@router.get("/{ride_id}", response_model=RideResponse)
def get_ride(ride_id: str, current_user=Depends(get_current_user)):
    res = supabase.table("rides").select("*").eq("id", ride_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Ride not found")
    return res.data

@router.patch("/{ride_id}/cancel")
def cancel_ride(ride_id: str, current_user=Depends(get_current_user)):
    ride = supabase.table("rides").select("rider_id,status").eq("id", ride_id).single().execute()
    if not ride.data or ride.data["rider_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if ride.data["status"] not in ("open", "full"):
        raise HTTPException(status_code=400, detail="Cannot cancel a ride that is already started or completed")
    supabase.table("rides").update({"status": "cancelled"}).eq("id", ride_id).execute()
    return {"message": "Ride cancelled"}

@router.patch("/{ride_id}/start")
def start_ride(ride_id: str, current_user=Depends(get_current_user)):
    ride = supabase.table("rides").select("rider_id,status").eq("id", ride_id).single().execute()
    if not ride.data or ride.data["rider_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if ride.data["status"] not in ("open", "full"):
        raise HTTPException(status_code=400, detail="Ride cannot be started")
    supabase.table("rides").update({"status": "started", "started_at": "now()"}).eq("id", ride_id).execute()
    # Notify accepted passengers
    accepted = supabase.table("ride_requests").select("requester_id").eq("ride_id", ride_id).eq("status", "accepted").execute()
    for req in (accepted.data or []):
        create_notification(
            user_id=req["requester_id"],
            type="ride_started",
            title="Your ride has started 🚀",
            body=f"The rider has started the ride from {ride.data['origin']} → {ride.data['destination']}.",
            ride_id=ride_id,
        )
    return {"message": "Ride started"}

@router.patch("/{ride_id}/complete")
def complete_ride(ride_id: str, current_user=Depends(get_current_user)):
    ride = supabase.table("rides").select("rider_id,status").eq("id", ride_id).single().execute()
    if not ride.data or ride.data["rider_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if ride.data["status"] != "started":
        raise HTTPException(status_code=400, detail="Ride must be started before completing")
    supabase.table("rides").update({"status": "completed", "completed_at": "now()"}).eq("id", ride_id).execute()
    # Notify accepted passengers
    accepted = supabase.table("ride_requests").select("requester_id").eq("ride_id", ride_id).eq("status", "accepted").execute()
    for req in (accepted.data or []):
        create_notification(
            user_id=req["requester_id"],
            type="ride_completed",
            title="Ride completed ✅",
            body=f"Your ride from {ride.data['origin']} → {ride.data['destination']} is complete. Rate your experience!",
            ride_id=ride_id,
        )
    return {"message": "Ride completed"}

# --- Ride Requests ---

@router.post("/{ride_id}/requests", response_model=RideRequestResponse)
def request_ride(ride_id: str, payload: RideRequestCreate, current_user=Depends(get_current_user)):
    ride = supabase.table("rides").select("*").eq("id", ride_id).single().execute()
    if not ride.data:
        raise HTTPException(status_code=404, detail="Ride not found")
    if ride.data["status"] != "open":
        raise HTTPException(status_code=400, detail="Ride is not open for requests")
    if ride.data["rider_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot request your own ride")

    res = supabase.table("ride_requests").insert({
        "ride_id": ride_id,
        "requester_id": current_user["id"],
        "message": payload.message,
        "status": "pending",
        "suggested_fare": ride.data.get("suggested_fare"),
        "offered_fare": payload.offered_fare,
    }).execute()
    # Notify the rider
    create_notification(
        user_id=ride.data["rider_id"],
        type="ride_request",
        title="New ride request",
        body=f"Someone wants to join your ride from {ride.data['origin']} → {ride.data['destination']}",
        ride_id=ride_id,
    )
    return res.data[0]

@router.get("/{ride_id}/requests", response_model=list[RideRequestResponse])
def get_ride_requests(ride_id: str, current_user=Depends(get_current_user)):
    ride = supabase.table("rides").select("rider_id").eq("id", ride_id).single().execute()
    if not ride.data or ride.data["rider_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    res = supabase.table("ride_requests").select("*").eq("ride_id", ride_id).execute()
    requests = res.data or []
    # Fetch requester names in one query
    if requests:
        requester_ids = list({r["requester_id"] for r in requests})
        profiles = supabase.table("profiles").select("id,full_name").in_("id", requester_ids).execute()
        name_map = {p["id"]: p["full_name"] for p in (profiles.data or [])}
        for r in requests:
            r["requester_name"] = name_map.get(r["requester_id"], "Unknown")
    return requests

@router.patch("/{ride_id}/requests/{request_id}")
def respond_to_request(ride_id: str, request_id: str, action: str = Query(..., regex="^(accept|reject)$"), current_user=Depends(get_current_user)):
    ride = supabase.table("rides").select("*").eq("id", ride_id).single().execute()
    if not ride.data or ride.data["rider_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    update: dict = {"status": action + "ed"}
    agreed_fare = None
    if action == "accept":
        req = supabase.table("ride_requests").select("offered_fare,suggested_fare,requester_id").eq("id", request_id).single().execute()
        if req.data:
            agreed_fare = req.data.get("offered_fare") or req.data.get("suggested_fare")
            update["agreed_fare"] = agreed_fare
            # Send email notification to requester
            try:
                requester_id = req.data.get("requester_id")
                profile = supabase.table("profiles").select("email,full_name").eq("id", requester_id).single().execute()
                if profile.data:
                    send_ride_accepted_email(
                        to_email=profile.data["email"],
                        requester_name=profile.data.get("full_name", "there"),
                        origin=ride.data["origin"],
                        destination=ride.data["destination"],
                        departure_time=str(ride.data["departure_time"]),
                        agreed_fare=agreed_fare,
                    )
            except Exception:
                pass  # don't fail the request if email fails
    supabase.table("ride_requests").update(update).eq("id", request_id).execute()
    # Notify the requester
    req_data = supabase.table("ride_requests").select("requester_id").eq("id", request_id).single().execute()
    if req_data.data:
        if action == "accept":
            create_notification(
                user_id=req_data.data["requester_id"],
                type="request_accepted",
                title="Ride request accepted! 🎉",
                body=f"Your request for {ride.data['origin']} → {ride.data['destination']} was accepted.",
                ride_id=ride_id,
            )
        else:
            create_notification(
                user_id=req_data.data["requester_id"],
                type="request_rejected",
                title="Ride request declined",
                body=f"Your request for {ride.data['origin']} → {ride.data['destination']} was declined.",
                ride_id=ride_id,
            )
    return {"message": f"Request {action}ed"}

@router.patch("/{ride_id}/requests/{request_id}/negotiate", response_model=RideRequestResponse)
def negotiate_fare(ride_id: str, request_id: str, payload: FareNegotiate, current_user=Depends(get_current_user)):
    """Passenger counter-offers a fare amount."""
    req = supabase.table("ride_requests").select("*").eq("id", request_id).single().execute()
    if not req.data:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.data["requester_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if req.data["status"] != "pending":
        raise HTTPException(status_code=400, detail="Can only negotiate pending requests")
    res = supabase.table("ride_requests").update({"offered_fare": payload.offered_fare}).eq("id", request_id).execute()
    return res.data[0]
