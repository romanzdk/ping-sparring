"""
Resend email provider implementation.

Uses the Resend API to send transactional emails.
https://resend.com/docs
"""

import logging
import resend

from app.services.email.base import EmailProvider

logger = logging.getLogger(__name__)


class ResendEmailProvider(EmailProvider):
    """Email provider using Resend API."""

    def __init__(self, api_key: str, default_from_email: str):
        """Initialize Resend provider.

        Args:
            api_key: Resend API key
            default_from_email: Default sender email address
        """
        self.api_key = api_key
        self.default_from_email = default_from_email
        resend.api_key = api_key

    async def send(
        self,
        to_email: str,
        subject: str,
        body: str,
        html: str | None = None,
        from_email: str | None = None,
    ) -> bool:
        """Send an email via Resend API.

        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text body
            html: Optional HTML body
            from_email: Optional sender email (uses default if not provided)

        Returns:
            True if email was sent successfully, False otherwise.
        """
        sender = from_email or self.default_from_email

        try:
            email_params = {
                "from": sender,
                "to": to_email,
                "subject": subject,
                "text": body,
            }

            if html:
                email_params["html"] = html

            result = resend.Emails.send(email_params)

            if result and result.get("id"):
                logger.info(
                    "Email sent successfully via Resend to %s, id: %s",
                    to_email,
                    result.get("id"),
                )
                return True
            else:
                logger.error("Resend returned unexpected response: %s", result)
                return False

        except resend.exceptions.ResendError as e:
            logger.error("Resend API error sending email to %s: %s", to_email, e)
            return False
        except Exception as e:
            logger.error("Failed to send email via Resend to %s: %s", to_email, e)
            return False

    def get_provider_name(self) -> str:
        return "resend"
