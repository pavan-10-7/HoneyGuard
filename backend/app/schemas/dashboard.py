"""Dashboard response schemas."""

from pydantic import BaseModel

from app.schemas.attack_session import AttackSessionRead
from app.schemas.security_event import SecurityEventRead


class DashboardSummary(BaseModel):
    """Summary returned for the HoneyGuard dashboard."""

    total_events: int
    active_sessions: int
    latest_events: list[SecurityEventRead]
    latest_sessions: list[AttackSessionRead]
    event_breakdown: dict[str, int]