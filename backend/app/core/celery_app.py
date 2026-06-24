from celery import Celery
from app.core.config import settings

# Mandatory Secure Web Skills: Servers and databases MUST listen exclusively on localhost/127.0.0.1
# Celery connects to Redis broker strictly on 127.0.0.1:6379
celery_app = Celery(
    "homeready_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    # Ensure secure isolated workers
    worker_concurrency=4,
)
