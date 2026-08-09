"""Telemetry collection and normalization for HoneyGuard decoy interactions."""

import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.security_event import SecurityEvent
from app.schemas.security_event import SecurityEventCreate, SecurityEventType
from app.telemetry.event_repository import SecurityEventRepository


logger = logging.getLogger(__name__)

MAX_REQUEST_BODY_BYTES = 16_384

SENSITIVE_FIELDS = {
    "password",
    "passwd",
    "pass",
    "pwd",
    "secret",
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "apikey",
    "authorization",
    "cookie",
}

REDACTED_VALUE = "[REDACTED]"


class TelemetryCollector:
    """Normalize decoy interactions and persist them as security events."""

    def __init__(self, db: Session) -> None:
        self.repository = SecurityEventRepository(db)

    async def collect_decoy_interaction(
        self,
        request: Request,
        *,
        status_code: int,
    ) -> SecurityEvent:
        """Capture a single interaction with a HoneyGuard decoy resource."""

        request_body = await self._extract_request_body(request)

        event_data = SecurityEventCreate(
            timestamp=datetime.now(timezone.utc),
            source_ip=self._extract_source_ip(request),
            http_method=request.method,
            path=request.url.path,
            query_string=request.url.query or None,
            user_agent=request.headers.get("user-agent"),
            referrer=request.headers.get("referer"),
            content_type=request.headers.get("content-type"),
            request_body=request_body,
            status_code=status_code,
            event_type=SecurityEventType.DECOY_INTERACTION,
        )

        event = self.repository.create(event_data)

        logger.info(
            "Decoy interaction captured event_id=%s source_ip=%s "
            "method=%s path=%s status_code=%s",
            event.id,
            event.source_ip,
            event.http_method,
            event.path,
            event.status_code,
        )

        return event

    @staticmethod
    def _extract_source_ip(request: Request) -> str:
        """Return the direct peer IP observed by the application."""

        if request.client is None:
            return "0.0.0.0"

        return request.client.host

    @classmethod
    async def _extract_request_body(cls, request: Request) -> str | None:
        """Capture a bounded and sanitized representation of the request body."""

        if request.method.upper() not in {"POST", "PUT", "PATCH"}:
            return None

        try:
            body = await request.body()
        except Exception:
            logger.warning(
                "Unable to read request body method=%s path=%s",
                request.method,
                request.url.path,
            )
            return None

        if not body:
            return None

        bounded_body = body[:MAX_REQUEST_BODY_BYTES]

        try:
            decoded_body = bounded_body.decode("utf-8")
        except UnicodeDecodeError:
            decoded_body = bounded_body.decode("utf-8", errors="replace")

        content_type = request.headers.get("content-type", "").lower()

        if "application/json" in content_type:
            return cls._sanitize_json_body(decoded_body)

        # Non-JSON payloads are intentionally not persisted yet.
        # Later phases can introduce safe format-specific sanitizers.
        return "[NON-JSON BODY OMITTED]"

    @classmethod
    def _sanitize_json_body(cls, body: str) -> str:
        """Redact sensitive fields from a JSON request body."""

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            return "[INVALID JSON BODY OMITTED]"

        sanitized = cls._redact_sensitive_values(payload)

        return json.dumps(
            sanitized,
            separators=(",", ":"),
            ensure_ascii=False,
        )

    @classmethod
    def _redact_sensitive_values(cls, value: Any) -> Any:
        """Recursively redact sensitive keys from JSON structures."""

        if isinstance(value, dict):
            sanitized: dict[str, Any] = {}

            for key, item in value.items():
                if key.lower() in SENSITIVE_FIELDS:
                    sanitized[key] = REDACTED_VALUE
                else:
                    sanitized[key] = cls._redact_sensitive_values(item)

            return sanitized

        if isinstance(value, list):
            return [
                cls._redact_sensitive_values(item)
                for item in value
            ]

        return value