import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.contact import ContactRequest, ContactResponse
from app.services.notifications import send_contact_form_email

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=ContactResponse)
async def send_contact(data: ContactRequest):
    """Přijme data z kontaktního formuláře a odešle e-mail."""
    try:
        await send_contact_form_email(
            sender_name=data.name,
            sender_email=data.email,
            subject=data.subject,
            message=data.message,
        )
        return ContactResponse()
    except Exception as e:
        logger.exception("Contact form send failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Zprávu se nepodařilo odeslat. Zkuste to později nebo nás kontaktujte přímo e-mailem.",
        ) from e
