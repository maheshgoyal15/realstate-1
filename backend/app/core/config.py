import logging
import os
import secrets
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

# Mandatory Secure Web Skills: Multi-tiered Secret Resolution
# (Resolution: Environment -> Local File Query -> Random Gen + Log)
def get_jwt_secret() -> str:
    if os.getenv('JWT_SECRET_KEY'):
        return os.getenv('JWT_SECRET_KEY') # type: ignore
    if os.path.exists('jwt_secret.txt'):
        with open('jwt_secret.txt', 'r') as f:
            return f.read().strip()
    logger.warning("Generating ephemeral secret. Instance-isolated!")
    return secrets.token_hex(32)

class Settings(BaseSettings):
    PROJECT_NAME: str = "HomeReady AI API Gateway"
    API_V1_STR: str = "/api/v1"
    
    # Mandatory Secure Web Skills: Servers MUST listen on localhost or 127.0.0.1 when testing.
    # Servers MUST NOT listen on 0.0.0.0.
    SERVER_HOST: str = "127.0.0.1"
    SERVER_PORT: int = 8000

    # JWT Configuration
    JWT_SECRET_KEY: str = get_jwt_secret()
    JWT_ALGORITHM: str = "HS256" # Hardcoded expected algorithm for verification
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 # Short inactivity timeout

    # Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://homeready_app:homeready_app_secure_pw_2026!@127.0.0.1:5432/homeready_dev"
    )
    
    # Redis Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://:homeready_secure_redis_pass_123!@127.0.0.1:6379/0")

    class Config:
        case_sensitive = True

settings = Settings()
