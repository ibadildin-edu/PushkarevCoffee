from functools import cached_property
from pathlib import Path
from zoneinfo import ZoneInfo

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
ROOT_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(ROOT_DIR / ".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://coffee:coffee@localhost:5432/coffeemetrics"
    tz_name: str = "Asia/Almaty"
    # Comma-separated list of allowed origins.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    db_echo: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @cached_property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.tz_name)


settings = Settings()
