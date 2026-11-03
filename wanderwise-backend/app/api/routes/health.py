from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine

router = APIRouter()


@router.get("/health")
def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:  # noqa: BLE001
        db_status = "unavailable"
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": {
            "status": db_status,
            "mode": engine.dialect.name,
        },
        "ai_engine": {
            "mode": "api" if settings.AI_API_KEY else "offline_templates",
            "model": settings.AI_MODEL if settings.AI_API_KEY else "wanderwise-curated-v1",
        },
        "version": "1.0.0",
    }
