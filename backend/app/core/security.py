import asyncio
from datetime import datetime, timedelta
from typing import Any
from jose import jwt
import bcrypt

from app.core.config import settings


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def _verify_password_sync(plain_password: str, hashed_password: str) -> bool:
    """Synchronous password verification - internal use only."""
    try:
        password_bytes = plain_password.encode("utf-8")
        hash_bytes = (
            hashed_password.encode("utf-8") if isinstance(hashed_password, str) else hashed_password
        )
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False


async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash.
    
    Runs in a thread pool to avoid blocking the event loop,
    as bcrypt operations can take 100-500ms.
    """
    return await asyncio.to_thread(_verify_password_sync, plain_password, hashed_password)


def _get_password_hash_sync(password: str) -> str:
    """Synchronous password hashing - internal use only."""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


async def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt.
    
    Runs in a thread pool to avoid blocking the event loop,
    as bcrypt operations can take 100-500ms.
    """
    return await asyncio.to_thread(_get_password_hash_sync, password)


def decode_token(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.JWTError:
        return None
