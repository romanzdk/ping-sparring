"""add rejected_at to registrations

Revision ID: h2_rejected_at
Revises: h1_email_verified
Create Date: 2026-02-01

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "h2_rejected_at"
down_revision: Union[str, None] = "h1_email_verified"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "registrations",
        sa.Column("rejected_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("registrations", "rejected_at")
