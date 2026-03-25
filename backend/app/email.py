import resend
from app.config import settings

resend.api_key = settings.resend_api_key

def send_ride_accepted_email(to_email: str, requester_name: str, origin: str, destination: str, departure_time: str, agreed_fare: int | None):
    if not settings.resend_api_key:
        return  # silently skip if not configured

    fare_line = f"<p><strong>Agreed fare:</strong> ₹{agreed_fare}</p>" if agreed_fare else ""

    resend.Emails.send({
        "from": settings.from_email,
        "to": to_email,
        "subject": "Your ride request was accepted 🎉",
        "html": f"""
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#16a34a">Ride Accepted!</h2>
            <p>Hi {requester_name},</p>
            <p>Your ride request has been <strong>accepted</strong> by the rider.</p>
            <p><strong>Route:</strong> {origin} → {destination}</p>
            <p><strong>Departure:</strong> {departure_time}</p>
            {fare_line}
            <p>Open the app to view full details.</p>
            <p style="color:#6b7280;font-size:12px">Pillion Ride Sharing</p>
        </div>
        """,
    })
