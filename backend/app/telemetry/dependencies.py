"""FastAPI dependencies for HoneyGuard telemetry services."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.telemetry.collector import TelemetryCollector


def get_telemetry_collector(
    db: Annotated[Session, Depends(get_db)],
) -> TelemetryCollector:
    """Provide a request-scoped telemetry collector."""

    return TelemetryCollector(db)