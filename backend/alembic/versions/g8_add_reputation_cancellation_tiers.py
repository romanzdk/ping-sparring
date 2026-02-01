"""add reputation cancellation tiers (24-48h, 12-24h)

Revision ID: g8_reputation_tiers
Revises: f7_training_notifications
Create Date: 2026-02-01

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "g8_reputation_tiers"
down_revision: Union[str, None] = "f7_training_notifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "reputation_scores",
        sa.Column("cancellations_24h_48h", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "reputation_scores",
        sa.Column("cancellations_12h_24h", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("reputation_scores", "cancellations_12h_24h")
    op.drop_column("reputation_scores", "cancellations_24h_48h")
