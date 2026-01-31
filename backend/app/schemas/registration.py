from datetime import datetime
from pydantic import BaseModel


class RegistrationBase(BaseModel):
    training_session_id: int


class RegistrationCreate(RegistrationBase):
    pass


class RegistrationResponse(BaseModel):
    id: int
    player_id: int
    training_session_id: int
    status: str
    created_at: datetime
    approved_at: datetime | None
    cancelled_at: datetime | None

    class Config:
        from_attributes = True


class RegistrationDetailResponse(RegistrationResponse):
    """Registration with session and training info for detail view."""

    session_date: datetime
    training_id: int
    training_title: str


class RegistrationWithPlayerResponse(RegistrationResponse):
    """Registration with player name for club view."""

    player_name: str


class WaitlistEntryResponse(BaseModel):
    id: int
    player_id: int
    training_session_id: int
    position: int
    created_at: datetime

    class Config:
        from_attributes = True
