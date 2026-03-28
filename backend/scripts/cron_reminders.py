import os
import smtplib
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Ensure this is the service role key for cron

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_notification(user_id: str, n_type: str, title: str, body: str, ride_id: str):
    data = {
        "user_id": user_id,
        "type": n_type,
        "title": title,
        "body": body,
        "ride_id": ride_id,
        "read": False
    }
    supabase.table("notifications").insert(data).execute()

def send_reminders():
    # Identify rides that are open or full, and starting in exactly ~30 mins (between 25 and 35 mins from now)
    now = datetime.now(timezone.utc)
    lower_bound = now + timedelta(minutes=25)
    upper_bound = now + timedelta(minutes=35)

    print(f"Checking for rides between {lower_bound.isoformat()} and {upper_bound.isoformat()}")

    # Query open or full rides
    res = supabase.table("rides").select("id, rider_id, origin, destination, departure_time, status").in_("status", ["open", "full"]).gte("departure_time", lower_bound.isoformat()).lte("departure_time", upper_bound.isoformat()).execute()
    
    rides = res.data or []
    
    if not rides:
        print("No rides found for reminders.")
        return

    for ride in rides:
        ride_id = ride["id"]
        # Notify rider
        create_notification(
            user_id=ride["rider_id"],
            n_type="ride_reminder",
            title="⏰ Ride Reminder",
            body=f"Your ride from {ride['origin']} to {ride['destination']} starts in 30 minutes!",
            ride_id=ride_id
        )

        # Notify accepted passengers
        accepted = supabase.table("ride_requests").select("requester_id").eq("ride_id", ride_id).eq("status", "accepted").execute()
        for req in (accepted.data or []):
            create_notification(
                user_id=req["requester_id"],
                n_type="ride_reminder",
                title="⏰ Ride Reminder",
                body=f"Your upcoming ride from {ride['origin']} starts in 30 minutes. Be ready at the pickup point!",
                ride_id=ride_id
            )
            
        print(f"Sent reminders for ride: {ride_id}")

if __name__ == "__main__":
    send_reminders()
