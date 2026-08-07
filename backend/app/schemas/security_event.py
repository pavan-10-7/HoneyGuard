"""Pydantic schemas for internal security-event persistence and API output."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, IPvAnyAddress


class SecurityEventType(StrEnum):
    """Known event categories; additional values can be added as telemetry grows."""

    DECOY_INTERACTION = "decoy_interaction"


class SecurityEventCreate(BaseModel):
    """Internal-only normalized data supplied by a future telemetry collector."""

    timestamp: AwareDatetime
    source_ip: IPvAnyAddress
    http_method: str = Field(min_length=1, max_length=16)
    path: str = Field(min_length=1)
    query_string: str | None = None
    user_agent: str | None = None
    referrer: str | None = None
    content_type: str | None = Field(default=None, max_length=255)
    request_body: str | None = None
    status_code: int = Field(ge=100, le=599)
    event_type: SecurityEventType = SecurityEventType.DECOY_INTERACTION


class SecurityEventRead(BaseModel):
    """Security-event representation returned by the read-only API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    timestamp: AwareDatetime
    source_ip: IPvAnyAddress
    http_method: str
    path: str
    query_string: str | None
    user_agent: str | None
    referrer: str | None
    content_type: str | None
    request_body: str | None
    status_code: int
    event_type: SecurityEventType
    created_at: AwareDatetime
