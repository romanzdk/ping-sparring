"""add training_updated and training_removed notification types

Revision ID: f7_training_notifications
Revises: f6_player_registered
Create Date: 2026-02-01

"""

from typing import Sequence, Union

from alembic import op


revision: str = "f7_training_notifications"
down_revision: Union[str, None] = "f6_player_registered"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'training_updated'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'training_removed'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values easily
    pass
