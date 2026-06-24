import logging
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import router as api_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="HomeReady AI - Real Estate Whole-House Upgrade Recommendation Engine API Gateway"
)

# Mandatory Secure Web Skills: Default HTTP Headers & Strict CORS Policy
# - Only allow trusted origins, avoid wildcard origins (*)
# - Set strict CSP policy
# - Set X-Content-Type-Options: nosniff
# - Set X-Frame-Options: DENY (Clickjacking protection)
# - Set Cache-Control: no-store on sensitive endpoints

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"], # Explicit allow-list of necessary HTTP methods
    allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],
)

@app.middleware("http")
async def add_secure_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; object-src 'none';"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    return response

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", status_code=200)
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    # Mandatory Secure Web Skills: Servers MUST listen on localhost or 127.0.0.1 when testing.
    # Servers MUST NOT listen on 0.0.0.0.
    uvicorn.run(app, host=settings.SERVER_HOST, port=settings.SERVER_PORT)
