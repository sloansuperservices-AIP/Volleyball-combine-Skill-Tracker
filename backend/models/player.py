import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from models.database import Base


class Player(Base):
    __tablename__ = "players"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    jersey_number: Mapped[int | None] = mapped_column(Integer)
    position: Mapped[str | None] = mapped_column(String(50))
    team: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    sessions: Mapped[list["CombineSession"]] = relationship("CombineSession", back_populates="player")
    metrics: Mapped[list["SkillMetric"]] = relationship("SkillMetric", back_populates="player")


class CombineSession(Base):
    """One recorded drill/combine session per player."""
    __tablename__ = "combine_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("players.id"), nullable=False)
    drill_type: Mapped[str] = mapped_column(String(50), nullable=False)  # spike, serve, dig, block, jump
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Video references
    raw_video_key: Mapped[str | None] = mapped_column(String(500))      # MinIO raw bucket key
    processed_video_key: Mapped[str | None] = mapped_column(String(500)) # MinIO processed bucket key
    hls_manifest_key: Mapped[str | None] = mapped_column(String(500))   # .m3u8 path

    # Processing state machine
    video_status: Mapped[str] = mapped_column(String(20), default="pending")   # pending/processing/ready/failed
    vision_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/processing/ready/failed
    vision_task_id: Mapped[str | None] = mapped_column(String(100))            # Celery task id

    # Aggregate results (denormalized for fast reads)
    summary: Mapped[dict | None] = mapped_column(JSON)

    player: Mapped["Player"] = relationship("Player", back_populates="sessions")
    metrics: Mapped[list["SkillMetric"]] = relationship("SkillMetric", back_populates="session")


class SkillMetric(Base):
    """
    Time-series skill measurements per session.
    Backed by TimescaleDB hypertable for fast range queries.
    """
    __tablename__ = "skill_metrics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("players.id"), nullable=False)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("combine_sessions.id"), nullable=False)

    # TimescaleDB partitioning column
    measured_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)  # jump_height, arm_speed, reaction_time
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20))                         # cm, deg/s, ms
    frame_index: Mapped[int | None] = mapped_column(Integer)              # source frame in video
    confidence: Mapped[float | None] = mapped_column(Float)               # model confidence 0-1

    player: Mapped["Player"] = relationship("Player", back_populates="metrics")
    session: Mapped["CombineSession"] = relationship("CombineSession", back_populates="metrics")
