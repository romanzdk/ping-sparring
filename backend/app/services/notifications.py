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


async def send_email(to_email: str, subject: str, body: str):
    """Send an email via SMTP."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # In development, just print to console
        print(f"Email to {to_email}: {subject}\n{body}")
        return

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=True,
        )
    except Exception as e:
        print(f"Failed to send email: {e}")


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
    """Notify club when a player signs up for a training (in-app only)."""
    status_text = {
        "approved": "přihlásil se",
        "pending": "čeká na schválení",
        "waitlist": "se přihlásil na čekací listinu",
    }.get(status, "se přihlásil")
    date_str = session_date.strftime("%d.%m.%Y %H:%M")
    title = "Nová přihláška na trénink"
    message = f"{player_name} {status_text} na trénink {training_title} ({date_str})."
    action_url = f"/trainings/{training_id}"
    await create_notification(
        club_user_id,
        NotificationType.PLAYER_REGISTERED,
        title,
        message,
        action_url,
        db,
    )


async def send_player_unregistered_to_club_notification(
    club_user_id: int,
    player_name: str,
    training_title: str,
    training_id: int,
    session_date: datetime,
    db: AsyncSession,
):
    """Notify club when a player cancels their registration (in-app only)."""
    date_str = session_date.strftime("%d.%m.%Y %H:%M")
    title = "Zrušená přihláška"
    message = f"{player_name} zrušil přihlášku na trénink {training_title} ({date_str})."
    action_url = f"/trainings/{training_id}"
    await create_notification(
        club_user_id,
        NotificationType.PLAYER_UNREGISTERED,
        title,
        message,
        action_url,
        db,
    )


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
    club_name = training.club.user.club_name if training.club and training.club.user else "Klub"
    
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
    club_name = training.club.user.club_name if training.club and training.club.user else "Klub"
    
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
