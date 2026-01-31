"""
Database seeding script.
Run this after migrations to populate initial data.
"""
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.seed_regions import REGIONS_DATA
from app.models.region import Region, District


async def seed_regions():
    """Seed regions and districts."""
    async with AsyncSessionLocal() as session:
        # Check if regions already exist
        result = await session.execute(select(Region))
        existing_regions = result.scalars().all()
        
        if existing_regions:
            print("Regions already seeded. Skipping...")
            return
        
        print("Seeding regions and districts...")
        
        for region_data in REGIONS_DATA:
            region = Region(
                name=region_data["name"],
                code=region_data["code"]
            )
            session.add(region)
            await session.flush()  # Get the region ID
            
            for district_data in region_data["districts"]:
                district = District(
                    name=district_data["name"],
                    code=district_data["code"],
                    region_id=region.id
                )
                session.add(district)
        
        await session.commit()
        print(f"Seeded {len(REGIONS_DATA)} regions and their districts.")


async def main():
    """Main seeding function."""
    await seed_regions()
    print("Seeding completed!")


if __name__ == "__main__":
    asyncio.run(main())
