"""add district Jiný (Other)

Revision ID: c2_add_jiny
Revises: b1_add_waitlist
Create Date: 2026-01-31 21:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


revision: str = "c2_add_jiny"
down_revision: Union[str, None] = "b1_add_waitlist"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "INSERT INTO districts (name, code, region_id) "
        "SELECT 'Jiný', 'JINY', id FROM regions "
        "WHERE NOT EXISTS (SELECT 1 FROM districts WHERE code = 'JINY') "
        "LIMIT 1"
    )


def downgrade() -> None:
    op.execute("DELETE FROM districts WHERE code = 'JINY'")
