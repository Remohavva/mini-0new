from app.supabase_client import supabase

def create_notification(user_id: str, type: str, title: str, body: str, ride_id: str = None):
    """Fire-and-forget notification creation — never raises."""
    try:
        data = {"user_id": user_id, "type": type, "title": title, "body": body}
        if ride_id:
            data["ride_id"] = ride_id
        supabase.table("notifications").insert(data).execute()
    except Exception:
        pass
