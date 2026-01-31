"""add training schedule_type (recurring / one_time)

Revision ID: d3_add_schedule_type
Revises: c2_add_jiny
Create Date: 2026-01-31 22:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d3_add_schedule_type"
down_revision: Union[str, None] = "c2_add_jiny"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE scheduletype AS ENUM ('recurring', 'one_time')")
    op.add_column(
        "trainings",
        sa.Column(
            "schedule_type",
            sa.Enum("recurring", "one_time", name="scheduletype"),
            nullable=False,
            server_default="recurring",
        ),
    )


def downgrade() -> None:
    op.drop_column("trainings", "schedule_type")
    op.execute("DROP TYPE scheduletype")
