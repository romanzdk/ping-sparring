from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.user import User
from app.api.dependencies import get_current_user, get_optional_user
from app.models.user import User, UserRole, Club
from app.models.training import Training, TrainingSession, TrainingStatus, ScheduleType
from app.models.region import District
from app.models.registration import Registration, RegistrationStatus
from app.schemas.training import (
    TrainingCreate,
    TrainingResponse,
    TrainingPublicResponse,
    TrainingSessionResponse,
    TrainingSessionCreate,
)

router = APIRouter()


@router.get("/")
async def get_trainings(
    district_id: Optional[int] = Query(None),
    region_id: Optional[int] = Query(None),
    elo_min: Optional[int] = Query(None),
    elo_max: Optional[int] = Query(None),
    day_of_week: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Get list of trainings. Public: limited data (district only, no address/location). Authenticated: full data."""
    query = select(Training).where(Training.is_active == is_active)
    if district_id:
        query = query.where(Training.district_id == district_id)
    if region_id:
        query = query.where(Training.region_id == region_id)
    if elo_min:
        query = query.where(Training.elo_max >= elo_min)
    if elo_max:
        query = query.where(Training.elo_min <= elo_max)
    if day_of_week is not None:
        query = query.where(Training.day_of_week == day_of_week)
    query = (
        query.offset(skip).limit(limit).options(selectinload(Training.club).selectinload(Club.user))
    )
    result = await db.execute(query)
    trainings = result.scalars().all()

    one_time_ids = [t.id for t in trainings if t.schedule_type == ScheduleType.ONE_TIME]
    session_dates: dict[int, datetime] = {}
    if one_time_ids:
        subq = (
            select(TrainingSession.training_id, func.min(TrainingSession.date).label("first_date"))
            .where(TrainingSession.training_id.in_(one_time_ids))
            .group_by(TrainingSession.training_id)
        )
        res = await db.execute(subq)
        session_dates = {row.training_id: row.first_date for row in res.all()}

    if current_user is None:
        district_ids = list({t.district_id for t in trainings})
        districts_map: dict[int, str] = {}
        if district_ids:
            res = await db.execute(select(District).where(District.id.in_(district_ids)))
            for d in res.scalars().all():
                districts_map[d.id] = d.name
        return [
            TrainingPublicResponse(
                id=t.id,
                title=t.title,
                description=t.description,
                schedule_type=t.schedule_type.value
                if hasattr(t.schedule_type, "value")
                else str(t.schedule_type),
                day_of_week=t.day_of_week,
                start_time=t.start_time,
                end_time=t.end_time,
                district_id=t.district_id,
                district_name=districts_map.get(t.district_id, ""),
                region_id=t.region_id,
                elo_min=t.elo_min,
                elo_max=t.elo_max,
                elo_tolerance=t.elo_tolerance,
                capacity=t.capacity,
                fee=t.fee,
                is_active=t.is_active,
                created_at=t.created_at,
                contact_email=None,
                contact_phone=None,
                club_name=t.club.club_name if t.club else None,
                session_date=session_dates.get(t.id),
            )
            for t in trainings
        ]
    out: list[TrainingResponse] = []
    for t in trainings:
        r = TrainingResponse.model_validate(t)
        out.append(
            r.model_copy(
                update={
                    "contact_email": t.club.user.email
                    if t.club and getattr(t.club, "user", None)
                    else None,
                    "contact_phone": t.club.phone if t.club else None,
                    "club_name": t.club.club_name if t.club else None,
                    "session_date": session_dates.get(t.id),
                }
            )
        )
    return out


@router.get("/{training_id}", response_model=TrainingResponse)
async def get_training(
    training_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific training by ID. Requires authentication (full details including place)."""
    result = await db.execute(
        select(Training)
        .where(Training.id == training_id)
        .options(selectinload(Training.club).selectinload(Club.user))
    )
    training = result.scalar_one_or_none()
    if not training or not training.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )
    session_date: datetime | None = None
    if training.schedule_type == ScheduleType.ONE_TIME:
        sess_result = await db.execute(
            select(TrainingSession.date)
            .where(TrainingSession.training_id == training_id)
            .order_by(TrainingSession.date)
            .limit(1)
        )
        session_date = sess_result.scalar_one_or_none()
    r = TrainingResponse.model_validate(training)
    return r.model_copy(
        update={
            "contact_email": training.club.user.email
            if training.club and getattr(training.club, "user", None)
            else None,
            "contact_phone": training.club.phone if training.club else None,
            "club_name": training.club.club_name if training.club else None,
            "session_date": session_date,
        }
    )


@router.post("/", response_model=TrainingResponse, status_code=status.HTTP_201_CREATED)
async def create_training(
    training_data: TrainingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new training (club only)."""
    if current_user.role != UserRole.CLUB:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only clubs can create trainings"
        )

    # Get club
    result = await db.execute(select(Club).where(Club.user_id == current_user.id))
    club = result.scalar_one_or_none()

    if not club:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club profile not found")

    # Get district to get region_id
    result = await db.execute(select(District).where(District.id == training_data.district_id))
    district = result.scalar_one_or_none()

    if not district:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="District not found")

    schedule_type = (
        ScheduleType(training_data.schedule_type)
        if training_data.schedule_type
        else ScheduleType.RECURRING
    )
    training = Training(
        club_id=club.id,
        title=training_data.title or "",
        description=training_data.description,
        schedule_type=schedule_type,
        day_of_week=training_data.day_of_week,
        start_time=training_data.start_time,
        end_time=training_data.end_time,
        location=training_data.location,
        address=training_data.address,
        district_id=training_data.district_id,
        region_id=district.region_id,
        elo_min=training_data.elo_min,
        elo_max=training_data.elo_max,
        elo_tolerance=training_data.elo_tolerance,
        capacity=training_data.capacity,
        fee=training_data.fee,
        rules=training_data.rules,
        approval_mode=training_data.approval_mode,
        is_active=True,
    )

    db.add(training)
    await db.commit()
    await db.refresh(training)

    return training


@router.put("/{training_id}", response_model=TrainingResponse)
async def update_training(
    training_id: int,
    training_data: TrainingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a training (club only)."""
    if current_user.role != UserRole.CLUB:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only clubs can update trainings"
        )

    # Get club
    result = await db.execute(select(Club).where(Club.user_id == current_user.id))
    club = result.scalar_one_or_none()

    if not club:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club profile not found")

    # Get training
    result = await db.execute(select(Training).where(Training.id == training_id))
    training = result.scalar_one_or_none()

    if not training:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training not found")

    # Check ownership
    if training.club_id != club.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own trainings"
        )

    # Get district if changed
    if training_data.district_id != training.district_id:
        result = await db.execute(select(District).where(District.id == training_data.district_id))
        district = result.scalar_one_or_none()

        if not district:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="District not found")
        training.region_id = district.region_id

    # Update fields
    training.title = training_data.title or ""
    training.description = training_data.description
    training.schedule_type = (
        ScheduleType(training_data.schedule_type)
        if training_data.schedule_type
        else ScheduleType.RECURRING
    )
    training.day_of_week = training_data.day_of_week
    training.start_time = training_data.start_time
    training.end_time = training_data.end_time
    training.location = training_data.location
    training.address = training_data.address
    training.district_id = training_data.district_id
    training.elo_min = training_data.elo_min
    training.elo_max = training_data.elo_max
    training.elo_tolerance = training_data.elo_tolerance
    training.capacity = training_data.capacity
    training.fee = training_data.fee
    training.rules = training_data.rules
    training.approval_mode = training_data.approval_mode

    await db.commit()
    await db.refresh(training)

    return training


@router.delete("/{training_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_training(
    training_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a training (club only)."""
    if current_user.role != UserRole.CLUB:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only clubs can delete trainings"
        )

    # Get club
    result = await db.execute(select(Club).where(Club.user_id == current_user.id))
    club = result.scalar_one_or_none()

    if not club:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club profile not found")

    # Get training
    result = await db.execute(select(Training).where(Training.id == training_id))
    training = result.scalar_one_or_none()

    if not training:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training not found")

    # Check ownership
    if training.club_id != club.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own trainings"
        )

    # Soft delete by setting is_active to False
    training.is_active = False
    await db.commit()

    return None


@router.get("/{training_id}/sessions", response_model=List[TrainingSessionResponse])
async def get_training_sessions(
    training_id: int,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Get sessions for a specific training with registered_count (approved + pending)."""
    query = select(TrainingSession).where(TrainingSession.training_id == training_id)
    if start_date:
        query = query.where(TrainingSession.date >= start_date)
    if end_date:
        query = query.where(TrainingSession.date <= end_date)
    query = query.order_by(TrainingSession.date)
    result = await db.execute(query)
    sessions = result.scalars().all()
    if not sessions:
        return []
    session_ids = [s.id for s in sessions]
    count_result = await db.execute(
        select(Registration.training_session_id, func.count(Registration.id).label("cnt"))
        .where(
            and_(
                Registration.training_session_id.in_(session_ids),
                Registration.status.in_([RegistrationStatus.APPROVED, RegistrationStatus.PENDING]),
            )
        )
        .group_by(Registration.training_session_id)
    )
    counts = {row.training_session_id: row.cnt for row in count_result.all()}
    return [
        TrainingSessionResponse(
            id=s.id,
            training_id=s.training_id,
            date=s.date,
            status=s.status.value,
            actual_participants_count=s.actual_participants_count,
            registered_count=counts.get(s.id, 0),
            created_at=s.created_at,
        )
        for s in sessions
    ]


@router.post(
    "/{training_id}/sessions",
    response_model=TrainingSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_training_session(
    training_id: int,
    session_data: TrainingSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a training session (club only)."""
    if current_user.role != UserRole.CLUB:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only clubs can create training sessions"
        )

    # Get training
    result = await db.execute(select(Training).where(Training.id == training_id))
    training = result.scalar_one_or_none()

    if not training:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training not found")

    # Get club
    result = await db.execute(select(Club).where(Club.user_id == current_user.id))
    club = result.scalar_one_or_none()

    # Check ownership
    if training.club_id != club.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create sessions for your own trainings",
        )

    # Convert to naive UTC for DB (TIMESTAMP WITHOUT TIME ZONE)
    session_date = session_data.date
    if session_date.tzinfo is not None:
        session_date = session_date.astimezone(timezone.utc).replace(tzinfo=None)

    session = TrainingSession(
        training_id=training_id, date=session_date, status=TrainingStatus.SCHEDULED
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)

    return session
