"""
VideoService — FFmpeg-based transcoding pipeline.

Pipeline per uploaded video:
  1. Download raw file from MinIO
  2. Transcode to multiple HLS renditions (360p / 720p / 1080p)
  3. Upload .ts segments + .m3u8 manifests to MinIO processed bucket
  4. Generate thumbnail
  5. Update session record in DB
"""
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import ffmpeg

from config import get_settings
from services.storage_service import put_hls_segment

settings = get_settings()

RENDITIONS = {
    "360p":  {"width": 640,  "height": 360,  "bitrate": "800k",  "audio": "96k"},
    "720p":  {"width": 1280, "height": 720,  "bitrate": "2500k", "audio": "128k"},
    "1080p": {"width": 1920, "height": 1080, "bitrate": "5000k", "audio": "192k"},
}


def transcode_to_hls(raw_local_path: str, session_id: str) -> str:
    """
    Transcode a raw video to adaptive bitrate HLS.
    Returns the object key of the master .m3u8 manifest in MinIO.
    """
    enabled_renditions = [r for r in settings.video_renditions.split(",") if r in RENDITIONS]
    work_dir = tempfile.mkdtemp(prefix=f"hls_{session_id}_")

    try:
        variant_playlists = []

        for name in enabled_renditions:
            cfg = RENDITIONS[name]
            out_dir = os.path.join(work_dir, name)
            os.makedirs(out_dir)
            segment_pattern = os.path.join(out_dir, "seg_%03d.ts")
            playlist_path = os.path.join(out_dir, "playlist.m3u8")

            (
                ffmpeg
                .input(raw_local_path, threads=settings.ffmpeg_threads)
                .output(
                    playlist_path,
                    vcodec="libx264",
                    acodec="aac",
                    video_bitrate=cfg["bitrate"],
                    audio_bitrate=cfg["audio"],
                    vf=f"scale={cfg['width']}:{cfg['height']}",
                    format="hls",
                    hls_time=settings.hls_segment_duration,
                    hls_playlist_type="vod",
                    hls_segment_filename=segment_pattern,
                    preset="faster",   # balance quality vs. speed
                    movflags="+faststart",
                )
                .overwrite_output()
                .run(quiet=True)
            )

            # Upload all segments and playlist
            for f in Path(out_dir).iterdir():
                object_key = f"sessions/{session_id}/hls/{name}/{f.name}"
                put_hls_segment(str(f), object_key)

            variant_playlists.append((name, cfg["bitrate"]))

        # Build master playlist
        master_lines = ["#EXTM3U", "#EXT-X-VERSION:3"]
        for name, bitrate in variant_playlists:
            cfg = RENDITIONS[name]
            bw = int(bitrate.replace("k", "")) * 1000
            master_lines.append(
                f'#EXT-X-STREAM-INF:BANDWIDTH={bw},RESOLUTION={cfg["width"]}x{cfg["height"]}'
            )
            master_lines.append(f"{name}/playlist.m3u8")

        master_path = os.path.join(work_dir, "master.m3u8")
        Path(master_path).write_text("\n".join(master_lines))

        master_key = f"sessions/{session_id}/hls/master.m3u8"
        put_hls_segment(master_path, master_key)
        return master_key

    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


def generate_thumbnail(raw_local_path: str, session_id: str, at_second: float = 2.0) -> str:
    """Extract a JPEG thumbnail at `at_second` and upload to processed bucket."""
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        thumb_path = tmp.name

    try:
        (
            ffmpeg
            .input(raw_local_path, ss=at_second)
            .output(thumb_path, vframes=1, format="image2", vcodec="mjpeg")
            .overwrite_output()
            .run(quiet=True)
        )
        object_key = f"sessions/{session_id}/thumbnail.jpg"
        put_hls_segment(thumb_path, object_key)
        return object_key
    finally:
        os.unlink(thumb_path)
