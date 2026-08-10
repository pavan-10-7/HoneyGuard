"""Timeline response schemas."""

from uuid import UUID

from pydantic import AwareDatetime, BaseModel


class TimelineEntry(BaseModel):
    """One event within an attack timeline."""

    id: UUID
    timestamp: AwareDatetime
    event_type: str
    title: str
    method: str
    path: str
    status_code: int