from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.region import Region, District
from pydantic import BaseModel

router = APIRouter()


class DistrictResponse(BaseModel):
    id: int
    name: str
    code: str
    region_id: int

    class Config:
        from_attributes = True


class RegionResponse(BaseModel):
    id: int
    name: str
    code: str
    districts: List[DistrictResponse]

    class Config:
        from_attributes = True


@router.get("/", response_model=List[RegionResponse])
async def get_regions(db: AsyncSession = Depends(get_db)):
    """Get all regions with their districts."""
    from sqlalchemy.orm import selectinload

    result = await db.execute(select(Region).options(selectinload(Region.districts)))
    return result.scalars().all()


@router.get("/districts", response_model=List[DistrictResponse])
async def get_districts(db: AsyncSession = Depends(get_db)):
    """Get all districts, sorted by name."""
    result = await db.execute(select(District).order_by(District.name))
    return result.scalars().all()
