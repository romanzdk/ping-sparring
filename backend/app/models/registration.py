from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum as SQLEnum, Numeric
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class RegistrationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    WAITLIST = "waitlist"


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    training_session_id = Column(Integer, ForeignKey("training_sessions.id"), nullable=False)
    status = Column(SQLEnum(RegistrationStatus), default=RegistrationStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    approved_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    rejoin_count = Column(
        Integer, default=0, nullable=False
    )  # Tracks how many times player rejoined after cancelling

    # Relationships
    player = relationship("Player", back_populates="registrations")
    training_session = relationship("TrainingSession", back_populates="registrations")


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    training_session_id = Column(Integer, ForeignKey("training_sessions.id"), nullable=False)
    position = Column(Integer, nullable=False)  # Position in waitlist (1, 2, 3...)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    player = relationship("Player", back_populates="waitlist_entries")
    training_session = relationship("TrainingSession", back_populates="waitlist_entries")


class ReputationScore(Base):
    __tablename__ = "reputation_scores"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), unique=True, nullable=False)
    total_registrations = Column(Integer, default=0, nullable=False)
    completed_trainings = Column(Integer, default=0, nullable=False)
    no_shows = Column(Integer, default=0, nullable=False)
    last_minute_cancellations = Column(Integer, default=0, nullable=False)  # <12h before
    cancellations_24h_48h = Column(Integer, default=0, nullable=False)  # 24-48h before
    cancellations_12h_24h = Column(Integer, default=0, nullable=False)  # 12-24h before
    reliability_score = Column(Numeric(5, 2), default=100.0, nullable=False)  # 0-100
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    player = relationship("Player", back_populates="reputation_score")
