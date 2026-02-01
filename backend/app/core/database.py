from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Connection pool configuration for handling dozens of concurrent users
# pool_size: Number of persistent connections to keep open
# max_overflow: Additional connections allowed when pool is exhausted
# pool_timeout: Seconds to wait for a connection from the pool
# pool_recycle: Seconds before recycling connections (prevents stale connections)
# pool_pre_ping: Verify connection health before using (prevents "connection closed" errors)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    future=True,
    pool_size=20,
    max_overflow=40,
    pool_timeout=30,
    pool_recycle=3600,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
