from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, UserRole, Player, Club
from app.models.training import Training, TrainingSession, TrainingStatus, ApprovalMode
from app.models.registration import Registration, RegistrationStatus, WaitlistEntry
from app.schemas.registration import (
    RegistrationCreate,
    RegistrationResponse,
    RegistrationDetailResponse,
    RegistrationWithPlayerResponse,
)

router = APIRouter()


@router.post("/", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def create_registration(
    registration_data: RegistrationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register for a training session."""
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only players can register for trainings"
        )

    # Get player
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()

    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Player profile not found"
        )

    # Get session and training
    result = await db.execute(
        select(TrainingSession)
        .options(selectinload(TrainingSession.training))
        .where(TrainingSession.id == registration_data.training_session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Training session not found"
        )

    if session.status != TrainingStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Training session is not scheduled"
        )

    # Check if already registered
    result = await db.execute(
        select(Registration).where(
            and_(
                Registration.player_id == player.id,
                Registration.training_session_id == session.id,
                Registration.status != RegistrationStatus.CANCELLED,
            )
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Already registered for this session"
        )

    training = session.training

    # Check ELO compatibility
    if (
        player.elo < training.elo_min - training.elo_tolerance
        or player.elo > training.elo_max + training.elo_tolerance
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your ELO is outside the allowed range for this training",
        )

    # Check capacity
    result = await db.execute(
        select(func.count(Registration.id)).where(
            and_(
                Registration.training_session_id == session.id,
                Registration.status == RegistrationStatus.APPROVED,
            )
        )
    )
    current_count = result.scalar_one()

    # Determine status
    if current_count < training.capacity:
        if training.approval_mode == ApprovalMode.AUTO:
            reg_status = RegistrationStatus.APPROVED
        else:
            reg_status = RegistrationStatus.PENDING
    else:
        reg_status = RegistrationStatus.WAITLIST

    # Create registration
    registration = Registration(
        player_id=player.id,
        training_session_id=session.id,
        status=reg_status,
        approved_at=datetime.utcnow() if reg_status == RegistrationStatus.APPROVED else None,
    )

    db.add(registration)

    # If waitlist, create waitlist entry
    if reg_status == RegistrationStatus.WAITLIST:
        # Get max priority
        result = await db.execute(
            select(func.max(WaitlistEntry.priority)).where(
                WaitlistEntry.training_session_id == session.id
            )
        )
        max_priority = result.scalar_one() or 0

        waitlist_entry = WaitlistEntry(
            player_id=player.id, training_session_id=session.id, priority=max_priority + 1
        )
        db.add(waitlist_entry)

    await db.commit()
    await db.refresh(registration)

    return registration


@router.get("/me", response_model=List[RegistrationResponse])
async def get_my_registrations(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Get current user's registrations."""
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only players have registrations"
        )

    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()

    result = await db.execute(select(Registration).where(Registration.player_id == player.id))
    registrations = result.scalars().all()

    return registrations


@router.get("/{registration_id}", response_model=RegistrationDetailResponse)
async def get_registration(
    registration_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single registration (player: own, club: if owns the training)."""
    result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.training_session),
        )
        .where(Registration.id == registration_id)
    )
    registration = result.scalar_one_or_none()
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found",
        )
    session = registration.training_session
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    result = await db.execute(select(Training).where(Training.id == session.training_id))
    training = result.scalar_one_or_none()
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    if current_user.role == UserRole.PLAYER:
        result = await db.execute(select(Player).where(Player.user_id == current_user.id))
        player = result.scalar_one_or_none()
        if not player or registration.player_id != player.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own registrations",
            )
    else:
        result = await db.execute(select(Club).where(Club.user_id == current_user.id))
        club = result.scalar_one_or_none()
        if not club or training.club_id != club.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view registrations for your own trainings",
            )

    return RegistrationDetailResponse(
        id=registration.id,
        player_id=registration.player_id,
        training_session_id=registration.training_session_id,
        status=registration.status.value,
        created_at=registration.created_at,
        approved_at=registration.approved_at,
        cancelled_at=registration.cancelled_at,
        session_date=session.date,
        training_id=training.id,
        training_title=training.title,
    )


@router.post("/{registration_id}/cancel", response_model=RegistrationResponse)
async def cancel_registration(
    registration_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a registration."""
    result = await db.execute(select(Registration).where(Registration.id == registration_id))
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

    # Check ownership
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()
    if not player or registration.player_id != player.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own registrations",
        )

    if registration.status == RegistrationStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Registration already cancelled"
        )

    # Store original status before cancelling
    was_approved = registration.status == RegistrationStatus.APPROVED

    # Cancel registration
    registration.status = RegistrationStatus.CANCELLED
    registration.cancelled_at = datetime.utcnow()

    # If approved, check waitlist and promote next player
    if was_approved:  # Check original status
        await _promote_from_waitlist(registration.training_session_id, db)

    await db.commit()
    return registration


@router.get(
    "/trainings/{training_session_id}/registrations",
    response_model=List[RegistrationWithPlayerResponse],
)
async def get_training_registrations(
    training_session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get registrations for a training session (club only), with player names."""
    if current_user.role != UserRole.CLUB:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clubs can view registrations",
        )
    result = await db.execute(
        select(TrainingSession).where(TrainingSession.id == training_session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found",
        )
    result = await db.execute(select(Training).where(Training.id == session.training_id))
    training = result.scalar_one_or_none()
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )
    result = await db.execute(select(Club).where(Club.user_id == current_user.id))
    club = result.scalar_one_or_none()
    if club and training.club_id != club.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view registrations for your own trainings",
        )
    result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.player).selectinload(Player.user),
        )
        .where(Registration.training_session_id == training_session_id)
    )
    registrations = result.scalars().all()
    out = []
    for reg in registrations:
        u = reg.player.user if reg.player else None
        name = ""
        if u:
            name = " ".join(
                filter(None, [getattr(u, "first_name", None), getattr(u, "last_name", None)])
            ).strip()
            if not name:
                name = u.email or ""
        out.append(
            RegistrationWithPlayerResponse(
                id=reg.id,
                player_id=reg.player_id,
                training_session_id=reg.training_session_id,
                status=reg.status.value,
                created_at=reg.created_at,
                approved_at=reg.approved_at,
                cancelled_at=reg.cancelled_at,
                player_name=name,
            )
        )
    return out


@router.post("/{registration_id}/approve", response_model=RegistrationResponse)
async def approve_registration(
    registration_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve a registration (club only)."""
    if current_user.role != UserRole.CLUB:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only clubs can approve registrations"
        )

    # Get registration
    result = await db.execute(select(Registration).where(Registration.id == registration_id))
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

    if registration.status != RegistrationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Registration is not pending"
        )

    # Get training session and training
    result = await db.execute(
        select(TrainingSession).where(TrainingSession.id == registration.training_session_id)
    )
    session = result.scalar_one_or_none()

    result = await db.execute(select(Training).where(Training.id == session.training_id))
    training = result.scalar_one_or_none()

    # Check ownership
    result = await db.execute(select(Club).where(Club.user_id == current_user.id))
    club = result.scalar_one_or_none()
    if club and training.club_id != club.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only approve registrations for your own trainings",
        )

    # Check capacity
    result = await db.execute(
        select(func.count(Registration.id)).where(
            and_(
                Registration.training_session_id == registration.training_session_id,
                Registration.status == RegistrationStatus.APPROVED,
            )
        )
    )
    current_count = result.scalar_one()

    if current_count >= training.capacity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Training is full")

    # Approve registration
    registration.status = RegistrationStatus.APPROVED
    registration.approved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(registration)

    return registration


@router.post("/{registration_id}/reject", response_model=RegistrationResponse)
async def reject_registration(
    registration_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reject a registration (club only)."""
    if current_user.role != UserRole.CLUB:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only clubs can reject registrations"
        )

    # Get registration
    result = await db.execute(select(Registration).where(Registration.id == registration_id))
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

    if registration.status != RegistrationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Registration is not pending"
        )

    # Get training session and training
    result = await db.execute(
        select(TrainingSession).where(TrainingSession.id == registration.training_session_id)
    )
    session = result.scalar_one_or_none()

    result = await db.execute(select(Training).where(Training.id == session.training_id))
    training = result.scalar_one_or_none()

    # Check ownership
    result = await db.execute(select(Club).where(Club.user_id == current_user.id))
    club = result.scalar_one_or_none()
    if club and training.club_id != club.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only reject registrations for your own trainings",
        )

    # Reject registration
    registration.status = RegistrationStatus.REJECTED
    registration.rejected_at = datetime.utcnow()

    await db.commit()
    await db.refresh(registration)

    return registration


async def _promote_from_waitlist(training_session_id: int, db: AsyncSession):
    """Promote the next player from waitlist if capacity allows."""
    # Get training
    result = await db.execute(
        select(TrainingSession)
        .options(selectinload(TrainingSession.training))
        .where(TrainingSession.id == training_session_id)
    )
    session = result.scalar_one_or_none()
    training = session.training

    # Check capacity
    result = await db.execute(
        select(func.count(Registration.id)).where(
            and_(
                Registration.training_session_id == training_session_id,
                Registration.status == RegistrationStatus.APPROVED,
            )
        )
    )
    current_count = result.scalar_one()

    if current_count >= training.capacity:
        return

    # Get next waitlist entry
    result = await db.execute(
        select(WaitlistEntry)
        .where(WaitlistEntry.training_session_id == training_session_id)
        .order_by(WaitlistEntry.priority)
        .limit(1)
    )
    waitlist_entry = result.scalar_one_or_none()

    if not waitlist_entry:
        return

    # Get registration
    result = await db.execute(
        select(Registration).where(
            and_(
                Registration.player_id == waitlist_entry.player_id,
                Registration.training_session_id == training_session_id,
            )
        )
    )
    registration = result.scalar_one_or_none()

    if registration:
        # Determine if auto-approval or pending
        if training.approval_mode == ApprovalMode.AUTO:
            registration.status = RegistrationStatus.APPROVED
            registration.approved_at = datetime.utcnow()
        else:
            registration.status = RegistrationStatus.PENDING

        # Delete waitlist entry
        await db.delete(waitlist_entry)
        await db.flush()

        # Recurse if still capacity and auto-approved
        if training.approval_mode == ApprovalMode.AUTO:
            await _promote_from_waitlist(training_session_id, db)
