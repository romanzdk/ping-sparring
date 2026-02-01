"""
SMTP email provider implementation.

Uses aiosmtplib to send emails via SMTP server.
Kept as a fallback option for environments where API-based providers aren't available.
"""

import logging
from email.message import EmailMessage

import aiosmtplib

from app.services.email.base import EmailProvider

logger = logging.getLogger(__name__)


class SMTPEmailProvider(EmailProvider):
    """Email provider using SMTP protocol."""

    def __init__(
        self,
        host: str,
        port: int,
        username: str,
        password: str,
        from_email: str,
    ):
        """Initialize SMTP provider.

        Args:
            host: SMTP server hostname
            port: SMTP server port (587 for STARTTLS, 465 for direct TLS)
            username: SMTP authentication username
            password: SMTP authentication password
            from_email: Default sender email address
        """
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.default_from_email = from_email

    async def send(
        self,
        to_email: str,
        subject: str,
        body: str,
        html: str | None = None,
        from_email: str | None = None,
    ) -> bool:
        """Send an email via SMTP.

        Note: Port 587 uses STARTTLS (start_tls=True), Port 465 uses direct TLS (use_tls=True).

        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text body
            html: Optional HTML body (currently ignored, only plain text supported)
            from_email: Optional sender email (uses default if not provided)

        Returns:
            True if email was sent successfully, False otherwise.
        """
        sender = from_email or self.default_from_email

        message = EmailMessage()
        message["From"] = sender
        message["To"] = to_email
        message["Subject"] = subject

        if html:
            message.set_content(body)
            message.add_alternative(html, subtype="html")
        else:
            message.set_content(body)

        try:
            # Port 587 uses STARTTLS - connect plain, then upgrade to TLS
            # Port 465 uses direct TLS connection (use_tls=True)
            if self.port == 465:
                await aiosmtplib.send(
                    message,
                    hostname=self.host,
                    port=self.port,
                    username=self.username,
                    password=self.password,
                    use_tls=True,
                    timeout=10,
                )
            else:
                # Port 587 or other - use STARTTLS
                await aiosmtplib.send(
                    message,
                    hostname=self.host,
                    port=self.port,
                    username=self.username,
                    password=self.password,
                    start_tls=True,
                    timeout=10,
                )
            logger.info("Email sent successfully via SMTP to %s", to_email)
            return True
        except aiosmtplib.SMTPAuthenticationError as e:
            logger.error("SMTP authentication failed: %s", e)
            return False
        except aiosmtplib.SMTPConnectError as e:
            logger.error("Failed to connect to SMTP server: %s", e)
            return False
        except Exception as e:
            logger.error("Failed to send email via SMTP to %s: %s", to_email, e)
            return False

    def get_provider_name(self) -> str:
        return "smtp"
