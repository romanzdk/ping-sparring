"""initial schema

Reconstructed from model dependencies and later migrations (96cc65e782d9, e6705ce94552, a4896e1b2b85, b1).
Creates: regions, districts, users, players, organizers, coaches, trainings, training_sessions,
registrations, waitlist_entries, reputation_scores, notifications.

Revision ID: 001_initial_schema
Revises: None
Create Date: 2026-01-31 (reconstructed)

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enums (001 had PLAYER, ORGANIZER, COACH; e6705ce94552 later changes to PLAYER, CLUB)
    op.execute("CREATE TYPE userrole AS ENUM ('PLAYER', 'ORGANIZER', 'COACH')")
    op.execute("CREATE TYPE approvalmode AS ENUM ('auto', 'manual')")
    op.execute("CREATE TYPE trainingstatus AS ENUM ('scheduled', 'cancelled', 'completed')")
    op.execute(
        "CREATE TYPE registrationstatus AS ENUM ('pending', 'approved', 'rejected', 'cancelled')"
    )
    op.execute(
        "CREATE TYPE notificationtype AS ENUM ("
        "'registration_confirmed', 'registration_approved', 'registration_rejected', "
        "'training_reminder', 'waitlist_spot_available', 'training_cancelled')"
    )

    # Regions
    op.create_table(
        "regions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_regions_id"), "regions", ["id"], unique=False)
    op.create_index(op.f("ix_regions_name"), "regions", ["name"], unique=True)
    op.create_index(op.f("ix_regions_code"), "regions", ["code"], unique=True)

    # Districts
    op.create_table(
        "districts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("region_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["region_id"], ["regions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_districts_id"), "districts", ["id"], unique=False)

    # Users (no first_name, last_name – added in a4896e1b2b85)
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", sa.Enum("PLAYER", "ORGANIZER", "COACH", name="userrole"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # Players
    op.create_table(
        "players",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("elo", sa.Integer(), nullable=False),
        sa.Column("official_elo", sa.Integer(), nullable=True),
        sa.Column(
            "primary_districts",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column("home_address", sa.String(), nullable=True),
        sa.Column("max_travel_distance", sa.Integer(), nullable=True),
        sa.Column("availability", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("max_trainings_per_week", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_players_id"), "players", ["id"], unique=False)

    # Organizers (dropped in 96cc65e782d9, replaced by clubs)
    op.create_table(
        "organizers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("club_name", sa.String(), nullable=False),
        sa.Column("contact_info", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_organizers_id"), "organizers", ["id"], unique=False)

    # Coaches (dropped in 96cc65e782d9)
    op.create_table(
        "coaches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("organizer_id", sa.Integer(), nullable=True),
        sa.Column("can_approve_trainings", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["organizer_id"], ["organizers.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_coaches_id"), "coaches", ["id"], unique=False)

    # Trainings (organizer_id, coach_id; 96cc65e782d9 replaces with club_id)
    op.create_table(
        "trainings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organizer_id", sa.Integer(), nullable=False),
        sa.Column("coach_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("location", sa.String(), nullable=False),
        sa.Column("address", sa.String(), nullable=False),
        sa.Column("district_id", sa.Integer(), nullable=False),
        sa.Column("region_id", sa.Integer(), nullable=False),
        sa.Column("elo_min", sa.Integer(), nullable=False),
        sa.Column("elo_max", sa.Integer(), nullable=False),
        sa.Column("elo_tolerance", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("fee", sa.Numeric(10, 2), nullable=True),
        sa.Column("rules", sa.Text(), nullable=True),
        sa.Column(
            "approval_mode",
            sa.Enum("auto", "manual", name="approvalmode"),
            nullable=False,
            server_default="auto",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["coach_id"], ["coaches.id"]),
        sa.ForeignKeyConstraint(["district_id"], ["districts.id"]),
        sa.ForeignKeyConstraint(["organizer_id"], ["organizers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_trainings_id"), "trainings", ["id"], unique=False)

    # Training sessions
    op.create_table(
        "training_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("training_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.DateTime(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("scheduled", "cancelled", "completed", name="trainingstatus"),
            nullable=False,
            server_default="scheduled",
        ),
        sa.Column("actual_participants_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["training_id"], ["trainings.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_training_sessions_id"), "training_sessions", ["id"], unique=False)

    # Registrations (b1 adds 'waitlist' to registrationstatus later)
    op.create_table(
        "registrations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("player_id", sa.Integer(), nullable=False),
        sa.Column("training_session_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", "cancelled", name="registrationstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"]),
        sa.ForeignKeyConstraint(["training_session_id"], ["training_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_registrations_id"), "registrations", ["id"], unique=False)

    # Waitlist entries
    op.create_table(
        "waitlist_entries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("player_id", sa.Integer(), nullable=False),
        sa.Column("training_session_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"]),
        sa.ForeignKeyConstraint(["training_session_id"], ["training_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_waitlist_entries_id"), "waitlist_entries", ["id"], unique=False)

    # Reputation scores
    op.create_table(
        "reputation_scores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("player_id", sa.Integer(), nullable=False),
        sa.Column("total_registrations", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed_trainings", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("no_shows", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_minute_cancellations", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reliability_score", sa.Numeric(5, 2), nullable=False, server_default="100.0"),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("player_id"),
    )
    op.create_index(op.f("ix_reputation_scores_id"), "reputation_scores", ["id"], unique=False)

    # Notifications
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "type",
            sa.Enum(
                "registration_confirmed",
                "registration_approved",
                "registration_rejected",
                "training_reminder",
                "waitlist_spot_available",
                "training_cancelled",
                name="notificationtype",
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("action_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_table("notifications")
    op.drop_index(op.f("ix_reputation_scores_id"), table_name="reputation_scores")
    op.drop_table("reputation_scores")
    op.drop_index(op.f("ix_waitlist_entries_id"), table_name="waitlist_entries")
    op.drop_table("waitlist_entries")
    op.drop_index(op.f("ix_registrations_id"), table_name="registrations")
    op.drop_table("registrations")
    op.drop_index(op.f("ix_training_sessions_id"), table_name="training_sessions")
    op.drop_table("training_sessions")
    op.drop_index(op.f("ix_trainings_id"), table_name="trainings")
    op.drop_table("trainings")
    op.drop_index(op.f("ix_coaches_id"), table_name="coaches")
    op.drop_table("coaches")
    op.drop_index(op.f("ix_organizers_id"), table_name="organizers")
    op.drop_table("organizers")
    op.drop_index(op.f("ix_players_id"), table_name="players")
    op.drop_table("players")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
    op.drop_index(op.f("ix_districts_id"), table_name="districts")
    op.drop_table("districts")
    op.drop_index(op.f("ix_regions_code"), table_name="regions")
    op.drop_index(op.f("ix_regions_name"), table_name="regions")
    op.drop_index(op.f("ix_regions_id"), table_name="regions")
    op.drop_table("regions")

    op.execute("DROP TYPE notificationtype")
    op.execute("DROP TYPE registrationstatus")
    op.execute("DROP TYPE trainingstatus")
    op.execute("DROP TYPE approvalmode")
    op.execute("DROP TYPE userrole")
