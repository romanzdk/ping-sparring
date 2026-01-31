from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole, Player, Club
from app.models.training import Training, TrainingSession, ScheduleType
from app.services.matching import get_recommended_trainings, get_suitable_players
from app.schemas.training import TrainingResponse

router = APIRouter()


@router.get("/recommendations")
async def get_recommendations(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get recommended trainings for the current player."""
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only players can get recommendations"
        )

    # Get player
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()

    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Player profile not found"
        )

    recommendations = await get_recommended_trainings(player, db, limit)
    trainings = [rec["training"] for rec in recommendations]
    one_time_ids = [t.id for t in trainings if t.schedule_type == ScheduleType.ONE_TIME]
    session_dates: dict[int, object] = {}
    if one_time_ids:
        subq = (
            select(TrainingSession.training_id, func.min(TrainingSession.date).label("first_date"))
            .where(TrainingSession.training_id.in_(one_time_ids))
            .group_by(TrainingSession.training_id)
        )
        res = await db.execute(subq)
        session_dates = {row.training_id: row.first_date for row in res.all()}

    return [
        {
            "training": TrainingResponse.model_validate(rec["training"]).model_copy(
                update={"session_date": session_dates.get(rec["training"].id)}
            ),
            "elo_score": rec["elo_score"],
            "region_score": rec["region_score"],
            "reliability_score": rec["reliability_score"],
            "time_score": rec["time_score"],
            "total_score": rec["total_score"],
        }
        for rec in recommendations
    ]


@router.get("/trainings/{training_id}/suitable-players")
async def get_suitable_players_for_training(
    training_id: int,
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get suitable players for a training (club only)."""
    if current_user.role != UserRole.CLUB:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only clubs can view suitable players"
        )

    # Get training
    result = await db.execute(select(Training).where(Training.id == training_id))
    training = result.scalar_one_or_none()

    if not training:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training not found")

    # Check ownership
    result = await db.execute(select(Club).where(Club.user_id == current_user.id))
    club = result.scalar_one_or_none()
    if club and training.club_id != club.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view suitable players for your own trainings",
        )

    suitable_players = await get_suitable_players(training, db, limit)

    from app.schemas.user import PlayerResponse

    return [
        {
            "player": PlayerResponse.model_validate(sp["player"]),
            "elo_score": sp["elo_score"],
            "region_score": sp["region_score"],
            "reliability_score": sp["reliability_score"],
            "total_score": sp["total_score"],
        }
        for sp in suitable_players
    ]
