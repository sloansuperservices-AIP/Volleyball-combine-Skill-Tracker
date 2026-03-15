"""
SkillDetector — derives volleyball-specific metrics from MediaPipe pose landmarks.

Metrics tracked:
  - jump_height (cm):     vertical displacement of hip midpoint from baseline
  - arm_speed (deg/s):    angular velocity of elbow joint during spike motion
  - reaction_time (ms):   time from ball appearance to initial movement onset

MediaPipe landmark indices (key ones used here):
  11=left_shoulder, 12=right_shoulder
  13=left_elbow,    14=right_elbow
  15=left_wrist,    16=right_wrist
  23=left_hip,      24=right_hip
  25=left_knee,     26=right_knee
  27=left_ankle,    28=right_ankle
"""
import math


class SkillDetector:
    def __init__(self, confidence_threshold: float = 0.5):
        self.confidence_threshold = confidence_threshold
        self._hip_baseline_y: float | None = None
        self._prev_elbow_angle: float | None = None
        self._prev_frame_idx: int | None = None

    def detect(self, pose_result: dict, frame_idx: int, fps: float) -> list[dict]:
        """Return a list of metric events for this frame."""
        lm = pose_result["landmarks"]
        events = []

        # Only process landmarks with sufficient visibility
        def visible(idx: int) -> bool:
            return lm.get(idx, {}).get("visibility", 0) >= self.confidence_threshold

        # ── Jump Height ───────────────────────────────────────────────────────
        if visible(23) and visible(24):
            hip_y = (lm[23]["y"] + lm[24]["y"]) / 2
            frame_height = pose_result["height"]

            if self._hip_baseline_y is None:
                self._hip_baseline_y = hip_y

            # Upward displacement (pixels), converted to cm assuming 170cm avg frame height
            displacement_px = self._hip_baseline_y - hip_y
            if displacement_px > 5:  # filter noise below 5px
                cm_per_px = 170.0 / frame_height
                jump_height_cm = displacement_px * cm_per_px
                events.append({
                    "metric_type": "jump_height",
                    "value": round(jump_height_cm, 1),
                    "unit": "cm",
                    "frame_index": frame_idx,
                    "confidence": min(lm[23]["visibility"], lm[24]["visibility"]),
                })

        # ── Arm Speed (elbow angular velocity) ────────────────────────────────
        if visible(12) and visible(14) and visible(16):
            shoulder = lm[12]
            elbow = lm[14]
            wrist = lm[16]

            angle = _joint_angle(
                (shoulder["x"], shoulder["y"]),
                (elbow["x"], elbow["y"]),
                (wrist["x"], wrist["y"]),
            )

            if self._prev_elbow_angle is not None and self._prev_frame_idx is not None:
                dt = (frame_idx - self._prev_frame_idx) / fps
                if dt > 0:
                    angular_velocity = abs(angle - self._prev_elbow_angle) / dt
                    if angular_velocity > 50:  # filter noise < 50 deg/s
                        events.append({
                            "metric_type": "arm_speed",
                            "value": round(angular_velocity, 1),
                            "unit": "deg/s",
                            "frame_index": frame_idx,
                            "confidence": lm[14]["visibility"],
                        })

            self._prev_elbow_angle = angle
            self._prev_frame_idx = frame_idx

        return events


def _joint_angle(a: tuple, b: tuple, c: tuple) -> float:
    """Compute the angle at joint b given three (x,y) points."""
    ba = (a[0] - b[0], a[1] - b[1])
    bc = (c[0] - b[0], c[1] - b[1])
    dot = ba[0] * bc[0] + ba[1] * bc[1]
    mag_ba = math.hypot(*ba)
    mag_bc = math.hypot(*bc)
    if mag_ba == 0 or mag_bc == 0:
        return 0.0
    cos_angle = max(-1.0, min(1.0, dot / (mag_ba * mag_bc)))
    return math.degrees(math.acos(cos_angle))
