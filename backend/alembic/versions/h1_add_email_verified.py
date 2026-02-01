"""add email_verified to users

Revision ID: h1_email_verified
Revises: h0_rejoin_count
Create Date: 2026-02-01

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "h1_email_verified"
down_revision: Union[str, None] = "h0_rejoin_count"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add email_verified column to users table
    # Default to False for new users, existing users will also be False
    op.add_column(
        "users",
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    # Remove email_verified column from users table
    op.drop_column("users", "email_verified")
