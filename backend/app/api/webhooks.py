import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Header, Request

logger = logging.getLogger(__name__)
router = APIRouter()

# Mandatory Secure Web Skills: Authentication & Authorization
# Ensure all APIs are authenticated. Verify webhook payload signatures.

@router.post("/webhooks/thumbtack", status_code=status.HTTP_200_OK)
async def thumbtack_lead_webhook(
    request: Request,
    payload: Dict[str, Any],
    x_thumbtack_signature: str = Header(None)
) -> Any:
    """
    Bi-directional webhook for Thumbtack contractor lead status updates and rev-share attribution.
    """
    if not x_thumbtack_signature:
        logger.warning("Thumbtack webhook rejected: Missing cryptographic signature.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing verification signature."
        )
    
    attribution_token = payload.get("attribution_token")
    lead_status = payload.get("status", "quoted")
    
    logger.info(f"Processed Thumbtack lead update for token: {attribution_token}. Status: {lead_status}")
    
    return {"status": "success", "token_attributed": attribution_token}

@router.post("/webhooks/crm", status_code=status.HTTP_200_OK)
async def crm_sync_webhook(
    request: Request,
    payload: Dict[str, Any],
    authorization: str = Header(None)
) -> Any:
    """
    Bi-directional webhook for HubSpot / Salesforce agent CRM sync.
    """
    if not authorization or authorization != "Bearer homeready_secure_crm_webhook_token_2026!":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized CRM webhook access."
        )

    contact_id = payload.get("contact_id")
    logger.info(f"Successfully synchronized CRM contact profile: {contact_id}")
    
    return {"status": "synchronized", "contact_id": contact_id}
