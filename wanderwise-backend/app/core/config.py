import json
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

INSECURE_DEFAULT_SECRET = "dev-only-insecure-secret-change-me"


class Settings(BaseSettings):
    APP_ENV: str = "development"
    PROJECT_NAME: str = "Wanderwise API"
    API_V1_STR: str = "/api"

    # Database. SQLite for local dev, PostgreSQL in production.
    DATABASE_URL: str = "sqlite:///./travel_planner.db"

    # Auth
    SECRET_KEY: str = INSECURE_DEFAULT_SECRET
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # AI (any OpenAI-compatible endpoint). Leave AI_API_KEY empty to use the
    # built-in offline itinerary generator.
    AI_API_KEY: str = ""
    AI_BASE_URL: str = "https://api.openai.com/v1"
    AI_MODEL: str = "gpt-4o-mini"
    AI_TIMEOUT_SECONDS: int = 45

    # Comma-separated list OR JSON array. "*" allows every origin.
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        # Render / Heroku / Neon sometimes hand out "postgres://", which
        # SQLAlchemy 2.x no longer accepts.
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def cors_origins_list(self) -> List[str]:
        raw = (self.CORS_ORIGINS or "").strip()
        if not raw:
            return []
        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                return [str(o).strip() for o in parsed if str(o).strip()]
            except json.JSONDecodeError:
                pass
        return [o.strip() for o in raw.split(",") if o.strip()]

    def assert_production_ready(self) -> None:
        if self.is_production and self.SECRET_KEY == INSECURE_DEFAULT_SECRET:
            raise RuntimeError(
                "SECRET_KEY must be set to a long random value when APP_ENV=production."
            )


settings = Settings()
