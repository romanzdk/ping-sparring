"""add sport to trainings and training_requests

Revision ID: f5_add_sport
Revises: e4_add_phone
Create Date: 2026-01-31 24:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f5_add_sport"
down_revision: Union[str, None] = "e4_add_phone"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "trainings",
        sa.Column("sport", sa.String(), nullable=False, server_default="stolni_tenis"),
    )
    op.add_column(
        "training_requests",
        sa.Column("sport", sa.String(), nullable=False, server_default="stolni_tenis"),
    )


def downgrade() -> None:
    op.drop_column("training_requests", "sport")
    op.drop_column("trainings", "sport")
