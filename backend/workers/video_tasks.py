"""
Video transcoding tasks — runs on the `video` Celery queue (CPU workers).

Flow:
  upload_complete → transcode_video → [vision_tasks.analyze_session]
"""
import os
import tempfile
from datetime import datetime, timedelta

from celery import shared_task
from minio import Minio

from config import get_settings
from services.video_service import transcode_to_hls, generate_thumbnail
from services.storage_service import move_to_processed, archive_object, presigned_download_url

settings = get_settings()


def _minio() -> Minio:
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_use_ssl,
    )


@shared_task(bind=True, name="workers.video_tasks.transcode_video", max_retries=3)
def transcode_video(self, session_id: str, raw_object_key: str):
    """
    1. Download raw video from MinIO
    2. Transcode to adaptive HLS
    3. Generate thumbnail
    4. Move raw to processed bucket
    5. Trigger vision analysis
    """
    client = _minio()

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        raw_local = tmp.name

    try:
        # Download raw upload
        client.fget_object(settings.minio_bucket_raw, raw_object_key, raw_local)

        # Transcode
        master_key = transcode_to_hls(raw_local, session_id)
        thumb_key = generate_thumbnail(raw_local, session_id)

        # Move raw file to processed (keeps original for vision worker)
        processed_key = f"sessions/{session_id}/original.mp4"
        move_to_processed(raw_object_key, processed_key)

        # Chain to vision analysis
        from workers.vision_tasks import analyze_session
        analyze_session.delay(session_id, processed_key)

        return {
            "session_id": session_id,
            "hls_manifest_key": master_key,
            "thumbnail_key": thumb_key,
            "processed_video_key": processed_key,
        }

    except Exception as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 10)
    finally:
        if os.path.exists(raw_local):
            os.unlink(raw_local)


@shared_task(name="workers.video_tasks.archive_old_videos")
def archive_old_videos():
    """
    Celery Beat task: move processed videos older than 30 days to archive bucket.
    Archive bucket can be pointed at cheaper/slower storage.
    """
    client = _minio()
    cutoff = datetime.utcnow() - timedelta(days=30)
    archived = 0

    for obj in client.list_objects(settings.minio_bucket_processed, recursive=True):
        if obj.last_modified and obj.last_modified.replace(tzinfo=None) < cutoff:
            archive_key = obj.object_name
            archive_object(obj.object_name, archive_key)
            archived += 1

    return {"archived_count": archived}
