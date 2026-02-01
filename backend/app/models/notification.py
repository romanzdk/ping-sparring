from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    REGISTRATION_CONFIRMED = "registration_confirmed"
    REGISTRATION_APPROVED = "registration_approved"
    REGISTRATION_REJECTED = "registration_rejected"
    PLAYER_REGISTERED = "player_registered"  # to club when a player signs up
    PLAYER_UNREGISTERED = "player_unregistered"  # to club when a player cancels
    TRAINING_REMINDER = "training_reminder"
    WAITLIST_SPOT_AVAILABLE = "waitlist_spot_available"
    TRAINING_CANCELLED = "training_cancelled"
    TRAINING_UPDATED = "training_updated"  # club changed training details
    TRAINING_REMOVED = "training_removed"  # club removed (deactivated) training


class NotificationTypeColumn(SQLEnum):
    """Enum column that accepts both DB value (e.g. registration_confirmed) and
    enum name (e.g. REGISTRATION_CONFIRMED) when loading from DB, so legacy or
    driver-returned values do not cause KeyError.
    """

    def _object_value_for_elem(self, elem: str):
        try:
            return self._object_lookup[elem]
        except KeyError:
            pass
        if self.enum_class is not None:
            try:
                return self.enum_class[elem]
            except KeyError:
                pass
        raise LookupError(
            "'%s' is not among the defined enum values. "
            "Enum name: %s. Possible values: %s"
            % (elem, self.name, list(self._object_lookup.keys())),
        ) from None


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(
        NotificationTypeColumn(
            NotificationType,
            name="notificationtype",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    action_url = Column(String, nullable=True)  # URL to relevant page
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")
