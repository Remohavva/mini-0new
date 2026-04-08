from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

class UserType(str, Enum):
    student = "student"
    corporate = "corporate"

class RideStatus(str, Enum):
    open = "open"
    full = "full"
    started = "started"
    completed = "completed"
    cancelled = "cancelled"

class UserProfile(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    user_type: UserType
    college_or_company: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bike_model: Optional[str] = None
    bike_number: Optional[str] = None
    bike_image_url: Optional[str] = None
    co2_saved_kg: Optional[float] = 0.0
    completed_rides: Optional[int] = 0
    credits: Optional[int] = 0
    referral_code: Optional[str] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    college_or_company: Optional[str] = None
    avatar_url: Optional[str] = None
    bike_model: Optional[str] = None
    bike_number: Optional[str] = None
    bike_image_url: Optional[str] = None

class RideCreate(BaseModel):
    origin: str
    destination: str
    departure_time: datetime
    available_seats: int
    bike_model: Optional[str] = None
    notes: Optional[str] = None
    suggested_fare: Optional[int] = None
    origin_lat: Optional[float] = None
    origin_lon: Optional[float] = None
    destination_lat: Optional[float] = None
    destination_lon: Optional[float] = None
    is_recurring: Optional[bool] = False
    recurrence_days: Optional[list[int]] = []

class RideResponse(BaseModel):
    id: str
    rider_id: str
    origin: str
    destination: str
    departure_time: datetime
    available_seats: int
    bike_model: Optional[str] = None
    notes: Optional[str] = None
    status: RideStatus
    suggested_fare: Optional[int] = None
    origin_lat: Optional[float] = None
    origin_lon: Optional[float] = None
    destination_lat: Optional[float] = None
    destination_lon: Optional[float] = None
    is_recurring: Optional[bool] = False
    recurrence_days: Optional[list[int]] = None
    created_at: datetime

class RideRequestCreate(BaseModel):
    ride_id: str
    message: Optional[str] = None
    offered_fare: Optional[int] = None

class RideRequestResponse(BaseModel):
    id: str
    ride_id: str
    requester_id: str
    requester_name: Optional[str] = None
    status: str
    message: Optional[str] = None
    suggested_fare: Optional[int] = None
    offered_fare: Optional[int] = None
    agreed_fare: Optional[int] = None
    created_at: datetime

class FareNegotiate(BaseModel):
    offered_fare: int

class RideMessageCreate(BaseModel):
    message: str

class RideMessageResponse(BaseModel):
    id: str
    ride_id: str
    sender_id: str
    sender_name: Optional[str] = None
    message: str
    created_at: datetime

class SavedLocationCreate(BaseModel):
    name: str
    address: str
    lat: float
    lon: float

class SavedLocationResponse(BaseModel):
    id: str
    user_id: str
    name: str
    address: str
    lat: float
    lon: float
    created_at: datetime

