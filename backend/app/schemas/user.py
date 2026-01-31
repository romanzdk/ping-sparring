from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Any


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    role: str


class UserResponse(UserBase):
    id: int
    role: str
    first_name: str | None
    last_name: str | None
    created_at: datetime
    club_name: str | None = None  # filled for role=club from Club model

    class Config:
        from_attributes = True


class PlayerCreate(BaseModel):
    elo: int
    official_elo: int | None = None
    primary_districts: list[int] = []
    home_address: str | None = None
    max_travel_distance: int | None = None
    availability: dict[str, Any] | None = None
    max_trainings_per_week: int | None = None


class PlayerUpdate(BaseModel):
    elo: int | None = None
    official_elo: int | None = None
    primary_districts: list[int] | None = None
    home_address: str | None = None
    max_travel_distance: int | None = None
    availability: dict[str, Any] | None = None
    max_trainings_per_week: int | None = None
    first_name: str | None = None
    last_name: str | None = None


class PlayerResponse(BaseModel):
    id: int
    user_id: int
    elo: int
    official_elo: int | None
    primary_districts: list[int]
    home_address: str | None
    max_travel_distance: int | None
    availability: dict[str, Any] | None
    max_trainings_per_week: int | None
    first_name: str | None = None
    last_name: str | None = None

    class Config:
        from_attributes = True


class ClubCreate(BaseModel):
    club_name: str
    contact_info: dict[str, Any] | None = None


class ClubUpdate(BaseModel):
    club_name: str | None = None
    phone: str | None = None
    contact_info: dict[str, Any] | None = None
    first_name: str | None = None
    last_name: str | None = None


class ClubResponse(BaseModel):
    id: int
    user_id: int
    club_name: str
    phone: str | None = None
    contact_info: dict[str, Any] | None
    first_name: str | None = None
    last_name: str | None = None

    class Config:
        from_attributes = True
