"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the HoneyGuard backend."""

    app_name: str = "HoneyGuard API"
    app_version: str = "0.1.0"
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(
        env_prefix="HONEYGUARD_",
        case_sensitive=False,
    )


settings = Settings()
