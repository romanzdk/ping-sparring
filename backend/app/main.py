import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.seed_regions import REGIONS_DATA
from app.models.region import Region, District
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

logger = logging.getLogger(__name__)


async def seed_regions_if_empty():
    """Seed regions and districts if they don't exist."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Region).limit(1))
        existing = result.scalar_one_or_none()

        if existing:
            logger.info("Regions already exist, skipping seed")
            return

        logger.info("Seeding regions and districts...")
        for region_data in REGIONS_DATA:
            region = Region(
                name=region_data["name"],
                code=region_data["code"]
            )
            session.add(region)
            await session.flush()

            for district_data in region_data["districts"]:
                district = District(
                    name=district_data["name"],
                    code=district_data["code"],
                    region_id=region.id
                )
                session.add(district)

        await session.commit()
        logger.info("Seeded %d regions and their districts", len(REGIONS_DATA))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events."""
    # Startup
    await seed_regions_if_empty()
    yield
    # Shutdown (nothing to do)


app = FastAPI(
    title="Můj trénink API",
    description="API for training matching system (multiple sports)",
    version="0.1.0",
    lifespan=lifespan,
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
