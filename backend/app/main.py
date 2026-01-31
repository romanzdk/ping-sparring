from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import (
    auth,
    users,
    trainings,
    registrations,
    matching,
    notifications,
    regions,
    training_requests,
)

app = FastAPI(
    title="Můj trénink API",
    description="API for training matching system (multiple sports)",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(trainings.router, prefix="/api/v1/trainings", tags=["trainings"])
app.include_router(registrations.router, prefix="/api/v1/registrations", tags=["registrations"])
app.include_router(matching.router, prefix="/api/v1/matching", tags=["matching"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(regions.router, prefix="/api/v1/regions", tags=["regions"])
app.include_router(
    training_requests.router, prefix="/api/v1/training-requests", tags=["training-requests"]
)


@app.get("/")
async def root():
    return {"message": "Můj trénink API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
