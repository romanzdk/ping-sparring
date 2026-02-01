from datetime import datetime, time
from pydantic import BaseModel, field_validator
from decimal import Decimal


class TrainingBase(BaseModel):
    sport: str = "stolni_tenis"
    title: str | None = None
    description: str | None = None
    schedule_type: str = "recurring"  # "recurring" | "one_time"

    @field_validator("schedule_type", mode="before")
    @classmethod
    def coerce_schedule_type(cls, v: object) -> str:
        if hasattr(v, "value"):
            return str(v.value)
        return str(v) if v else "recurring"

    day_of_week: int  # 0=Monday, 6=Sunday (for recurring; for one_time = day of session)
    start_time: time
    end_time: time
    location: str
    address: str
    district_id: int
    elo_min: int
    elo_max: int
    elo_tolerance: int = 100
    capacity: int
    fee: Decimal | None = None
    rules: str | None = None
    approval_mode: str = "auto"  # "auto" or "manual"


class TrainingCreate(TrainingBase):
    pass


class TrainingResponse(TrainingBase):
    id: int
    club_id: int
    region_id: int
    is_active: bool
    created_at: datetime
    contact_email: str | None = None  # club's user email, filled by API
    contact_phone: str | None = None  # club phone, filled by API
    club_name: str | None = None  # club name, filled by API
    session_date: datetime | None = None  # for one_time: date of the single session
    free_spots_next: int | None = None  # free spots on next upcoming scheduled session

    class Config:
        from_attributes = True


class TrainingPublicResponse(BaseModel):
    """Training list item for unauthenticated users – no exact place, only district."""

    id: int
    sport: str = "stolni_tenis"
    title: str
    description: str | None = None
    schedule_type: str = "recurring"
    day_of_week: int
    start_time: time
    end_time: time
    district_id: int
    district_name: str
    region_id: int
    elo_min: int
    elo_max: int
    elo_tolerance: int = 100
    capacity: int
    fee: Decimal | None = None
    is_active: bool
    created_at: datetime
    contact_email: str | None = None
    contact_phone: str | None = None
    club_name: str | None = None
    session_date: datetime | None = None  # for one_time: date of the single session
    free_spots_next: int | None = None  # free spots on next upcoming scheduled session

    class Config:
        from_attributes = True


class TrainingSessionCreate(BaseModel):
    date: datetime


class TrainingSessionResponse(BaseModel):
    id: int
    training_id: int
    date: datetime
    status: str
    actual_participants_count: int
    registered_count: int = 0  # count of approved + pending registrations
    created_at: datetime

    class Config:
        from_attributes = True
