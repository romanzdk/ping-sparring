"""add optional phone to clubs and training_requests

Revision ID: e4_add_phone
Revises: d3_add_schedule_type
Create Date: 2026-01-31 23:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4_add_phone"
down_revision: Union[str, None] = "d3_add_schedule_type"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("clubs", sa.Column("phone", sa.String(), nullable=True))
    op.add_column("training_requests", sa.Column("phone", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("training_requests", "phone")
    op.drop_column("clubs", "phone")
