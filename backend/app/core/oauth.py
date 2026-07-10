import logging

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.core.config import settings

logger = logging.getLogger(__name__)

_VALID_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}


def verify_google_id_token(token: str) -> dict:
    """Verify a Google-issued OAuth ID token server-side.

    Never trust a client-supplied email/identity claim directly - the Next.js
    BFF and this API are separate processes with no shared trust boundary, and
    this endpoint is reachable directly (not just via NextAuth), so signature
    verification against Google's own keys is what actually prevents a forged
    request from minting a JWT for an arbitrary account.
    """
    try:
        idinfo = google_id_token.verify_oauth2_token(
            token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        logger.warning("Google ID token verification failed.")
        raise ValueError("Invalid Google ID token") from e

    if idinfo.get("iss") not in _VALID_ISSUERS:
        raise ValueError("Invalid Google ID token issuer")
    if not idinfo.get("email_verified"):
        raise ValueError("Google account email is not verified")

    return idinfo
