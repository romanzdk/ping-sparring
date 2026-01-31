"""add registration status waitlist

Revision ID: b1_add_waitlist
Revises: a4896e1b2b85
Create Date: 2026-01-31 20:30:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b1_add_waitlist"
down_revision: Union[str, None] = "a4896e1b2b85"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE registrationstatus ADD VALUE IF NOT EXISTS 'waitlist'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values easily; leave as-is or recreate type
    pass
