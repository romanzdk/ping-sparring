from datetime import datetime, time
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Time,
    ForeignKey,
    Boolean,
    Enum as SQLEnum,
    Numeric,
    Text,
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ApprovalMode(str, enum.Enum):
    AUTO = "auto"
    MANUAL = "manual"


class ScheduleType(str, enum.Enum):
    RECURRING = "recurring"  # weekly repeating
    ONE_TIME = "one_time"  # single specific date


class TrainingStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Training(Base):
    __tablename__ = "trainings"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    location = Column(String, nullable=False)
    address = Column(String, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    region_id = Column(Integer, nullable=False)  # Denormalized for performance
    elo_min = Column(Integer, nullable=False)
    elo_max = Column(Integer, nullable=False)
    elo_tolerance = Column(Integer, default=100, nullable=False)
    capacity = Column(Integer, nullable=False)  # Capacity for guest players
    fee = Column(Numeric(10, 2), nullable=True)
    rules = Column(Text, nullable=True)  # Training rules (own balls, etc.)
    approval_mode = Column(SQLEnum(ApprovalMode), default=ApprovalMode.AUTO, nullable=False)
    schedule_type = Column(
        SQLEnum(ScheduleType, name="scheduletype", values_callable=lambda x: [e.value for e in x]),
        default=ScheduleType.RECURRING,
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    club = relationship("Club", back_populates="trainings")
    district = relationship("District", back_populates="trainings")
    sessions = relationship("TrainingSession", back_populates="training")


class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True, index=True)
    training_id = Column(Integer, ForeignKey("trainings.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    status = Column(SQLEnum(TrainingStatus), default=TrainingStatus.SCHEDULED, nullable=False)
    actual_participants_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    training = relationship("Training", back_populates="sessions")
    registrations = relationship("Registration", back_populates="training_session")
    waitlist_entries = relationship("WaitlistEntry", back_populates="training_session")
