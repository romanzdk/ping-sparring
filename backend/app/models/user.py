from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, JSON, Boolean
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    PLAYER = "player"
    CLUB = "club"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)

    # Relationships
    player = relationship("Player", back_populates="user", uselist=False)
    club = relationship("Club", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    elo = Column(Integer, nullable=False)
    official_elo = Column(Integer, nullable=True)
    primary_districts = Column(JSON, nullable=False, default=list)  # List of district IDs
    home_address = Column(String, nullable=True)
    max_travel_distance = Column(Integer, nullable=True)  # in km
    availability = Column(JSON, nullable=True)  # {"monday": ["18:00-20:00"], ...}
    max_trainings_per_week = Column(Integer, nullable=True)

    # Relationships
    user = relationship("User", back_populates="player")
    registrations = relationship("Registration", back_populates="player")
    waitlist_entries = relationship("WaitlistEntry", back_populates="player")
    reputation_score = relationship("ReputationScore", back_populates="player", uselist=False)
    training_requests = relationship("TrainingRequest", back_populates="player")


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    club_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)  # optional contact phone
    contact_info = Column(JSON, nullable=True)  # {"phone": "...", "email": "..."}

    # Relationships
    user = relationship("User", back_populates="club")
    trainings = relationship("Training", back_populates="club")
