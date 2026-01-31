from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    Text,
    Boolean,
    JSON,
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TrainingRequestStatus(str, enum.Enum):
    OPEN = "open"
    MATCHED = "matched"
    CLOSED = "closed"


class TrainingRequest(Base):
    """Player's request for training/sparring partner."""

    __tablename__ = "training_requests"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    sport = Column(String, nullable=False, default="stolni_tenis")
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    preferred_days = Column(JSON, nullable=False, default=list)  # List of day numbers [0-6]
    preferred_times = Column(JSON, nullable=True)  # {"start": "18:00", "end": "20:00"}
    district_ids = Column(JSON, nullable=False, default=list)  # Preferred districts
    elo_min = Column(Integer, nullable=False)
    elo_max = Column(Integer, nullable=False)
    phone = Column(String, nullable=True)  # optional contact phone
    status = Column(
        SQLEnum(TrainingRequestStatus), default=TrainingRequestStatus.OPEN, nullable=False
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    player = relationship("Player", back_populates="training_requests")
