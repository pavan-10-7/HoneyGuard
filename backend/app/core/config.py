"""Application configuration loaded from environment variables."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Runtime configuration for the HoneyGuard backend."""

    app_name: str = "HoneyGuard API"
    app_version: str = "0.1.0"
    cors_origins: list[str] = ["http://localhost:5173"]
    postgres_db: str = Field(validation_alias="POSTGRES_DB")
    postgres_user: str = Field(validation_alias="POSTGRES_USER")
    postgres_password: str = Field(validation_alias="POSTGRES_PASSWORD")
    postgres_host: str = Field(
        default="localhost", validation_alias="POSTGRES_HOST"
    )
    postgres_port: int = Field(default=5432, validation_alias="POSTGRES_PORT")

    @property
    def database_url(self) -> str:
        """Build the PostgreSQL connection URL used by the application and Alembic."""
        return URL.create(
            drivername="postgresql+psycopg",
            username=self.postgres_user,
            password=self.postgres_password,
            host=self.postgres_host,
            port=self.postgres_port,
            database=self.postgres_db,
        ).render_as_string(hide_password=False)

    model_config = SettingsConfigDict(
        env_prefix="HONEYGUARD_",
        case_sensitive=False,
        env_file=PROJECT_ROOT / ".env",
        extra="ignore",
    )


settings = Settings()
