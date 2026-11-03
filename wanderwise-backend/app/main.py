import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, health, itinerary, trips
from app.core.config import settings
from app.db import models  # noqa: F401  (registers tables on Base.metadata)
from app.db.base import Base
from app.db.session import engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("wanderwise")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.assert_production_ready()
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database ready. AI generation: %s", "enabled" if settings.AI_API_KEY else "template mode")
    yield
    logger.info("Application shutdown.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Wanderwise - Personalized AI Travel Itinerary Planner API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

_origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    # Auth uses Bearer tokens, not cookies, so credentials are only needed for
    # explicit (non-wildcard) origin lists.
    allow_credentials="*" not in _origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["Auth & Profile"])
app.include_router(trips.router, prefix=settings.API_V1_STR, tags=["Trips"])
app.include_router(itinerary.router, prefix=settings.API_V1_STR, tags=["Itinerary & Activities"])


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(part) for part in err.get("loc", []))
        errors.append(f"{loc}: {err.get('msg', 'Invalid input')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors},
    )


@app.get("/")
def root_status():
    return {
        "message": "Welcome to Wanderwise API. Explore interactive documentation at /docs",
        "documentation": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }
