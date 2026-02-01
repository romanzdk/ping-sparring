"""add rejoin_count to registrations

Revision ID: h0_rejoin_count
Revises: g9_player_unregistered
Create Date: 2026-02-01

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "h0_rejoin_count"
down_revision: Union[str, None] = "g9_player_unregistered"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add rejoin_count column to registrations table
    op.add_column(
        "registrations",
        sa.Column("rejoin_count", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    # Remove rejoin_count column from registrations table
    op.drop_column("registrations", "rejoin_count")
