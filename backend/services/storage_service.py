"""
StorageService — wraps MinIO (S3-compatible) with:
  - Multipart pre-signed upload URLs (frontend uploads directly, bypassing API)
  - Pre-signed download / streaming URLs
  - Lifecycle-aware bucket routing (raw → processed → archive)
"""
import uuid
from datetime import timedelta
from minio import Minio
from minio.commonconfig import ENABLED
from minio.lifecycleconfig import LifecycleConfig, Rule, Expiration, Filter

from config import get_settings

settings = get_settings()


def _client() -> Minio:
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_use_ssl,
    )


def presigned_upload_url(filename: str, content_type: str = "video/mp4") -> dict:
    """
    Return a pre-signed PUT URL so the frontend can upload directly to MinIO.
    Avoids routing large video files through the API server.
    """
    client = _client()
    object_key = f"{uuid.uuid4()}/{filename}"
    url = client.presigned_put_object(
        settings.minio_bucket_raw,
        object_key,
        expires=timedelta(hours=2),
    )
    return {"upload_url": url, "object_key": object_key, "bucket": settings.minio_bucket_raw}


def presigned_download_url(bucket: str, object_key: str, expiry_hours: int = 12) -> str:
    """Pre-signed GET URL for video playback or HLS manifest."""
    client = _client()
    return client.presigned_get_object(
        bucket,
        object_key,
        expires=timedelta(hours=expiry_hours),
    )


def move_to_processed(raw_key: str, processed_key: str) -> None:
    """Copy from raw → processed bucket then remove raw object."""
    client = _client()
    client.copy_object(
        settings.minio_bucket_processed,
        processed_key,
        f"{settings.minio_bucket_raw}/{raw_key}",
    )
    client.remove_object(settings.minio_bucket_raw, raw_key)


def archive_object(processed_key: str, archive_key: str) -> None:
    """Move cold content to archive bucket (cheaper storage tier)."""
    client = _client()
    client.copy_object(
        settings.minio_bucket_archive,
        archive_key,
        f"{settings.minio_bucket_processed}/{processed_key}",
    )
    client.remove_object(settings.minio_bucket_processed, processed_key)


def put_hls_segment(local_path: str, object_key: str) -> None:
    """Upload an HLS .ts segment or .m3u8 manifest to processed bucket."""
    client = _client()
    content_type = "application/x-mpegurl" if object_key.endswith(".m3u8") else "video/mp2t"
    client.fput_object(
        settings.minio_bucket_processed,
        object_key,
        local_path,
        content_type=content_type,
    )
