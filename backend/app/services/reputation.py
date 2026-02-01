"""
Reputation system for tracking player reliability.

Cancellation tiers (by time before session):
- 48h+ before: no penalty
- 24–48h before: light penalty (-3)
- 12–24h before: medium penalty (-7)
- <12h before: heavy penalty (-15)
"""

from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from decimal import Decimal

from app.models.registration import ReputationScore, Registration, RegistrationStatus
from app.models.training import TrainingSession, TrainingStatus
from app.models.user import Player


# Penalty points per cancellation tier
PENALTY_24H_48H = 3
PENALTY_12H_24H = 7
PENALTY_UNDER_12H = 15


async def update_reputation_score(player_id: int, db: AsyncSession):
    """
    Update reputation score for a player based on their history.
    """
    # Get or create reputation score
    result = await db.execute(select(ReputationScore).where(ReputationScore.player_id == player_id))
    reputation = result.scalar_one_or_none()

    if not reputation:
        reputation = ReputationScore(
            player_id=player_id,
            total_registrations=0,
            completed_trainings=0,
            no_shows=0,
            last_minute_cancellations=0,
            cancellations_24h_48h=0,
            cancellations_12h_24h=0,
            reliability_score=Decimal("100.0"),
        )
        db.add(reputation)
        await db.flush()

    # Count total registrations
    result = await db.execute(
        select(func.count(Registration.id)).where(Registration.player_id == player_id)
    )
    total_registrations = result.scalar_one() or 0

    # Count completed trainings (approved registrations for completed sessions)
    result = await db.execute(
        select(func.count(Registration.id))
        .join(TrainingSession)
        .where(
            and_(
                Registration.player_id == player_id,
                Registration.status == RegistrationStatus.APPROVED,
                TrainingSession.status == TrainingStatus.COMPLETED,
            )
        )
    )
    completed_trainings = result.scalar_one() or 0

    no_shows = 0  # Placeholder - would need attendance tracking

    # Count cancellations by tier: fetch cancelled regs with session date
    result = await db.execute(
        select(Registration.cancelled_at, TrainingSession.date)
        .join(TrainingSession, Registration.training_session_id == TrainingSession.id)
        .where(
            and_(
                Registration.player_id == player_id,
                Registration.status == RegistrationStatus.CANCELLED,
                Registration.cancelled_at.isnot(None),
            )
        )
    )
    rows = result.all()
    cancellations_24h_48h = 0
    cancellations_12h_24h = 0
    last_minute_cancellations = 0
    for cancelled_at, session_date in rows:
        if cancelled_at is None or session_date is None:
            continue
        delta = session_date - cancelled_at
        if delta < timedelta(hours=12):
            last_minute_cancellations += 1
        elif delta < timedelta(hours=24):
            cancellations_12h_24h += 1
        elif delta < timedelta(hours=48):
            cancellations_24h_48h += 1
        # 48h+ before: no penalty, not counted

    # Base score: 100. Deduct for no-shows, tiered cancellations, low completion rate
    score = Decimal("100.0")
    score -= Decimal(str(no_shows * 20))
    score -= Decimal(str(cancellations_24h_48h * PENALTY_24H_48H))
    score -= Decimal(str(cancellations_12h_24h * PENALTY_12H_24H))
    score -= Decimal(str(last_minute_cancellations * PENALTY_UNDER_12H))

    if total_registrations > 0:
        completion_rate = completed_trainings / total_registrations
        if completion_rate < 0.8:
            score -= Decimal(str((0.8 - completion_rate) * 50))

    score = max(Decimal("0.0"), min(Decimal("100.0"), score))

    reputation.total_registrations = total_registrations
    reputation.completed_trainings = completed_trainings
    reputation.no_shows = no_shows
    reputation.last_minute_cancellations = last_minute_cancellations
    reputation.cancellations_24h_48h = cancellations_24h_48h
    reputation.cancellations_12h_24h = cancellations_12h_24h
    reputation.reliability_score = score
    reputation.updated_at = datetime.utcnow()

    await db.commit()

    return reputation


async def record_no_show(player_id: int, training_session_id: int, db: AsyncSession):
    """Record a no-show for a player."""
    # Get registration
    result = await db.execute(
        select(Registration).where(
            and_(
                Registration.player_id == player_id,
                Registration.training_session_id == training_session_id,
                Registration.status == RegistrationStatus.APPROVED,
            )
        )
    )
    registration = result.scalar_one_or_none()

    if not registration:
        return

    # Update reputation
    await update_reputation_score(player_id, db)

    # TODO: Could mark registration with no-show flag if we add that field


async def record_attendance(player_id: int, training_session_id: int, db: AsyncSession):
    """Record attendance for a player."""
    # Get registration
    result = await db.execute(
        select(Registration).where(
            and_(
                Registration.player_id == player_id,
                Registration.training_session_id == training_session_id,
                Registration.status == RegistrationStatus.APPROVED,
            )
        )
    )
    registration = result.scalar_one_or_none()

    if not registration:
        return

    # Update reputation
    await update_reputation_score(player_id, db)

    # TODO: Could mark registration as attended if we add that field
