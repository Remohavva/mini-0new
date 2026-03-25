import httpx
from supabase import create_client, Client
from supabase.client import ClientOptions
from app.config import settings

# Disable HTTP/2 to avoid WinError 10035 on Windows
http_client = httpx.Client(http2=False)

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key,
    options=ClientOptions(postgrest_client_timeout=10),
)
