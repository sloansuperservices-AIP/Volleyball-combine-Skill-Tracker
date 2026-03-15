from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from config import get_settings
from models.database import engine, Base
from api.routes import players, sessions, videos, leaderboard

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables (Alembic handles this in prod; this is for dev convenience)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Volleyball Combine Skill Tracker",
    version="1.0.0",
    description="Vision-powered skill analysis for volleyball combines",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(players.router, prefix="/api/v1/players", tags=["Players"])
app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["Sessions"])
app.include_router(videos.router, prefix="/api/v1/videos", tags=["Videos"])
app.include_router(leaderboard.router, prefix="/api/v1/leaderboard", tags=["Leaderboard"])


@app.get("/health")
async def health():
    return {"status": "ok"}
