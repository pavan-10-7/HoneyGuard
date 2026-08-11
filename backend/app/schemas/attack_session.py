"""Pydantic schemas for attack sessions."""

from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, IPvAnyAddress

from app.schemas.security_event import SecurityEventRead


class AttackSessionRead(BaseModel):
    """Attack session returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_ip: IPvAnyAddress
    first_seen: AwareDatetime
    last_seen: AwareDatetime
    request_count: int

    severity: str
    score: int

    status: str
    created_at: AwareDatetime


class AttackSessionDetail(AttackSessionRead):
    """Attack session including captured events."""

    events: list[SecurityEventRead]