"""Pydantic schemas for internal security-event persistence and API output."""

from enum import StrEnum
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, IPvAnyAddress


class SecurityEventType(StrEnum):
    """Supported HoneyGuard deception event categories."""

    ADMIN_LOGIN = "admin_login"
    WORDPRESS = "wordpress"
    PHPMYADMIN = "phpmyadmin"
    BACKUP_FILE = "backup_file"
    ENV_FILE = "env_file"
    INTERNAL_API = "internal_api"
    JENKINS = "jenkins"
    GRAFANA = "grafana"


class SecurityEventCreate(BaseModel):
    """Internal-only normalized data supplied by the telemetry collector."""

    session_id: UUID

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

    event_type: SecurityEventType


class SecurityEventRead(BaseModel):
    """Security-event representation returned by the read-only API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID

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