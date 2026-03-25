from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    supabase_jwt_secret: str
    resend_api_key: str = ""
    from_email: str = "noreply@yourdomain.com"

    class Config:
        env_file = ".env"

settings = Settings()
