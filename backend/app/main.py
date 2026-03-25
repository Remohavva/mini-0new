from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import rides, users, ratings, notifications, bikes

app = FastAPI(title="Pillion API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api")
app.include_router(rides.router, prefix="/api")
app.include_router(ratings.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(bikes.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "BikePool API is running"}
