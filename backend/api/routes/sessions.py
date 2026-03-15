import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.database import get_db
from models.player import CombineSession

router = APIRouter()


class SessionCreate(BaseModel):
    player_id: uuid.UUID
    drill_type: str  # spike, serve, dig, block, jump


class SessionResponse(BaseModel):
    id: uuid.UUID
    player_id: uuid.UUID
    drill_type: str
    video_status: str
    vision_status: str
    summary: dict | None

    class Config:
        from_attributes = True


@router.post("/", response_model=SessionResponse, status_code=201)
async def create_session(data: SessionCreate, db: AsyncSession = Depends(get_db)):
    session = CombineSession(**data.model_dump())
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CombineSession).where(CombineSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@router.get("/player/{player_id}", response_model=list[SessionResponse])
async def list_player_sessions(player_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CombineSession)
        .where(CombineSession.player_id == player_id)
        .order_by(CombineSession.recorded_at.desc())
    )
    return result.scalars().all()
