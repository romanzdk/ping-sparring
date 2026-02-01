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
from app.models.region import District
from app.schemas.registration import (
    RegistrationCreate,
    RegistrationResponse,
    RegistrationDetailResponse,
    RegistrationWithPlayerResponse,
    RegistrationWithPlayerDetailResponse,
)
from app.services.notifications import (
    send_player_registered_to_club_notification,
    send_player_unregistered_to_club_notification,
    send_registration_approved_notification,
    send_registration_rejected_notification,
)
from app.services.reputation import update_reputation_score

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
            status_code=status.HTTP_403_FORBIDDEN, detail="Na tréninky se mohou přihlašovat pouze hráči"
        )

    # Get player
    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()

    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profil hráče nebyl nalezen"
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
            status_code=status.HTTP_404_NOT_FOUND, detail="Termín tréninku nebyl nalezen"
        )

    if session.status != TrainingStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Termín tréninku není naplánován"
        )

    # Check if already registered (excluding cancelled and rejected – those can re-apply)
    result = await db.execute(
        select(Registration).where(
            and_(
                Registration.player_id == player.id,
                Registration.training_session_id == session.id,
                Registration.status.notin_(
                    [RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED]
                ),
            )
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Na tento termín jste již přihlášeni"
        )

    # Check if player previously cancelled and wants to rejoin
    result = await db.execute(
        select(Registration).where(
            and_(
                Registration.player_id == player.id,
                Registration.training_session_id == session.id,
                Registration.status == RegistrationStatus.CANCELLED,
            )
        )
    )
    previous_cancelled_registration = result.scalar_one_or_none()

    # Check if player previously rejected and wants to re-apply
    result = await db.execute(
        select(Registration).where(
            and_(
                Registration.player_id == player.id,
                Registration.training_session_id == session.id,
                Registration.status == RegistrationStatus.REJECTED,
            )
        )
    )
    previous_rejected_registration = result.scalar_one_or_none()

    # If player cancelled before, check if they can rejoin
    if previous_cancelled_registration:
        if previous_cancelled_registration.rejoin_count >= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Po zrušení se můžete na termín znovu přihlásit pouze jednou",
            )

    training = session.training

    # Check ELO compatibility
    if (
        player.elo < training.elo_min - training.elo_tolerance
        or player.elo > training.elo_max + training.elo_tolerance
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vaše ELO je mimo povolený rozsah pro tento trénink",
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

    # Reuse cancelled/rejected registration or create new one
    if previous_cancelled_registration:
        # Rejoin: reuse the existing registration
        registration = previous_cancelled_registration
        registration.status = reg_status
        registration.approved_at = (
            datetime.utcnow() if reg_status == RegistrationStatus.APPROVED else None
        )
        registration.cancelled_at = None
        registration.rejected_at = None
        registration.rejoin_count += 1
        registration.created_at = datetime.utcnow()  # Update created_at to reflect rejoin time
    elif previous_rejected_registration:
        # Re-apply after reject: reuse the existing registration
        registration = previous_rejected_registration
        registration.status = reg_status
        registration.approved_at = (
            datetime.utcnow() if reg_status == RegistrationStatus.APPROVED else None
        )
        registration.rejected_at = None
        registration.created_at = datetime.utcnow()
    else:
        # Create new registration
        registration = Registration(
            player_id=player.id,
            training_session_id=session.id,
            status=reg_status,
            approved_at=datetime.utcnow() if reg_status == RegistrationStatus.APPROVED else None,
            rejoin_count=0,
        )
        db.add(registration)

    # If waitlist, create waitlist entry
    if reg_status == RegistrationStatus.WAITLIST:
        # Get max position
        result = await db.execute(
            select(func.max(WaitlistEntry.position)).where(
                WaitlistEntry.training_session_id == session.id
            )
        )
        max_position = result.scalar_one() or 0

        waitlist_entry = WaitlistEntry(
            player_id=player.id, training_session_id=session.id, position=max_position + 1
        )
        db.add(waitlist_entry)

    await db.commit()
    await db.refresh(registration)

    # Notify club about the new registration
    result = await db.execute(select(Club).where(Club.id == training.club_id))
    club = result.scalar_one_or_none()
    if club:
        player_name = (
            " ".join(filter(None, [current_user.first_name, current_user.last_name])).strip()
            or current_user.email
            or "Hráč"
        )
        await send_player_registered_to_club_notification(
            club_user_id=club.user_id,
            player_name=player_name,
            training_title=training.title,
            training_id=training.id,
            session_date=session.date,
            status=reg_status.value,
            db=db,
        )

    return registration


@router.get("/me", response_model=List[RegistrationResponse])
async def get_my_registrations(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Get current user's registrations."""
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Registrace mají pouze hráči"
        )

    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()

    result = await db.execute(select(Registration).where(Registration.player_id == player.id))
    registrations = result.scalars().all()

    return registrations


@router.get("/me/detail", response_model=List[RegistrationDetailResponse])
async def get_my_registrations_detail(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Get current user's registrations with training and session info (for dashboard)."""
    if current_user.role != UserRole.PLAYER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Registrace mají pouze hráči"
        )

    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()
    if not player:
        return []

    result = await db.execute(
        select(Registration)
        .options(selectinload(Registration.training_session))
        .where(Registration.player_id == player.id)
    )
    registrations = result.scalars().all()
    out = []
    for reg in registrations:
        session = reg.training_session
        if not session:
            continue
        tr_res = await db.execute(select(Training).where(Training.id == session.training_id))
        training = tr_res.scalar_one_or_none()
        if not training:
            continue
        out.append(
            RegistrationDetailResponse(
                id=reg.id,
                player_id=reg.player_id,
                training_session_id=reg.training_session_id,
                status=reg.status.value,
                created_at=reg.created_at,
                approved_at=reg.approved_at,
                cancelled_at=reg.cancelled_at,
                session_date=session.date,
                training_id=training.id,
                training_title=training.title,
                training_location=training.location,
            )
        )
    return out


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
            detail="Registrace nebyla nalezena",
        )
    session = registration.training_session
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Termín nebyl nalezen",
        )
    result = await db.execute(select(Training).where(Training.id == session.training_id))
    training = result.scalar_one_or_none()
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trénink nebyl nalezen",
        )

    if current_user.role == UserRole.PLAYER:
        result = await db.execute(select(Player).where(Player.user_id == current_user.id))
        player = result.scalar_one_or_none()
        if not player or registration.player_id != player.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Můžete zobrazit pouze své vlastní registrace",
            )
    else:
        result = await db.execute(select(Club).where(Club.user_id == current_user.id))
        club = result.scalar_one_or_none()
        if not club or training.club_id != club.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Můžete zobrazit registrace pouze pro své vlastní tréninky",
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
        training_location=training.location,
    )


@router.post("/{registration_id}/cancel", response_model=RegistrationResponse)
async def cancel_registration(
    registration_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a registration (player unregisters from training). Club gets notified; reputation is updated by cancellation tier (48h, 24h, 12h)."""
    result = await db.execute(
        select(Registration)
        .options(selectinload(Registration.training_session))
        .where(Registration.id == registration_id)
    )
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registrace nebyla nalezena")

    result = await db.execute(select(Player).where(Player.user_id == current_user.id))
    player = result.scalar_one_or_none()
    if not player or registration.player_id != player.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Můžete zrušit pouze své vlastní registrace",
        )

    if registration.status == RegistrationStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Registrace již byla zrušena"
        )

    was_approved = registration.status == RegistrationStatus.APPROVED
    registration.status = RegistrationStatus.CANCELLED
    registration.cancelled_at = datetime.utcnow()

    if was_approved:
        await _promote_from_waitlist(registration.training_session_id, db)

    await db.flush()

    session = registration.training_session
    if session:
        tr_res = await db.execute(select(Training).where(Training.id == session.training_id))
        training = tr_res.scalar_one_or_none()
        if training:
            club_res = await db.execute(select(Club).where(Club.id == training.club_id))
            club = club_res.scalar_one_or_none()
            if club:
                player_name = (
                    " ".join(
                        filter(None, [current_user.first_name, current_user.last_name])
                    ).strip()
                    or current_user.email
                    or "Hráč"
                )
                await send_player_unregistered_to_club_notification(
                    club_user_id=club.user_id,
                    player_name=player_name,
                    training_title=training.title,
                    training_id=training.id,
                    session_date=session.date,
                    db=db,
                )

    await update_reputation_score(player.id, db)
    await db.refresh(registration)
    return registration


@router.get(
    "/trainings/{training_session_id}/registrations",
    response_model=List[RegistrationWithPlayerDetailResponse],
)
async def get_training_registrations(
    training_session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get registrations for a training session (club only), with full player details."""
    if current_user.role != UserRole.CLUB:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registrace mohou zobrazovat pouze kluby",
        )
    result = await db.execute(
        select(TrainingSession).where(TrainingSession.id == training_session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Termín tréninku nebyl nalezen",
        )
    result = await db.execute(select(Training).where(Training.id == session.training_id))
    training = result.scalar_one_or_none()
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trénink nebyl nalezen",
        )
    result = await db.execute(select(Club).where(Club.user_id == current_user.id))
    club = result.scalar_one_or_none()
    if club and training.club_id != club.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Můžete zobrazit registrace pouze pro své vlastní tréninky",
        )
    result = await db.execute(
        select(Registration)
        .options(
            selectinload(Registration.player).options(
                selectinload(Player.user),
                selectinload(Player.reputation_score),
            ),
        )
        .where(Registration.training_session_id == training_session_id)
    )
    registrations = result.scalars().all()
    district_ids: set[int] = set()
    for reg in registrations:
        if reg.player and getattr(reg.player, "primary_districts", None):
            district_ids.update(reg.player.primary_districts)
    districts_map: dict[int, str] = {}
    if district_ids:
        res = await db.execute(select(District).where(District.id.in_(district_ids)))
        for d in res.scalars().all():
            districts_map[d.id] = d.name
    out = []
    for reg in registrations:
        u = reg.player.user if reg.player else None
        name = ""
        first_name: str | None = None
        last_name: str | None = None
        email: str | None = None
        if u:
            first_name = getattr(u, "first_name", None)
            last_name = getattr(u, "last_name", None)
            name = " ".join(filter(None, [first_name, last_name])).strip()
            if not name:
                name = u.email or ""
            email = u.email
        player = reg.player
        elo = int(getattr(player, "elo", 0) or 0)
        official_elo = getattr(player, "official_elo", None)
        primary_district_names = []
        if player and getattr(player, "primary_districts", None):
            primary_district_names = [
                districts_map[did] for did in player.primary_districts if did in districts_map
            ]
        rep = player.reputation_score if player and hasattr(player, "reputation_score") else None
        reliability_score: float | None = None
        if (
            rep is not None
            and hasattr(rep, "reliability_score")
            and rep.reliability_score is not None
        ):
            reliability_score = float(rep.reliability_score)
        out.append(
            RegistrationWithPlayerDetailResponse(
                id=reg.id,
                player_id=reg.player_id,
                training_session_id=reg.training_session_id,
                status=reg.status.value,
                created_at=reg.created_at,
                approved_at=reg.approved_at,
                cancelled_at=reg.cancelled_at,
                player_name=name,
                player_email=email,
                player_first_name=first_name,
                player_last_name=last_name,
                elo=elo,
                official_elo=official_elo,
                primary_district_names=primary_district_names,
                reliability_score=reliability_score,
                home_address=getattr(player, "home_address", None) if player else None,
                max_travel_distance=getattr(player, "max_travel_distance", None)
                if player
                else None,
                max_trainings_per_week=getattr(player, "max_trainings_per_week", None)
                if player
                else None,
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
            status_code=status.HTTP_403_FORBIDDEN, detail="Registrace mohou schvalovat pouze kluby"
        )

    # Get registration
    result = await db.execute(select(Registration).where(Registration.id == registration_id))
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registrace nebyla nalezena")

    if registration.status != RegistrationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Registrace nečeká na schválení"
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
            detail="Můžete schvalovat registrace pouze pro své vlastní tréninky",
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Trénink je plný")

    # Approve registration
    registration.status = RegistrationStatus.APPROVED
    registration.approved_at = datetime.utcnow()

    # Notify player
    result = await db.execute(
        select(User).join(Player, Player.user_id == User.id).where(Player.id == registration.player_id)
    )
    player_user = result.scalar_one_or_none()
    if player_user:
        await send_registration_approved_notification(player_user, registration, session, db)

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
            status_code=status.HTTP_403_FORBIDDEN, detail="Registrace mohou odmítat pouze kluby"
        )

    # Get registration
    result = await db.execute(select(Registration).where(Registration.id == registration_id))
    registration = result.scalar_one_or_none()

    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registrace nebyla nalezena")

    if registration.status != RegistrationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Registrace nečeká na schválení"
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
            detail="Můžete odmítat registrace pouze pro své vlastní tréninky",
        )

    # Reject registration
    registration.status = RegistrationStatus.REJECTED
    registration.rejected_at = datetime.utcnow()

    # Notify player
    result = await db.execute(
        select(User).join(Player, Player.user_id == User.id).where(Player.id == registration.player_id)
    )
    player_user = result.scalar_one_or_none()
    if player_user:
        await send_registration_rejected_notification(player_user, registration, session, db)

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
        .order_by(WaitlistEntry.position)
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
