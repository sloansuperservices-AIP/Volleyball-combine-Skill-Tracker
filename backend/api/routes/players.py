import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.database import get_db
from models.player import Player

router = APIRouter()


class PlayerCreate(BaseModel):
    name: str
    jersey_number: int | None = None
    position: str | None = None
    team: str | None = None


class PlayerResponse(BaseModel):
    id: uuid.UUID
    name: str
    jersey_number: int | None
    position: str | None
    team: str | None

    class Config:
        from_attributes = True


@router.post("/", response_model=PlayerResponse, status_code=201)
async def create_player(data: PlayerCreate, db: AsyncSession = Depends(get_db)):
    player = Player(**data.model_dump())
    db.add(player)
    await db.commit()
    await db.refresh(player)
    return player


@router.get("/", response_model=list[PlayerResponse])
async def list_players(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).order_by(Player.name))
    return result.scalars().all()


@router.get("/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(404, "Player not found")
    return player
