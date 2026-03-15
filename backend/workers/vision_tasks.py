"""
Vision analysis tasks — runs on the `vision` Celery queue (GPU workers).

Optimization strategy:
  - Frame sampling: only process every Nth frame (configurable)
  - Batch inference: collect N frames then run inference in one pass
  - Result caching: store analysis in Redis so re-requests skip reprocessing
  - Confidence filtering: skip low-quality detections early
"""
import json
import os
import tempfile

import redis as redis_lib
from celery import shared_task
from minio import Minio

from config import get_settings

settings = get_settings()

_redis = redis_lib.from_url(settings.redis_url)


def _minio() -> Minio:
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_use_ssl,
    )


def _cache_key(session_id: str) -> str:
    return f"vision:result:{session_id}"


@shared_task(bind=True, name="workers.vision_tasks.analyze_session", max_retries=2)
def analyze_session(self, session_id: str, video_object_key: str):
    """
    Full vision pipeline for a combine session video.
    Returns aggregated skill metrics saved to DB and cached in Redis.
    """
    # Check cache first — idempotent re-runs skip heavy processing
    cached = _redis.get(_cache_key(session_id))
    if cached:
        return json.loads(cached)

    client = _minio()
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        local_path = tmp.name

    try:
        client.fget_object(settings.minio_bucket_processed, video_object_key, local_path)
        metrics = _run_vision_pipeline(local_path, session_id)

        # Persist metrics to DB
        _save_metrics_to_db(session_id, metrics)

        # Cache aggregated result
        _redis.setex(_cache_key(session_id), settings.redis_cache_ttl, json.dumps(metrics))

        return metrics

    except Exception as exc:
        raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))
    finally:
        if os.path.exists(local_path):
            os.unlink(local_path)


def _run_vision_pipeline(video_path: str, session_id: str) -> dict:
    """
    Execute the full computer vision stack on the video.
    Dynamically imports heavy ML libs so the API container doesn't need them.
    """
    import cv2  # type: ignore
    from vision_worker.pose_estimator import PoseEstimator
    from vision_worker.skill_detector import SkillDetector

    estimator = PoseEstimator(model_complexity=settings.mediapipe_model_complexity)
    detector = SkillDetector(confidence_threshold=settings.vision_confidence_threshold)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_idx = 0
    frame_buffer = []
    all_events = []

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Frame sampling: skip frames to reduce load
            if frame_idx % settings.vision_frame_sample_rate != 0:
                frame_idx += 1
                continue

            frame_buffer.append((frame_idx, frame))

            # Batch inference when buffer is full
            if len(frame_buffer) >= settings.vision_batch_size:
                events = _process_batch(frame_buffer, estimator, detector, fps)
                all_events.extend(events)
                frame_buffer.clear()

            frame_idx += 1

        # Process remaining frames
        if frame_buffer:
            events = _process_batch(frame_buffer, estimator, detector, fps)
            all_events.extend(events)

    finally:
        cap.release()
        estimator.close()

    return _aggregate_events(all_events, fps)


def _process_batch(
    frame_buffer: list,
    estimator,
    detector,
    fps: float,
) -> list[dict]:
    """Run pose estimation + skill detection on a batch of frames."""
    events = []
    for frame_idx, frame in frame_buffer:
        pose_result = estimator.process(frame)
        if pose_result is None:
            continue
        frame_events = detector.detect(pose_result, frame_idx, fps)
        events.extend(frame_events)
    return events


def _aggregate_events(events: list[dict], fps: float) -> dict:
    """Compute summary statistics from raw per-frame events."""
    jump_heights = [e["value"] for e in events if e["metric_type"] == "jump_height"]
    arm_speeds = [e["value"] for e in events if e["metric_type"] == "arm_speed"]
    reaction_times = [e["value"] for e in events if e["metric_type"] == "reaction_time"]

    def safe_stats(values: list[float]) -> dict:
        if not values:
            return {"count": 0, "max": None, "avg": None}
        return {
            "count": len(values),
            "max": round(max(values), 2),
            "avg": round(sum(values) / len(values), 2),
        }

    return {
        "jump_height_cm": safe_stats(jump_heights),
        "arm_speed_deg_s": safe_stats(arm_speeds),
        "reaction_time_ms": safe_stats(reaction_times),
        "total_events": len(events),
        "raw_events": events,
    }


def _save_metrics_to_db(session_id: str, metrics: dict) -> None:
    """
    Persist individual metric events to skill_metrics table.
    Uses synchronous psycopg2 since Celery workers aren't async.
    """
    import psycopg2
    from config import get_settings
    s = get_settings()

    conn = psycopg2.connect(
        host=s.postgres_host, port=s.postgres_port, dbname=s.postgres_db,
        user=s.postgres_user, password=s.postgres_password,
    )
    try:
        with conn.cursor() as cur:
            for event in metrics.get("raw_events", []):
                cur.execute(
                    """
                    INSERT INTO skill_metrics
                        (id, player_id, session_id, measured_at, metric_type, value, unit, frame_index, confidence)
                    SELECT gen_random_uuid(), cs.player_id, cs.id,
                           NOW(), %(metric_type)s, %(value)s, %(unit)s, %(frame_index)s, %(confidence)s
                    FROM combine_sessions cs WHERE cs.id = %(session_id)s
                    """,
                    {**event, "session_id": session_id},
                )
            cur.execute(
                "UPDATE combine_sessions SET vision_status='ready', summary=%s WHERE id=%s",
                (json.dumps({k: v for k, v in metrics.items() if k != "raw_events"}), session_id),
            )
        conn.commit()
    finally:
        conn.close()
