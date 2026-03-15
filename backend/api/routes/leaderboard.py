"""
Leaderboard — uses raw SQL for aggregation performance.
TimescaleDB continuous aggregates can pre-compute these in production.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from models.database import get_db

router = APIRouter()


@router.get("/{drill_type}")
async def leaderboard(drill_type: str, metric: str = "jump_height", limit: int = 20,
                      db: AsyncSession = Depends(get_db)):
    """
    Return top players ranked by max metric value for a given drill type.
    Efficient: single JOIN + GROUP BY, index on (player_id, metric_type, measured_at).
    """
    rows = await db.execute(
        text("""
            SELECT
                p.id,
                p.name,
                p.team,
                p.jersey_number,
                MAX(sm.value) AS best_value,
                sm.unit,
                COUNT(sm.id) AS attempts
            FROM skill_metrics sm
            JOIN players p ON p.id = sm.player_id
            JOIN combine_sessions cs ON cs.id = sm.session_id
            WHERE cs.drill_type = :drill_type
              AND sm.metric_type = :metric
            GROUP BY p.id, p.name, p.team, p.jersey_number, sm.unit
            ORDER BY best_value DESC
            LIMIT :limit
        """),
        {"drill_type": drill_type, "metric": metric, "limit": limit},
    )

    results = rows.mappings().all()
    return [
        {
            "rank": i + 1,
            "player_id": str(row["id"]),
            "name": row["name"],
            "team": row["team"],
            "jersey_number": row["jersey_number"],
            "best_value": row["best_value"],
            "unit": row["unit"],
            "attempts": row["attempts"],
        }
        for i, row in enumerate(results)
    ]
