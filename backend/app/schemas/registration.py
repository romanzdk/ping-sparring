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
    rejoin_count: int = 0

    class Config:
        from_attributes = True


class RegistrationDetailResponse(RegistrationResponse):
    """Registration with session and training info for detail view."""

    session_date: datetime
    training_id: int
    training_title: str
    training_location: str


class RegistrationWithPlayerResponse(RegistrationResponse):
    """Registration with player name for club view."""

    player_name: str


class RegistrationWithPlayerDetailResponse(RegistrationWithPlayerResponse):
    """Registration with full player details for club view (attendee details)."""

    player_email: str | None = None
    player_first_name: str | None = None
    player_last_name: str | None = None
    elo: int = 0
    official_elo: int | None = None
    primary_district_names: list[str] = []
    reliability_score: float | None = None
    home_address: str | None = None
    max_travel_distance: int | None = None
    max_trainings_per_week: int | None = None


class WaitlistEntryResponse(BaseModel):
    id: int
    player_id: int
    training_session_id: int
    position: int
    created_at: datetime

    class Config:
        from_attributes = True
