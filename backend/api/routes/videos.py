"""
Video upload flow:
  1. POST /videos/upload-url  → returns presigned MinIO URL
     (frontend uploads directly to MinIO — API stays fast)
  2. POST /videos/upload-complete  → triggers async transcode + vision pipeline
  3. GET  /videos/{session_id}/stream  → returns HLS manifest URL
  4. GET  /videos/{session_id}/status  → check processing progress
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.database import get_db
from models.player import CombineSession
from services.storage_service import presigned_upload_url, presigned_download_url
from workers.video_tasks import transcode_video

router = APIRouter()


class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str = "video/mp4"


class UploadCompleteRequest(BaseModel):
    session_id: str
    object_key: str


@router.post("/upload-url")
async def get_upload_url(req: UploadUrlRequest):
    """Return a pre-signed PUT URL so the client can upload directly to MinIO."""
    return presigned_upload_url(req.filename, req.content_type)


@router.post("/upload-complete")
async def upload_complete(req: UploadCompleteRequest, db: AsyncSession = Depends(get_db)):
    """
    Called after client finishes the direct MinIO upload.
    Kicks off async video transcoding → vision analysis pipeline.
    """
    result = await db.execute(select(CombineSession).where(CombineSession.id == req.session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    session.raw_video_key = req.object_key
    session.video_status = "processing"
    await db.commit()

    task = transcode_video.delay(req.session_id, req.object_key)
    return {"task_id": task.id, "status": "processing"}


@router.get("/{session_id}/stream")
async def get_stream_url(session_id: str, db: AsyncSession = Depends(get_db)):
    """Return a pre-signed HLS master manifest URL for video playback."""
    result = await db.execute(select(CombineSession).where(CombineSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session or not session.hls_manifest_key:
        raise HTTPException(404, "Stream not ready")

    from config import get_settings
    settings = get_settings()
    url = presigned_download_url(settings.minio_bucket_processed, session.hls_manifest_key)
    return {"hls_url": url}


@router.get("/{session_id}/status")
async def get_status(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CombineSession).where(CombineSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    return {
        "session_id": session_id,
        "video_status": session.video_status,
        "vision_status": session.vision_status,
    }
