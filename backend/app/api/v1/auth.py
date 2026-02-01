import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_password_reset_token,
    create_email_verification_token,
    decode_token,
)
from app.core.config import settings
from app.models.user import User, UserRole, Player, Club
from app.schemas.auth import (
    UserRegister,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    ResendVerificationRequest,
)
from app.schemas.user import UserResponse
from app.api.dependencies import get_current_user
from app.services.notifications import send_password_reset_email, send_verification_email

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)) -> dict:
    """Register a new user and send verification email."""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Tento email je již zaregistrován"
        )

    # Validate role
    try:
        role = UserRole(user_data.role.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Neplatná role. Musí být 'player' nebo 'club'",
        )

    # Create user
    hashed_password = await get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        role=role,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email_verified=False,
    )
    db.add(user)
    await db.flush()

    # Create role-specific profile
    if role == UserRole.PLAYER:
        player = Player(user_id=user.id, elo=1000, primary_districts=[])
        db.add(player)
    elif role == UserRole.CLUB:
        club_name = (user_data.club_name or "").strip()
        if not club_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pro registraci klubu je povinný název klubu.",
            )
        club = Club(user_id=user.id, club_name=club_name)
        db.add(club)

    await db.commit()
    await db.refresh(user)

    # Send verification email (non-blocking - registration succeeds even if email fails)
    email_sent = False
    try:
        token = create_email_verification_token(user.email)
        verification_link = "{}/verify-email?token={}".format(
            settings.FRONTEND_URL.rstrip("/"), token
        )
        await send_verification_email(user.email, verification_link)
        email_sent = True
    except Exception as e:
        # Log the error but don't fail registration
        logging.error("Failed to send verification email to %s: %s", user.email, str(e))

    if email_sent:
        return {
            "detail": "Registrace úspěšná. Na váš e-mail byl odeslán odkaz pro ověření.",
            "email": user.email,
        }
    else:
        return {
            "detail": "Registrace úspěšná. Verifikační e-mail se nepodařilo odeslat - můžete ho nechat znovu odeslat po přihlášení.",
            "email": user.email,
            "email_sent": False,
        }


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
) -> dict:
    """Login and get access token.
    
    Returns access token and email_verified status.
    Login is allowed even if email is not verified, but frontend should show warning.
    """
    # Get user by email
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not await verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nesprávný email nebo heslo",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email_verified": user.email_verified,
    }


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Request password reset. Sends email with reset link if the account exists.
    Always returns 200 to avoid email enumeration.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user:
        try:
            token = create_password_reset_token(user.email)
            reset_link = "{}/reset-password?token={}".format(
                settings.FRONTEND_URL.rstrip("/"), token
            )
            await send_password_reset_email(user.email, reset_link)
        except Exception as e:
            logging.error("Failed to send password reset email to %s: %s", user.email, str(e))
    return {"detail": "Pokud účet s tímto e-mailem existuje, byl odeslán odkaz pro obnovu hesla."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
) -> dict:
    """Set new password using token from forgot-password email."""
    payload = decode_token(body.token)
    if not payload or payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Neplatný nebo vypršený odkaz pro obnovu hesla.",
        )
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Neplatný odkaz pro obnovu hesla.",
        )
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uživatel nebyl nalezen.",
        )
    user.hashed_password = await get_password_hash(body.new_password)
    await db.commit()
    return {"detail": "Heslo bylo úspěšně změněno. Můžete se přihlásit."}


@router.post("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(
    body: VerifyEmailRequest, db: AsyncSession = Depends(get_db)
) -> dict:
    """Verify email address using token from verification email."""
    payload = decode_token(body.token)
    if not payload or payload.get("type") != "email_verification":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Neplatný nebo vypršený odkaz pro ověření e-mailu.",
        )
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Neplatný odkaz pro ověření e-mailu.",
        )
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uživatel nebyl nalezen.",
        )
    if user.email_verified:
        return {"detail": "E-mail již byl ověřen."}
    
    user.email_verified = True
    await db.commit()
    return {"detail": "E-mail byl úspěšně ověřen. Můžete se přihlásit."}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification(
    body: ResendVerificationRequest, db: AsyncSession = Depends(get_db)
) -> dict:
    """Resend verification email.
    
    Always returns 200 to avoid email enumeration.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user and not user.email_verified:
        try:
            token = create_email_verification_token(user.email)
            verification_link = "{}/verify-email?token={}".format(
                settings.FRONTEND_URL.rstrip("/"), token
            )
            await send_verification_email(user.email, verification_link)
        except Exception as e:
            logging.error("Failed to resend verification email to %s: %s", user.email, str(e))
    return {"detail": "Pokud účet s tímto e-mailem existuje a není ověřen, byl odeslán nový odkaz pro ověření."}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user information. Includes club_name for club role."""
    club_name: str | None = None
    if current_user.role == UserRole.CLUB:
        result = await db.execute(select(Club.club_name).where(Club.user_id == current_user.id))
        club_name = result.scalar_one_or_none()
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.value,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        created_at=current_user.created_at,
        email_verified=current_user.email_verified,
        club_name=club_name,
    )
