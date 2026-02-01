"""add player_registered notification type

Revision ID: f6_player_registered
Revises: f5_add_sport
Create Date: 2026-02-01

"""

from typing import Sequence, Union

from alembic import op


revision: str = "f6_player_registered"
down_revision: Union[str, None] = "f5_add_sport"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'player_registered'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values easily
    pass
