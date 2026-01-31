"""update_userrole_enum_to_club

Revision ID: e6705ce94552
Revises: 96cc65e782d9
Create Date: 2026-01-31 19:25:33.615301

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e6705ce94552"
down_revision: Union[str, None] = "96cc65e782d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First, convert the column to text temporarily
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE text USING role::text")

    # Update all ORGANIZER and COACH records to CLUB
    op.execute("UPDATE users SET role = 'CLUB' WHERE role IN ('ORGANIZER', 'COACH')")

    # Create new enum with only PLAYER and CLUB
    op.execute("CREATE TYPE userrole_new AS ENUM ('PLAYER', 'CLUB')")

    # Change column type to new enum
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole_new USING role::userrole_new")

    # Drop old enum and rename new one
    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_new RENAME TO userrole")


def downgrade() -> None:
    # Convert to text first
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE text USING role::text")

    # Recreate old enum
    op.execute("CREATE TYPE userrole_old AS ENUM ('PLAYER', 'ORGANIZER', 'COACH')")

    # Update CLUB back to ORGANIZER
    op.execute("UPDATE users SET role = 'ORGANIZER' WHERE role = 'CLUB'")

    # Change column type back
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole_old USING role::userrole_old")

    # Drop new enum and rename old one
    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_old RENAME TO userrole")
