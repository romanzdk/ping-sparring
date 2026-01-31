"""
Reputation system for tracking player reliability.
"""

from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from decimal import Decimal

from app.models.registration import ReputationScore, Registration, RegistrationStatus
from app.models.training import TrainingSession, TrainingStatus
from app.models.user import Player, Club


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

    # Count no-shows (approved registrations for completed sessions where player didn't show)
    # This would need additional tracking - for now, we'll use a simplified approach
    # Assuming no-show if registration was approved but training was completed
    # In a real system, you'd track actual attendance
    no_shows = 0  # Placeholder - would need attendance tracking

    # Count last minute cancellations (cancelled within 24 hours of training)
    result = await db.execute(
        select(func.count(Registration.id))
        .join(TrainingSession)
        .where(
            and_(
                Registration.player_id == player_id,
                Registration.status == RegistrationStatus.CANCELLED,
                Registration.cancelled_at.isnot(None),
                TrainingSession.date - Registration.cancelled_at < timedelta(hours=24),
            )
        )
    )
    last_minute_cancellations = result.scalar_one() or 0

    # Calculate reliability score
    # Base score: 100
    # Deduct points for:
    # - No-shows: -20 points each
    # - Last minute cancellations: -10 points each
    # - Low completion rate: proportional deduction

    score = Decimal("100.0")

    # Deduct for no-shows
    score -= Decimal(str(no_shows * 20))

    # Deduct for last minute cancellations
    score -= Decimal(str(last_minute_cancellations * 10))

    # Deduct for low completion rate (if less than 80% completion)
    if total_registrations > 0:
        completion_rate = completed_trainings / total_registrations
        if completion_rate < 0.8:
            score -= Decimal(str((0.8 - completion_rate) * 50))

    # Ensure score is between 0 and 100
    score = max(Decimal("0.0"), min(Decimal("100.0"), score))

    # Update reputation
    reputation.total_registrations = total_registrations
    reputation.completed_trainings = completed_trainings
    reputation.no_shows = no_shows
    reputation.last_minute_cancellations = last_minute_cancellations
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
