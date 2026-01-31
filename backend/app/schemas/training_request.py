from datetime import datetime
from pydantic import BaseModel
from typing import Any


class TrainingRequestBase(BaseModel):
    title: str
    description: str | None = None
    preferred_days: list[int] = []  # 0-6 (Monday-Sunday)
    preferred_times: dict[str, Any] | None = None
    district_ids: list[int] = []
    elo_min: int
    elo_max: int
    phone: str | None = None


class TrainingRequestCreate(TrainingRequestBase):
    pass


class TrainingRequestUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    preferred_days: list[int] | None = None
    preferred_times: dict[str, Any] | None = None
    district_ids: list[int] | None = None
    elo_min: int | None = None
    elo_max: int | None = None
    phone: str | None = None
    status: str | None = None


class TrainingRequestResponse(TrainingRequestBase):
    id: int
    player_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    player_email: str | None = None  # filled by API for contact
    player_name: str | None = None  # filled by API from user first_name + last_name

    class Config:
        from_attributes = True


class TrainingRequestPublicResponse(BaseModel):
    """Training request list item for unauthenticated users – no description, no player id."""

    id: int
    title: str
    preferred_days: list[int]
    district_ids: list[int]
    elo_min: int
    elo_max: int
    status: str
    created_at: datetime
    player_email: str | None = None  # for contact (when authenticated as club)
    player_name: str | None = None  # from user first_name + last_name
    phone: str | None = None

    class Config:
        from_attributes = True
