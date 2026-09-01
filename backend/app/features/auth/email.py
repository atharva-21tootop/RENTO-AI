import smtplib
import os
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import parseaddr

from fastapi import HTTPException

from app.core.logging import logger

_BUILD = """
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #18181b; margin-bottom: 8px;">{title}</h2>
      <p style="color: #71717a; font-size: 14px; margin-bottom: 24px;">{subtitle}</p>
      <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">{otp}</span>
      </div>
      <p style="color: #a1a1aa; font-size: 12px;">This code is valid for 10 minutes. If you did not request this email, please ignore it.</p>
    </div>
"""


def build_otp_email_html(otp: str, purpose: str) -> str:
    if purpose == "reset_password":
        title, subtitle = "Reset Your Password", "Use the code below to reset your password."
    else:
        title, subtitle = "Verify Your Email", "Use the verification code below to verify your email address."
    return _BUILD.format(title=title, subtitle=subtitle, otp=otp)


def send_email(to: str, subject: str, html: str, otp_for_dev_only: str = "") -> bool:
    """Send an email via the configured SMTP provider.

    - When EMAIL_SERVER_* is configured, a failure to send RAISES a visible
      error (HTTP 502) so callers never silently "succeed" without delivering.
    - When SMTP is genuinely unconfigured (or SMTP_DISABLED=1) in non-production,
      the OTP is logged to the terminal as an explicit dev aid — it is clearly
      not an email send.
    """
    host = os.getenv("EMAIL_SERVER_HOST")
    port = int(os.getenv("EMAIL_SERVER_PORT") or "587")
    user = os.getenv("EMAIL_SERVER_USER")
    pwd = os.getenv("EMAIL_SERVER_PASSWORD")
    from_addr = os.getenv("EMAIL_FROM") or "noreply@hackathonstarter.com"
    envelope_from = parseaddr(from_addr)[1] or from_addr
    configured = bool(host and user and pwd) and os.getenv("SMTP_DISABLED") != "1"

    if not configured:
        if os.getenv("NODE_ENV") != "production":
            _log_dev(to, subject, otp_for_dev_only)
        else:
            logger.warning("SMTP settings are not configured. Email was not sent.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_addr
        msg["To"] = to
        plain = html.replace("<[^>]*>", "")
        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html, "html"))

        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15, context=ssl.create_default_context())
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            server.starttls(context=ssl.create_default_context())
        server.login(user, pwd)
        server.sendmail(envelope_from, [to], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        logger.error(f"Failed to send email via SMTP ({host}:{port}) to {to}: {e}")
        raise HTTPException(
            status_code=502,
            detail=(
                "Failed to send the OTP email. Check the backend SMTP settings "
                "(EMAIL_SERVER_* / SMTP credentials) — the email was NOT sent."
            ),
        ) from e


def _log_dev(to: str, subject: str, otp: str) -> None:
    logger.info("=" * 49)
    logger.info(f"[DEV EMAIL FALLBACK - SMTP UNCONFIGURED] To: {to}")
    logger.info(f"[DEV EMAIL FALLBACK - SMTP UNCONFIGURED] Subject: {subject}")
    if otp:
        logger.info(f"[DEV EMAIL FALLBACK - SMTP UNCONFIGURED] OTP CODE: {otp}")
    logger.info("=" * 49)