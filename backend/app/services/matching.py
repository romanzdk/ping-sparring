"""
Matching algorithm for pairing players with trainings.
"""

from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from app.models.region import District
from sqlalchemy.orm import selectinload

from app.models.training import Training, TrainingSession, TrainingStatus
from app.models.user import Player
from app.models.registration import Registration, RegistrationStatus, ReputationScore


def calculate_elo_fit_score(
    player_elo: int, training_elo_min: int, training_elo_max: int, tolerance: int
) -> float:
    """
    Calculate ELO compatibility score (0-100).
    Higher score = better match.
    """
    # Check if player ELO is within tolerance
    min_allowed = training_elo_min - tolerance
    max_allowed = training_elo_max + tolerance

    if player_elo < min_allowed or player_elo > max_allowed:
        return 0.0

    # Calculate how close to the center of the range
    center = (training_elo_min + training_elo_max) / 2
    range_size = training_elo_max - training_elo_min

    if range_size == 0:
        # Exact match
        distance = abs(player_elo - center)
        if distance == 0:
            return 100.0
        # Score decreases with distance
        return max(0.0, 100.0 - (distance / tolerance) * 50.0)

    # Normalize distance from center
    distance_from_center = abs(player_elo - center)
    normalized_distance = distance_from_center / (range_size / 2)

    # Score: 100 at center, decreases linearly to 50 at edges
    score = 100.0 - (normalized_distance * 50.0)

    return max(50.0, score)


def calculate_region_score(
    player_districts: List[int],
    player_region_id: int | None,
    training_district_id: int,
    training_region_id: int,
) -> float:
    """
    Calculate region compatibility score (0-100).
    - 100: Same district
    - 75: Same region, different district
    - 50: Adjacent region (not implemented, would need distance data)
    - 0: Different region
    """
    # Check if player's primary districts include training district
    if training_district_id in player_districts:
        return 100.0

    # Check if same region
    if player_region_id == training_region_id:
        return 75.0

    # Different region
    return 0.0


def calculate_reliability_score(reputation: ReputationScore | None) -> float:
    """
    Calculate reliability score based on reputation (0-100).
    """
    if not reputation:
        # New player, default score
        return 70.0

    return float(reputation.reliability_score)


def calculate_time_availability_score(
    player_availability: dict | None,
    training_day_of_week: int,
    training_start_time: str,
    training_end_time: str,
) -> float:
    """
    Calculate time availability score (0-100).
    Checks if player's availability matches training time.
    """
    if not player_availability:
        # No availability data, assume flexible
        return 50.0

    # Day names mapping (0=Monday, 6=Sunday)
    day_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    day_name = day_names[training_day_of_week]

    if day_name not in player_availability:
        return 0.0

    player_times = player_availability[day_name]
    if not player_times:
        return 0.0

    # Check if training time overlaps with any of player's available times
    # Simple check: if training time is within any available slot
    training_start = _time_to_minutes(training_start_time)
    training_end = _time_to_minutes(training_end_time)

    for time_slot in player_times:
        if isinstance(time_slot, str) and "-" in time_slot:
            slot_start_str, slot_end_str = time_slot.split("-")
            slot_start = _time_to_minutes(slot_start_str.strip())
            slot_end = _time_to_minutes(slot_end_str.strip())

            # Check overlap
            if training_start >= slot_start and training_end <= slot_end:
                return 100.0
            elif training_start < slot_end and training_end > slot_start:
                # Partial overlap
                return 75.0

    return 0.0


def _time_to_minutes(time_str: str) -> int:
    """Convert time string (HH:MM) to minutes since midnight."""
    try:
        parts = time_str.split(":")
        hours = int(parts[0])
        minutes = int(parts[1]) if len(parts) > 1 else 0
        return hours * 60 + minutes
    except:
        return 0


async def get_recommended_trainings(
    player: Player, db: AsyncSession, limit: int = 20
) -> List[dict]:
    """
    Get recommended trainings for a player.
    Returns list of trainings with match scores.
    """
    # Get player's reputation
    result = await db.execute(select(ReputationScore).where(ReputationScore.player_id == player.id))
    reputation = result.scalar_one_or_none()

    # Get active trainings
    result = await db.execute(select(Training).where(Training.is_active == True))
    trainings = result.scalars().all()

    # Get player's region (from first district if available)
    player_region_id = None
    if player.primary_districts:
        result = await db.execute(
            select(District.region_id).where(District.id == player.primary_districts[0]).limit(1)
        )
        region_row = result.scalar_one_or_none()
        if region_row:
            player_region_id = region_row

    recommendations = []

    for training in trainings:
        # Calculate scores
        elo_score = calculate_elo_fit_score(
            player.elo, training.elo_min, training.elo_max, training.elo_tolerance
        )

        # Skip if ELO doesn't match at all
        if elo_score == 0:
            continue

        region_score = calculate_region_score(
            player.primary_districts, player_region_id, training.district_id, training.region_id
        )

        reliability_score = calculate_reliability_score(reputation)

        # Time availability (simplified - would need actual session times)
        time_score = 50.0  # Default, would calculate from sessions

        # Weighted total score
        total_score = (
            elo_score * 0.4  # ELO is most important
            + region_score * 0.3  # Region is important
            + reliability_score * 0.2  # Reliability matters
            + time_score * 0.1  # Time availability
        )

        recommendations.append(
            {
                "training": training,
                "elo_score": elo_score,
                "region_score": region_score,
                "reliability_score": reliability_score,
                "time_score": time_score,
                "total_score": total_score,
            }
        )

    # Sort by total score (descending)
    recommendations.sort(key=lambda x: x["total_score"], reverse=True)

    return recommendations[:limit]


async def get_suitable_players(training: Training, db: AsyncSession, limit: int = 20) -> List[dict]:
    """
    Get suitable players for a training.
    Returns list of players with match scores.
    """
    # Get all players
    result = await db.execute(select(Player))
    players = result.scalars().all()

    suitable_players = []

    for player in players:
        # Check ELO compatibility
        elo_score = calculate_elo_fit_score(
            player.elo, training.elo_min, training.elo_max, training.elo_tolerance
        )

        # Skip if ELO doesn't match
        if elo_score == 0:
            continue

        # Get reputation
        result = await db.execute(
            select(ReputationScore).where(ReputationScore.player_id == player.id)
        )
        reputation = result.scalar_one_or_none()

        # Calculate scores
        region_score = calculate_region_score(
            player.primary_districts,
            None,  # Would need player region_id
            training.district_id,
            training.region_id,
        )

        reliability_score = calculate_reliability_score(reputation)

        # Weighted total score
        total_score = elo_score * 0.4 + region_score * 0.3 + reliability_score * 0.3

        suitable_players.append(
            {
                "player": player,
                "elo_score": elo_score,
                "region_score": region_score,
                "reliability_score": reliability_score,
                "total_score": total_score,
            }
        )

    # Sort by total score (descending)
    suitable_players.sort(key=lambda x: x["total_score"], reverse=True)

    return suitable_players[:limit]
