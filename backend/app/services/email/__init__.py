"""
Email service module.

Provides a unified interface for sending emails through various providers.
Supports easy swapping between Resend, Mailgun, SMTP, and other providers.

Usage:
    from app.services.email import get_email_provider, send_email

    # Send using the configured provider
    await send_email("user@example.com", "Subject", "Body text")

    # Or get the provider instance for more control
    provider = get_email_provider()
    await provider.send("user@example.com", "Subject", "Body", html="<p>HTML</p>")
"""

import logging
from typing import Literal

from app.core.config import settings
from app.services.email.base import EmailProvider, ConsoleEmailProvider
from app.services.email.resend_provider import ResendEmailProvider
from app.services.email.smtp_provider import SMTPEmailProvider

logger = logging.getLogger(__name__)

# Type alias for supported providers
EmailProviderType = Literal["resend", "smtp", "console"]

# Cached provider instance
_provider_instance: EmailProvider | None = None


def get_email_provider() -> EmailProvider:
    """Get the configured email provider instance.

    Returns a cached instance if available, otherwise creates a new one
    based on the EMAIL_PROVIDER setting.

    Returns:
        EmailProvider: The configured email provider instance.
    """
    global _provider_instance

    if _provider_instance is not None:
        return _provider_instance

    provider_type = getattr(settings, "EMAIL_PROVIDER", "resend")

    if provider_type == "resend":
        api_key = getattr(settings, "RESEND_API_KEY", None)
        if not api_key:
            logger.warning("RESEND_API_KEY not set, falling back to console provider")
            _provider_instance = ConsoleEmailProvider()
        else:
            from_email = getattr(settings, "EMAIL_FROM", settings.SMTP_FROM_EMAIL)
            _provider_instance = ResendEmailProvider(
                api_key=api_key,
                default_from_email=from_email,
            )
            logger.info("Using Resend email provider")

    elif provider_type == "smtp":
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning("SMTP credentials not set, falling back to console provider")
            _provider_instance = ConsoleEmailProvider()
        else:
            _provider_instance = SMTPEmailProvider(
                host=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                from_email=settings.SMTP_FROM_EMAIL,
            )
            logger.info("Using SMTP email provider")

    else:
        # Default to console for development/testing
        _provider_instance = ConsoleEmailProvider()
        logger.info("Using console email provider (development mode)")

    return _provider_instance


def reset_provider() -> None:
    """Reset the cached provider instance.

    Useful for testing or when configuration changes at runtime.
    """
    global _provider_instance
    _provider_instance = None


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    html: str | None = None,
    from_email: str | None = None,
) -> bool:
    """Send an email using the configured provider.

    This is the main function to use for sending emails throughout the application.

    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Plain text body
        html: Optional HTML body
        from_email: Optional sender email (uses default if not provided)

    Returns:
        True if email was sent successfully, False otherwise.
    """
    provider = get_email_provider()
    return await provider.send(
        to_email=to_email,
        subject=subject,
        body=body,
        html=html,
        from_email=from_email,
    )


# Re-export classes for type hinting and direct use
__all__ = [
    "EmailProvider",
    "ConsoleEmailProvider",
    "ResendEmailProvider",
    "SMTPEmailProvider",
    "get_email_provider",
    "reset_provider",
    "send_email",
    "EmailProviderType",
]
