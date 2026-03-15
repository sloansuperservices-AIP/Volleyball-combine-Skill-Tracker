from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_env: str = "development"
    secret_key: str = "change-me-in-production"
    allowed_origins: str = "http://localhost:3000"

    # PostgreSQL
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "volleyball_tracker"
    postgres_user: str = "vb_user"
    postgres_password: str = "change-me"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # Redis
    redis_url: str = "redis://redis:6379/0"
    redis_cache_ttl: int = 86400  # 24h

    # MinIO / S3
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "change-me"
    minio_bucket_raw: str = "raw-uploads"
    minio_bucket_processed: str = "processed-videos"
    minio_bucket_archive: str = "archive"
    minio_use_ssl: bool = False

    # Vision processing
    vision_frame_sample_rate: int = 3   # every Nth frame
    vision_batch_size: int = 16
    vision_confidence_threshold: float = 0.5
    mediapipe_model_complexity: int = 1

    # Video processing
    ffmpeg_threads: int = 4
    hls_segment_duration: int = 6
    video_renditions: str = "360p,720p,1080p"
    video_max_upload_mb: int = 2048

    # Celery
    celery_concurrency_vision: int = 2
    celery_concurrency_video: int = 4
    celery_task_soft_timeout: int = 300
    celery_task_hard_timeout: int = 600

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
