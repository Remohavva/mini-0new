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

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    college_or_company: Optional[str] = None
    avatar_url: Optional[str] = None

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
    bike_model: Optional[str]
    notes: Optional[str]
    status: RideStatus
    suggested_fare: Optional[int]
    origin_lat: Optional[float]
    origin_lon: Optional[float]
    destination_lat: Optional[float]
    destination_lon: Optional[float]
    is_recurring: Optional[bool]
    recurrence_days: Optional[list[int]]
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
    message: Optional[str]
    suggested_fare: Optional[int]
    offered_fare: Optional[int]
    agreed_fare: Optional[int]
    created_at: datetime

class FareNegotiate(BaseModel):
    offered_fare: int
