from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    read: bool
    action_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True
