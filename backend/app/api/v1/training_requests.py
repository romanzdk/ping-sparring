from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.core.database import get_db


from app.api.dependencies import get_current_user, get_optional_user
from app.models.user import User, UserRole, Player, Club
from app.models.training_request import TrainingRequest, TrainingRequestStatus
from app.schemas.training_request import (
    TrainingRequestCreate,
    TrainingRequestResponse,
    TrainingRequestUpdate,
    TrainingRequestPublicResponse,
)

router = APIRouter()

MAX_ACTIVE_REQUESTS_PER_PLAYER = 2


@router.post("/", response_model=TrainingRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_training_request(
    request_data: TrainingRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a training request (player only)."""
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Poptávky na tréninky mohou vytvářet pouze hráči",
        )

    # Get player
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()

    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profil hráče nebyl nalezen"
        )

    # Limit: max 2 active (OPEN) requests per player
    count_result = await db.execute(
        select(func.count(TrainingRequest.id)).where(
            and_(
                TrainingRequest.player_id == player.id,
                TrainingRequest.status == TrainingRequestStatus.OPEN,
            )
        )
    )
    if count_result.scalar_one() >= MAX_ACTIVE_REQUESTS_PER_PLAYER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Máte již maximální počet aktivních poptávek (2). Pro přidání nové některou smažte.",
        )

    # Create request
    training_request = TrainingRequest(
        player_id=player.id,
        sport=request_data.sport or "stolni_tenis",
        title=request_data.title,
        description=request_data.description,
        preferred_days=request_data.preferred_days,
        preferred_times=request_data.preferred_times,
        district_ids=request_data.district_ids,
        elo_min=request_data.elo_min,
        elo_max=request_data.elo_max,
        phone=request_data.phone,
        status=TrainingRequestStatus.OPEN,
    )

    db.add(training_request)
    await db.commit()
    await db.refresh(training_request)

    return training_request


@router.get("/")
async def get_training_requests(
    status_filter: str | None = Query(None),
    district_id: int | None = Query(None),
    sport: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Get training requests. Public: open requests only, limited data (no description). Authenticated: full data."""
    if current_user is None:
        query = select(TrainingRequest).where(TrainingRequest.status == TrainingRequestStatus.OPEN)
        if district_id is not None:
            query = query.where(TrainingRequest.district_ids.contains([district_id]))
        if sport is not None:
            query = query.where(TrainingRequest.sport == sport)
        query = query.offset(skip).limit(limit).order_by(TrainingRequest.created_at.desc())
        result = await db.execute(query)
        requests = result.scalars().all()
        return [
            TrainingRequestPublicResponse(
                id=r.id,
                sport=r.sport,
                title=r.title,
                preferred_days=r.preferred_days or [],
                district_ids=[int(x) for x in (r.district_ids or [])],
                elo_min=r.elo_min,
                elo_max=r.elo_max,
                status=r.status.value,
                created_at=r.created_at,
            )
            for r in requests
        ]

    if current_user.role == UserRole.PLAYER:
        result = await db.execute(select(Player).where(Player.user_id == current_user.id))
        player = result.scalar_one_or_none()
        if not player:
            return []
        query = select(TrainingRequest).where(TrainingRequest.player_id == player.id)
        if status_filter:
            query = query.where(TrainingRequest.status == status_filter)
        if sport is not None:
            query = query.where(TrainingRequest.sport == sport)
        query = query.offset(skip).limit(limit).order_by(TrainingRequest.created_at.desc())
        result = await db.execute(query)
        return result.scalars().all()

    if current_user.role == UserRole.CLUB:
        query = select(TrainingRequest).where(TrainingRequest.status == TrainingRequestStatus.OPEN)
        if district_id is not None:
            query = query.where(TrainingRequest.district_ids.contains([district_id]))
        if sport is not None:
            query = query.where(TrainingRequest.sport == sport)
        query = query.offset(skip).limit(limit).order_by(TrainingRequest.created_at.desc())
        result = await db.execute(query)
        requests = result.scalars().all()
        if not requests:
            return []
        player_ids = [r.player_id for r in requests]
        res = await db.execute(
            select(Player.id, User.email, User.first_name, User.last_name)
            .join(User, User.id == Player.user_id)
            .where(Player.id.in_(player_ids))
        )
        rows = res.all()
        email_by_player: dict[int, str] = {row.id: row.email for row in rows}

        def _player_name(row: object) -> str | None:
            parts = [getattr(row, "first_name", None), getattr(row, "last_name", None)]
            name = " ".join(filter(None, parts)).strip()
            return name or None

        name_by_player: dict[int, str | None] = {row.id: _player_name(row) for row in rows}
        return [
            TrainingRequestResponse(
                id=r.id,
                player_id=r.player_id,
                title=r.title,
                description=r.description,
                preferred_days=r.preferred_days or [],
                preferred_times=r.preferred_times,
                district_ids=r.district_ids or [],
                elo_min=r.elo_min,
                elo_max=r.elo_max,
                phone=r.phone,
                status=r.status.value if hasattr(r.status, "value") else str(r.status),
                created_at=r.created_at,
                updated_at=r.updated_at,
                player_email=email_by_player.get(r.player_id),
                player_name=name_by_player.get(r.player_id),
            )
            for r in requests
        ]

    return []


@router.get("/{request_id}", response_model=TrainingRequestResponse)
async def get_training_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific training request."""
    result = await db.execute(select(TrainingRequest).where(TrainingRequest.id == request_id))
    req = result.scalar_one_or_none()

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Poptávka na trénink nebyla nalezena"
        )

    # Check permissions
    if current_user.role == UserRole.PLAYER:
        result = await db.execute(select(Player).where(Player.user_id == current_user.id))
        player = result.scalar_one_or_none()

        if player and req.player_id != player.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Můžete zobrazit pouze své vlastní poptávky"
            )

    # Load player's user for contact email and name
    result = await db.execute(
        select(User).join(Player, Player.user_id == User.id).where(Player.id == req.player_id)
    )
    player_user = result.scalar_one_or_none()
    player_email = player_user.email if player_user else None
    player_name = None
    if player_user:
        parts = [player_user.first_name, player_user.last_name]
        player_name = " ".join(filter(None, parts)).strip() or None

    return TrainingRequestResponse(
        id=req.id,
        player_id=req.player_id,
        sport=req.sport,
        title=req.title,
        description=req.description,
        preferred_days=req.preferred_days or [],
        preferred_times=req.preferred_times,
        district_ids=req.district_ids or [],
        elo_min=req.elo_min,
        elo_max=req.elo_max,
        phone=req.phone,
        status=req.status.value if hasattr(req.status, "value") else str(req.status),
        created_at=req.created_at,
        updated_at=req.updated_at,
        player_email=player_email,
        player_name=player_name,
    )


@router.put("/{request_id}", response_model=TrainingRequestResponse)
async def update_training_request(
    request_id: int,
    request_data: TrainingRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a training request (player only, own requests)."""
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Poptávky na tréninky mohou upravovat pouze hráči",
        )

    result = await db.execute(select(TrainingRequest).where(TrainingRequest.id == request_id))
    request = result.scalar_one_or_none()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Poptávka na trénink nebyla nalezena"
        )

    # Get player
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()

    # Check ownership
    if player and request.player_id != player.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Můžete upravovat pouze své vlastní poptávky"
        )

    # Update fields
    update_data = request_data.model_dump(exclude_unset=True)
    new_status = update_data.get("status")
    if new_status is not None and player:
        status_enum = TrainingRequestStatus(new_status) if isinstance(new_status, str) else new_status
        if status_enum == TrainingRequestStatus.OPEN and request.status != TrainingRequestStatus.OPEN:
            # Re-opening: check limit (other OPEN requests only)
            count_result = await db.execute(
                select(func.count(TrainingRequest.id)).where(
                    and_(
                        TrainingRequest.player_id == player.id,
                        TrainingRequest.status == TrainingRequestStatus.OPEN,
                        TrainingRequest.id != request_id,
                    )
                )
            )
            if count_result.scalar_one() >= MAX_ACTIVE_REQUESTS_PER_PLAYER:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Máte již maximální počet aktivních poptávek (2). Pro znovuotevření některou jinou smažte.",
                )
    for key, value in update_data.items():
        setattr(request, key, value)

    await db.commit()
    await db.refresh(request)

    return request


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_training_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a training request (player only, own requests)."""
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Poptávky na tréninky mohou mazat pouze hráči",
        )

    result = await db.execute(select(TrainingRequest).where(TrainingRequest.id == request_id))
    request = result.scalar_one_or_none()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Poptávka na trénink nebyla nalezena"
        )

    # Get player
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()

    # Check ownership
    if player and request.player_id != player.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Můžete mazat pouze své vlastní poptávky"
        )

    await db.delete(request)
    await db.commit()

    return None
