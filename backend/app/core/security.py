from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Union
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.core.config import settings

# Mandatory Secure Web Skills: Password Management
# Use established libraries for password hashing (bcrypt) with unique salts, never store plaintext.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Mandatory Secure Web Skills: Password Security Validation
# Minimum 12 characters recommended, no maximum length, allow all characters.
# TODO(security): Consider hardening password validation using leaked password detection.
def validate_password_strength(password: str) -> bool:
    if len(password) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 12 characters long for high security."
        )
    return True

# Mandatory Secure Web Skills: JWT Verification Rules
# - Reject 'none' algorithm
# - Hardcode expected algorithm for verification, never derive from unverified token
# - Set 'exp' claim and validate it
def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Dict[str, Any]:
    try:
        # Explicitly hardcode expected algorithm (settings.JWT_ALGORITHM -> HS256)
        # This automatically rejects 'none' algorithm and validates the 'exp' claim
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
