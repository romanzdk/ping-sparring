"""
Abstract base class for email providers.

This module defines the interface that all email providers must implement,
allowing easy swapping between different email services (Resend, Mailgun, SMTP, etc.).
"""

from abc import ABC, abstractmethod
import logging

logger = logging.getLogger(__name__)


class EmailProvider(ABC):
    """Abstract base class for email providers."""

    @abstractmethod
    async def send(
        self,
        to_email: str,
        subject: str,
        body: str,
        html: str | None = None,
        from_email: str | None = None,
    ) -> bool:
        """Send an email.

        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text body
            html: Optional HTML body (if not provided, plain text will be used)
            from_email: Optional sender email (uses default if not provided)

        Returns:
            True if email was sent successfully, False otherwise.
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return the name of this email provider."""
        pass


class ConsoleEmailProvider(EmailProvider):
    """Development email provider that prints to console instead of sending."""

    async def send(
        self,
        to_email: str,
        subject: str,
        body: str,
        html: str | None = None,
        from_email: str | None = None,
    ) -> bool:
        """Print email to console for development."""
        logger.info("Console email provider - email not actually sent")
        print("=" * 60)
        print("EMAIL (dev mode - not actually sent)")
        print("From:", from_email or "default")
        print("To:", to_email)
        print("Subject:", subject)
        print("-" * 60)
        print(body)
        if html:
            print("-" * 60)
            print("HTML:", html[:200], "..." if len(html) > 200 else "")
        print("=" * 60)
        return True

    def get_provider_name(self) -> str:
        return "console"
