from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole, Player, Club
from app.models.registration import Registration
from app.schemas.user import UserResponse, PlayerResponse, ClubResponse, PlayerUpdate, ClubUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.get("/me/trainings")
async def get_my_trainings(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Get trainings for current user (player: registrations, club: created trainings)."""
    if current_user.role == UserRole.PLAYER:
        # Get player's registrations
        result = await db.execute(select(Player).where(Player.user_id == current_user.id))
        player = result.scalar_one_or_none()

        if not player:
            return []

        result = await db.execute(select(Registration).where(Registration.player_id == player.id))
        registrations = result.scalars().all()

        return [
            {"id": r.id, "training_session_id": r.training_session_id, "status": r.status.value}
            for r in registrations
        ]

    elif current_user.role == UserRole.CLUB:
        # Get club's trainings - return as list of dicts for JSON (TrainingResponse serialization)
        result = await db.execute(select(Club).where(Club.user_id == current_user.id))
        club = result.scalar_one_or_none()

        if not club:
            return []

        from app.models.training import Training, TrainingSession, ScheduleType
        from app.schemas.training import TrainingResponse

        result = await db.execute(
            select(Training).where(Training.club_id == club.id, Training.is_active == True)
        )
        trainings = result.scalars().all()

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
            TrainingResponse.model_validate(t)
            .model_copy(update={"session_date": session_dates.get(t.id)})
            .model_dump(mode="json")
            for t in trainings
        ]

    return []


@router.get("/me/history", response_model=List[dict])
async def get_my_history(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Get training history for current user."""
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Historii tréninků mají pouze hráči"
        )

    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()

    if not player:
        return []

    from app.models.training import TrainingSession, TrainingStatus

    result = await db.execute(
        select(Registration)
        .join(TrainingSession)
        .where(
            Registration.player_id == player.id, TrainingSession.status == TrainingStatus.COMPLETED
        )
    )
    registrations = result.scalars().all()

    return [
        {"id": r.id, "training_session_id": r.training_session_id, "status": r.status}
        for r in registrations
    ]


@router.get("/me/profile", response_model=PlayerResponse | ClubResponse)
async def get_my_role_profile(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Get detailed role-specific profile (includes user first_name, last_name)."""
    if current_user.role == UserRole.PLAYER:
        result = await db.execute(select(Player).where(Player.user_id == current_user.id))
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(status_code=404, detail="Profil hráče nebyl nalezen")
        data = PlayerResponse.model_validate(profile).model_dump()
        data["first_name"] = current_user.first_name
        data["last_name"] = current_user.last_name
        return data
    elif current_user.role == UserRole.CLUB:
        result = await db.execute(select(Club).where(Club.user_id == current_user.id))
        profile = result.scalar_one_or_none()
        if not profile:
            raise HTTPException(status_code=404, detail="Profil klubu nebyl nalezen")
        data = ClubResponse.model_validate(profile).model_dump()
        data["first_name"] = current_user.first_name
        data["last_name"] = current_user.last_name
        return data
    raise HTTPException(status_code=400, detail="Neplatná role uživatele")


@router.put("/me/profile", response_model=PlayerResponse | ClubResponse)
async def update_my_profile(
    profile_data: PlayerUpdate | ClubUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update role-specific profile (and user first_name, last_name if provided)."""
    if current_user.role == UserRole.PLAYER:
        result = await db.execute(select(Player).where(Player.user_id == current_user.id))
        player = result.scalar_one_or_none()
        if not player:
            raise HTTPException(status_code=404, detail="Profil hráče nebyl nalezen")
        update_data = profile_data.model_dump(exclude_unset=True)
        name_fields = {"first_name", "last_name"}
        for key in list(update_data.keys()):
            if key in name_fields:
                setattr(current_user, key, update_data.pop(key))
        for key, value in update_data.items():
            setattr(player, key, value)
        await db.commit()
        await db.refresh(player)
        await db.refresh(current_user)
        out = PlayerResponse.model_validate(player).model_dump()
        out["first_name"] = current_user.first_name
        out["last_name"] = current_user.last_name
        return out

    elif current_user.role == UserRole.CLUB:
        result = await db.execute(select(Club).where(Club.user_id == current_user.id))
        club = result.scalar_one_or_none()
        if not club:
            raise HTTPException(status_code=404, detail="Profil klubu nebyl nalezen")
        update_data = profile_data.model_dump(exclude_unset=True)
        name_fields = {"first_name", "last_name"}
        for key in list(update_data.keys()):
            if key in name_fields:
                setattr(current_user, key, update_data.pop(key))
        for key, value in update_data.items():
            setattr(club, key, value)
        await db.commit()
        await db.refresh(club)
        await db.refresh(current_user)
        out = ClubResponse.model_validate(club).model_dump()
        out["first_name"] = current_user.first_name
        out["last_name"] = current_user.last_name
        return out
    raise HTTPException(status_code=400, detail="Neplatná role uživatele")
