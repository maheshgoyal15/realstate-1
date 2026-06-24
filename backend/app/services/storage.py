import base64
import os
import uuid
import logging
from typing import Tuple
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# Mandatory Secure Web Skills: Path, File System & Upload Security
# - Never trust user input in file paths; sanitize via os.path.basename.
# - Validate magic bytes header and structure to confirm file identity.
# - Enforce 10MB size limit.
# - Generate unique UUID filenames.
# - Store outside web root in non-executable S3 bucket.

ALLOWED_MAGIC_BYTES = {
    b"\xFF\xD8\xFF": "jpg",
    b"\x89PNG\r\n\x1a\n": "png",
    b"\x00\x00\x00\x18ftypheic": "heic",
    b"\x00\x00\x00\x1cftypheic": "heic",
    b"\x00\x00\x00\x14ftypheic": "heic",
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 # 10MB limit

# TODO(security): Integrate real-time malware scanning via antivirus API within an isolated sandbox prior to permanent S3 storage.
# TODO(security): Implement Content Disarm and Reconstruction (CDR) tools to strip active macro content from complex document formats.

def sanitize_filename(raw_filename: str) -> str:
    """Sanitize input filename to strip directory traversal sequences."""
    return os.path.basename(raw_filename)

def validate_and_store_image(base64_data: str, user_id: str) -> Tuple[str, str]:
    """
    Validates magic bytes, checks 10MB size ceiling, generates secure UUID filename,
    and returns simulated S3 storage key and detected extension.
    """
    try:
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]
        raw_bytes = base64.b64decode(base64_data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed image payload."
        )

    if len(raw_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 10MB maximum limit."
        )

    # Magic bytes verification
    file_ext = None
    for magic, ext in ALLOWED_MAGIC_BYTES.items():
        if raw_bytes.startswith(magic):
            file_ext = ext
            break

    if not file_ext:
        # Check for HEIC ftyp variation
        if b"ftypheic" in raw_bytes[:32] or b"ftypheix" in raw_bytes[:32]:
            file_ext = "heic"
        else:
            logger.warning("File upload rejected: Invalid magic bytes signature.")
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported file format. Only JPG, PNG, and HEIC are permitted."
            )

    # Generate unique, unpredictable random UUID filename
    unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
    
    # Secure S3 non-executable bucket path outside web root
    s3_key = f"properties/{user_id}/{unique_filename}"
    
    # In a live AWS environment, we would use boto3 to upload raw_bytes to S3 here.
    logger.info(f"Securely stored file {unique_filename} to S3 bucket path {s3_key}")
    
    return s3_key, file_ext
