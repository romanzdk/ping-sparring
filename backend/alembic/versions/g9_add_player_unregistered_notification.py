"""add player_unregistered notification type

Revision ID: g9_player_unregistered
Revises: g8_reputation_tiers
Create Date: 2026-02-01

"""

from typing import Sequence, Union

from alembic import op


revision: str = "g9_player_unregistered"
down_revision: Union[str, None] = "g8_reputation_tiers"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'player_unregistered'")


def downgrade() -> None:
    pass
