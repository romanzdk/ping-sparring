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
from app.models.user import User, Club, Player
from app.models.training import TrainingSession
from app.models.registration import Registration
from app.models.training_request import TrainingRequest


def _contact_recipient() -> str:
    return (settings.CONTACT_EMAIL or settings.SMTP_FROM_EMAIL).strip()


async def send_contact_form_email(sender_name: str | None, sender_email: str, subject: str | None, message: str):
    """Odešle e-mail z kontaktního formuláře na CONTACT_EMAIL (nebo SMTP_FROM_EMAIL)."""
    to_email = _contact_recipient()
    email_subject = subject.strip() if subject and subject.strip() else "Zpráva z kontaktního formuláře"
    body_lines = [
        "Zpráva z kontaktního formuláře (Můj trénink).",
        "",
        "Od: " + (sender_name.strip() if sender_name and sender_name.strip() else "(neuvedeno)"),
        "E-mail: " + sender_email,
        "",
        "--- Zpráva ---",
        message.strip(),
    ]
    body = "\n".join(body_lines)
    await send_email(to_email, email_subject, body)


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


async def send_training_request_response_notification(
    player_user: User,
    club: Club,
    training_request: TrainingRequest,
    db: AsyncSession,
    custom_subject: str | None = None,
    custom_message: str | None = None,
):
    """Send email to player when club responds to their training request. Optional custom_subject and custom_message (editable by club)."""
    title = (
        custom_subject.strip() if custom_subject else None
    ) or "Reakce na vaši poptávku tréninku"

    # Get club name
    club_name = club.club_name or "Klub"

    # Get preferred days names
    days_map = {
        0: "Pondělí",
        1: "Úterý",
        2: "Středa",
        3: "Čtvrtek",
        4: "Pátek",
        5: "Sobota",
        6: "Neděle",
    }
    preferred_days_str = ", ".join(
        [days_map.get(d, f"Den {d}") for d in training_request.preferred_days]
    )

    message = f"Klub {club_name} reagoval na vaši poptávku tréninku."
    action_url = f"/training-requests/{training_request.id}"

    # Create in-app notification
    await create_notification(
        player_user.id,
        NotificationType.REGISTRATION_CONFIRMED,  # Reuse existing type
        title,
        message,
        action_url,
        db,
    )

    # Email body: use custom message if provided, otherwise default
    if custom_message and custom_message.strip():
        email_body = f"""Dobrý den {player_user.first_name or ""},

{custom_message.strip()}

Více informací: {settings.FRONTEND_URL}{action_url}

S pozdravem,
Tým Můj trénink
"""
    else:
        email_body = f"""
Dobrý den {player_user.first_name or ""},

klub {club_name} reagoval na vaši poptávku tréninku:

"{training_request.title}"

Detaily vaší poptávky:
- Preferované dny: {preferred_days_str}
- ELO rozsah: {training_request.elo_min} - {training_request.elo_max}
{f"- Popis: {training_request.description}" if training_request.description else ""}

Klub má zájem o spolupráci. Můžete se podívat na jejich nabídku tréninků nebo je kontaktovat přímo.

Více informací: {settings.FRONTEND_URL}{action_url}

S pozdravem,
Tým Můj trénink
"""
    await send_email(player_user.email, title, email_body)
