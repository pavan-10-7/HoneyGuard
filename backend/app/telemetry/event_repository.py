"""Focused persistence operations for security events."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.security_event import SecurityEvent
from app.schemas.security_event import SecurityEventCreate


class SecurityEventRepository:
    """Persist and retrieve security events without a generic repository layer."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, event_data: SecurityEventCreate) -> SecurityEvent:
        """Store a normalized event supplied by internal telemetry code."""
        event_values = event_data.model_dump(mode="python", exclude_none=False)
        event_values["source_ip"] = str(event_data.source_ip)
        event = SecurityEvent(**event_values)
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_by_id(self, event_id: UUID) -> SecurityEvent | None:
        """Return one event when it exists."""
        return self.db.get(SecurityEvent, event_id)

    def list_recent(self, limit: int) -> list[SecurityEvent]:
        """Return the newest events first."""
        statement = select(SecurityEvent).order_by(SecurityEvent.timestamp.desc()).limit(limit)
        return list(self.db.scalars(statement))
