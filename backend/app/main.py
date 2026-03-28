from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import rides, users, ratings, notifications, bikes, emergency, verification
import os

app = FastAPI(title="Pillion API", version="1.0.0")

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if not allowed_origins_env or allowed_origins_env == "*":
    allowed_origins = ["*"]
    allow_credentials = False
else:
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",")]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api")
app.include_router(rides.router, prefix="/api")
app.include_router(ratings.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(bikes.router, prefix="/api")
app.include_router(emergency.router, prefix="/api")
app.include_router(verification.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Pillion API is running"}
