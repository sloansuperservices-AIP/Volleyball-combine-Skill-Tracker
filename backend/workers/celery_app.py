from celery import Celery
from config import get_settings

settings = get_settings()

app = Celery(
    "volleyball_tracker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["workers.vision_tasks", "workers.video_tasks"],
)

app.conf.update(
    # Routing: keep vision and video work on separate queues
    task_routes={
        "workers.vision_tasks.*": {"queue": "vision"},
        "workers.video_tasks.*": {"queue": "video"},
    },
    # Timeouts
    task_soft_time_limit=settings.celery_task_soft_timeout,
    task_time_limit=settings.celery_task_hard_timeout,
    # Reliability
    task_acks_late=True,                  # Re-queue if worker crashes mid-task
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,         # Don't prefetch — vision tasks are heavy
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    # Result expiry
    result_expires=86400,                 # 24h
    # Beat schedule: storage lifecycle management
    beat_schedule={
        "archive-old-processed-videos": {
            "task": "workers.video_tasks.archive_old_videos",
            "schedule": 3600.0,           # hourly
        },
    },
)
