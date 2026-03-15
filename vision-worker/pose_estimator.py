"""
PoseEstimator — wraps MediaPipe Pose for volleyball body landmark detection.

Design choices for performance:
  - Reuse single MediaPipe instance across frames (avoid re-init cost)
  - static_image_mode=False: uses tracking between frames (faster)
  - model_complexity configurable: 0=lite (fast), 1=full, 2=heavy
"""
import numpy as np


class PoseEstimator:
    def __init__(self, model_complexity: int = 1):
        import mediapipe as mp  # lazy import keeps startup fast when not needed

        self._mp_pose = mp.solutions.pose
        self._pose = self._mp_pose.Pose(
            static_image_mode=False,        # track across frames (much faster)
            model_complexity=model_complexity,
            smooth_landmarks=True,
            enable_segmentation=False,      # disable unused segmentation
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def process(self, frame_bgr: np.ndarray) -> dict | None:
        """
        Returns normalized landmark dict or None if no person detected.
        Converts BGR→RGB internally (MediaPipe requirement).
        """
        import cv2
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        rgb.flags.writeable = False
        result = self._pose.process(rgb)

        if not result.pose_landmarks:
            return None

        h, w = frame_bgr.shape[:2]
        landmarks = {}
        for idx, lm in enumerate(result.pose_landmarks.landmark):
            landmarks[idx] = {
                "x": lm.x * w,
                "y": lm.y * h,
                "z": lm.z,
                "visibility": lm.visibility,
            }
        return {"landmarks": landmarks, "height": h, "width": w}

    def close(self):
        self._pose.close()
