"""
Notification service for sending emails and creating in-app notifications.
"""

from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import aiosmtplib
from email.message import EmailMessage
from jinja2 import Template

from app.core.config import settings
from app.models.notification import Notification, NotificationType
from app.models.user import User, Player
from app.models.training import Training, TrainingSession
from app.models.registration import Registration, RegistrationStatus


async def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email via SMTP.
    
    Returns True if email was sent successfully, False otherwise.
    
    Note: Port 587 uses STARTTLS (start_tls=True), Port 465 uses direct TLS (use_tls=True).
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # In development, just print to console
        logger.info("SMTP not configured, printing email to console")
        print("=" * 60)
        print("EMAIL (dev mode - not actually sent)")
        print("To: %s", to_email)
        print("Subject: %s", subject)
        print("-" * 60)
        print(body)
        print("=" * 60)
        return True

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        # Port 587 uses STARTTLS - connect plain, then upgrade to TLS
        # Port 465 uses direct TLS connection (use_tls=True)
        if settings.SMTP_PORT == 465:
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=True,
            )
        else:
            # Port 587 or other - use STARTTLS
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                start_tls=True,
            )
        logger.info("Email sent successfully to %s", to_email)
        return True
    except aiosmtplib.SMTPAuthenticationError as e:
        logger.error("SMTP authentication failed: %s", e)
        return False
    except aiosmtplib.SMTPConnectError as e:
        logger.error("Failed to connect to SMTP server: %s", e)
        return False
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
        return False


async def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """Send email with link to reset password."""
    subject = "Obnovení hesla – Ping Sparring"
    body = """
Dobrý den,

obdrželi jste tento e-mail, protože byl požadován reset hesla k vašemu účtu.

Pro nastavení nového hesla klikněte na odkaz níže (platný 1 hodinu):

{reset_link}

Pokud jste o obnovu hesla nepožádali, tento e-mail ignorujte. Vaše heslo zůstane beze změny.

S pozdravem,
tým Ping Sparring
""".format(
        reset_link=reset_link
    ).strip()
    await send_email(to_email, subject, body)


async def send_verification_email(to_email: str, verification_link: str) -> bool:
    """Send email with link to verify email address.
    
    Returns True if email was sent successfully, False otherwise.
    """
    subject = "Ověření e-mailu – Ping Sparring"
    body = """
Dobrý den,

děkujeme za registraci na Ping Sparring!

Pro dokončení registrace a ověření vaší e-mailové adresy klikněte na odkaz níže (platný 24 hodin):

{verification_link}

Pokud jste se neregistrovali na Ping Sparring, tento e-mail ignorujte.

S pozdravem,
tým Ping Sparring
""".format(
        verification_link=verification_link
    ).strip()
    return await send_email(to_email, subject, body)


async def create_notification(
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    action_url: Optional[str] = None,
    db: AsyncSession = None,
) -> Notification:
    """Create an in-app notification."""
    notification = Notification(
        user_id=user_id, type=notification_type, title=title, message=message, action_url=action_url
    )

    if db:
        db.add(notification)
        await db.commit()
        await db.refresh(notification)

    return notification


async def send_registration_confirmed_notification(
    user: User, registration: Registration, training_session: TrainingSession, db: AsyncSession
):
    """Send notification when registration is confirmed."""
    title = "Přihláška potvrzena"
    message = f"Vaše přihláška na trénink {training_session.date.strftime('%d.%m.%Y %H:%M')} byla potvrzena."
    action_url = f"/trainings/{training_session.training_id}"

    # Create in-app notification
    await create_notification(
        user.id, NotificationType.REGISTRATION_CONFIRMED, title, message, action_url, db
    )

    # Send email
    email_body = f"""
Dobrý den,

vaše přihláška na trénink byla potvrzena.

Termín: {training_session.date.strftime("%d.%m.%Y %H:%M")}

Více informací: {settings.FRONTEND_URL}{action_url}
"""
    await send_email(user.email, title, email_body)


async def send_registration_approved_notification(
    user: User, registration: Registration, training_session: TrainingSession, db: AsyncSession
):
    """Send notification when registration is approved."""
    title = "Přihláška schválena"
    message = f"Vaše přihláška na trénink {training_session.date.strftime('%d.%m.%Y %H:%M')} byla schválena trenérem."
    action_url = f"/trainings/{training_session.training_id}"

    await create_notification(
        user.id, NotificationType.REGISTRATION_APPROVED, title, message, action_url, db
    )

    email_body = f"""
Dobrý den,

vaše přihláška na trénink byla schválena trenérem.

Termín: {training_session.date.strftime("%d.%m.%Y %H:%M")}

Více informací: {settings.FRONTEND_URL}{action_url}
"""
    await send_email(user.email, title, email_body)


async def send_player_registered_to_club_notification(
    club_user_id: int,
    player_name: str,
    training_title: str,
    training_id: int,
    session_date: datetime,
    status: str,
    db: AsyncSession,
):
    """Notify club when a player signs up for a training (in-app + email)."""
    status_text = {
        "approved": "přihlásil se",
        "pending": "čeká na schválení",
        "waitlist": "se přihlásil na čekací listinu",
    }.get(status, "se přihlásil")
    date_str = session_date.strftime("%d.%m.%Y %H:%M")
    title = "Nová přihláška na trénink"
    message = "%s %s na trénink %s (%s)." % (player_name, status_text, training_title, date_str)
    action_url = "/trainings/%s" % training_id

    # Create in-app notification
    await create_notification(
        club_user_id,
        NotificationType.PLAYER_REGISTERED,
        title,
        message,
        action_url,
        db,
    )

    # Send email to club
    result = await db.execute(select(User).where(User.id == club_user_id))
    club_user = result.scalar_one_or_none()
    if club_user:
        email_body = """
Dobrý den,

máte novou přihlášku na trénink.

Hráč: %s
Trénink: %s
Termín: %s
Status: %s

Více informací: %s%s
""" % (
            player_name,
            training_title,
            date_str,
            status_text,
            settings.FRONTEND_URL,
            action_url,
        )
        await send_email(club_user.email, title, email_body.strip())


async def send_player_unregistered_to_club_notification(
    club_user_id: int,
    player_name: str,
    training_title: str,
    training_id: int,
    session_date: datetime,
    db: AsyncSession,
):
    """Notify club when a player cancels their registration (in-app + email)."""
    date_str = session_date.strftime("%d.%m.%Y %H:%M")
    title = "Zrušená přihláška"
    message = "%s zrušil přihlášku na trénink %s (%s)." % (player_name, training_title, date_str)
    action_url = "/trainings/%s" % training_id

    # Create in-app notification
    await create_notification(
        club_user_id,
        NotificationType.PLAYER_UNREGISTERED,
        title,
        message,
        action_url,
        db,
    )

    # Send email to club
    result = await db.execute(select(User).where(User.id == club_user_id))
    club_user = result.scalar_one_or_none()
    if club_user:
        email_body = """
Dobrý den,

hráč zrušil svou přihlášku na trénink.

Hráč: %s
Trénink: %s
Termín: %s

Více informací: %s%s
""" % (
            player_name,
            training_title,
            date_str,
            settings.FRONTEND_URL,
            action_url,
        )
        await send_email(club_user.email, title, email_body.strip())


async def send_registration_rejected_notification(
    user: User, registration: Registration, training_session: TrainingSession, db: AsyncSession
):
    """Send notification when registration is rejected."""
    title = "Přihláška zamítnuta"
    message = f"Vaše přihláška na trénink {training_session.date.strftime('%d.%m.%Y %H:%M')} byla zamítnuta."
    action_url = f"/trainings/{training_session.training_id}"

    await create_notification(
        user.id, NotificationType.REGISTRATION_REJECTED, title, message, action_url, db
    )

    email_body = f"""
Dobrý den,

bohužel vaše přihláška na trénink byla zamítnuta.

Termín: {training_session.date.strftime("%d.%m.%Y %H:%M")}

Více informací: {settings.FRONTEND_URL}{action_url}
"""
    await send_email(user.email, title, email_body)


async def send_training_reminder_notification(
    user: User, training_session: TrainingSession, db: AsyncSession
):
    """Send reminder 24 hours before training."""
    title = "Připomínka tréninku"
    message = f"Připomínáme vám trénink zítra v {training_session.date.strftime('%H:%M')}."
    action_url = f"/trainings/{training_session.training_id}"

    await create_notification(
        user.id, NotificationType.TRAINING_REMINDER, title, message, action_url, db
    )

    email_body = f"""
Dobrý den,

připomínáme vám trénink zítra.

Termín: {training_session.date.strftime("%d.%m.%Y %H:%M")}

Více informací: {settings.FRONTEND_URL}{action_url}
"""
    await send_email(user.email, title, email_body)


async def send_waitlist_spot_available_notification(
    user: User, training_session: TrainingSession, db: AsyncSession
):
    """Send notification when a spot opens from waitlist."""
    title = "Místo uvolněno"
    message = f"Uvolnilo se místo na trénink {training_session.date.strftime('%d.%m.%Y %H:%M')}. Máte 24 hodin na potvrzení."
    action_url = f"/trainings/{training_session.training_id}"

    await create_notification(
        user.id, NotificationType.WAITLIST_SPOT_AVAILABLE, title, message, action_url, db
    )

    email_body = f"""
Dobrý den,

uvolnilo se místo na trénink, na který jste byli na čekací listině.

Termín: {training_session.date.strftime("%d.%m.%Y %H:%M")}

Máte 24 hodin na potvrzení účasti.

Více informací: {settings.FRONTEND_URL}{action_url}
"""
    await send_email(user.email, title, email_body)


async def send_training_cancelled_notification(
    user: User, training_session: TrainingSession, db: AsyncSession
):
    """Send notification when training is cancelled."""
    title = "Trénink zrušen"
    message = f"Trénink {training_session.date.strftime('%d.%m.%Y %H:%M')} byl zrušen."
    action_url = "/trainings"

    await create_notification(
        user.id, NotificationType.TRAINING_CANCELLED, title, message, action_url, db
    )

    email_body = f"""
Dobrý den,

bohužel trénink byl zrušen.

Termín: {training_session.date.strftime("%d.%m.%Y %H:%M")}

Více informací: {settings.FRONTEND_URL}{action_url}
"""
    await send_email(user.email, title, email_body)


async def send_training_reminders(db: AsyncSession):
    """Send reminders for trainings happening in 24 hours."""
    # Get trainings happening in 24 hours
    tomorrow = datetime.utcnow() + timedelta(hours=24)
    start_time = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
    end_time = tomorrow.replace(hour=23, minute=59, second=59, microsecond=999999)

    result = await db.execute(
        select(TrainingSession).where(
            and_(
                TrainingSession.date >= start_time,
                TrainingSession.date <= end_time,
                TrainingSession.status == "scheduled",
            )
        )
    )
    sessions = result.scalars().all()

    for session in sessions:
        # Get all approved registrations
        result = await db.execute(
            select(Registration).where(
                and_(
                    Registration.training_session_id == session.id,
                    Registration.status == "approved",
                )
            )
        )
        registrations = result.scalars().all()

        for registration in registrations:
            # Get player and user
            result = await db.execute(
                select(User).join(Player).where(Player.id == registration.player_id)
            )
            user = result.scalar_one_or_none()

            if user:
                await send_training_reminder_notification(user, session, db)


async def get_users_registered_to_training(training_id: int, db: AsyncSession) -> list[User]:
    """Return distinct users (players) who have any non-cancelled registration to any session of this training."""
    result = await db.execute(
        select(User)
        .join(Player, User.id == Player.user_id)
        .join(Registration, Registration.player_id == Player.id)
        .join(TrainingSession, Registration.training_session_id == TrainingSession.id)
        .where(
            TrainingSession.training_id == training_id,
            Registration.status != RegistrationStatus.CANCELLED,
        )
        .distinct()
    )
    return list(result.scalars().all())


async def send_training_updated_notification(
    user: User, training: Training, db: AsyncSession
) -> None:
    """Notify player that a training they are registered to was updated by the club."""
    day_names = ["pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota", "neděle"]
    day_name = day_names[training.day_of_week] if 0 <= training.day_of_week < 7 else ""
    time_str = "%s %s" % (day_name, training.start_time.strftime("%H:%M"))
    club_name = training.club.club_name if training.club else "Klub"
    
    title = "Trénink byl upraven"
    message = "%s upravil trénink (%s), na který jste přihlášeni. Zkontrolujte změny." % (
        club_name,
        time_str,
    )
    action_url = "/trainings/%s" % training.id
    await create_notification(
        user.id, NotificationType.TRAINING_UPDATED, title, message, action_url, db
    )
    email_body = """
Dobrý den,

%s upravil trénink, na který jste přihlášeni (%s).

Zkontrolujte změny: %s%s
""" % (
        club_name,
        time_str,
        settings.FRONTEND_URL,
        action_url,
    )
    await send_email(user.email, title, email_body)


async def send_training_removed_notification(
    user: User, training: Training, db: AsyncSession
) -> None:
    """Notify player that a training they were registered to was removed (deactivated) by the club."""
    day_names = ["pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota", "neděle"]
    day_name = day_names[training.day_of_week] if 0 <= training.day_of_week < 7 else ""
    time_str = "%s %s" % (day_name, training.start_time.strftime("%H:%M"))
    club_name = training.club.club_name if training.club else "Klub"
    
    title = "Nabídka tréninku byla zrušena"
    message = "%s zrušil nabídku tréninku (%s), na který jste byli přihlášeni." % (
        club_name,
        time_str,
    )
    action_url = "/trainings"
    await create_notification(
        user.id, NotificationType.TRAINING_REMOVED, title, message, action_url, db
    )
    email_body = """
Dobrý den,

%s zrušil nabídku tréninku, na který jste byli přihlášeni (%s).

Další tréninky naleznete zde: %s%s
""" % (
        club_name,
        time_str,
        settings.FRONTEND_URL,
        action_url,
    )
    await send_email(user.email, title, email_body)
