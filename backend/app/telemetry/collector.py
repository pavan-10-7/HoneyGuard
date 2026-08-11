"""Telemetry collection and normalization for HoneyGuard decoy interactions."""

import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.security_event import SecurityEvent
from app.schemas.security_event import SecurityEventCreate, SecurityEventType
from app.telemetry.event_repository import SecurityEventRepository
from app.telemetry.session_repository import AttackSessionRepository
from app.detection.engine import DetectionEngine
from app.websocket.manager import manager
from app.dashboard.dashboard_repository import DashboardRepository



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
        self.event_repository = SecurityEventRepository(db)
        self.session_repository = AttackSessionRepository(db)

    async def collect_decoy_interaction(
        self,
        request: Request,
        *,
        status_code: int,
        event_type: SecurityEventType,
    ) -> SecurityEvent:
        """Capture a single interaction with a HoneyGuard decoy resource."""

        request_body = await self._extract_request_body(request)
        timestamp = datetime.now(timezone.utc)

        source_ip = self._extract_source_ip(request)

        session = self.session_repository.get_or_create(
            source_ip=source_ip,
            timestamp=timestamp,
        )

        event_data = SecurityEventCreate(
            session_id=session.id,
            timestamp=timestamp,
            source_ip=source_ip,
            http_method=request.method,
            path=request.url.path,
            query_string=request.url.query or None,
            user_agent=request.headers.get("user-agent"),
            referrer=request.headers.get("referer"),
            content_type=request.headers.get("content-type"),
            request_body=request_body,
            status_code=status_code,
            event_type=event_type,
        )

        event = self.event_repository.create(event_data)

        events = list(
            self.event_repository.db.scalars(
                select(SecurityEvent)
                .where(SecurityEvent.session_id == session.id)
                .order_by(SecurityEvent.timestamp.asc())
            )
        )

        result = DetectionEngine.analyze(
            session=session,
            events=events,
        )

        session.severity = result.severity
        session.score = result.score

        self.session_repository.db.commit()
        self.session_repository.db.refresh(session)

        logger.info(
            "Decoy interaction captured event_id=%s source_ip=%s method=%s path=%s status_code=%s",
            event.id,
            event.source_ip,
            event.http_method,
            event.path,
            event.status_code,
        )

        await manager.broadcast(
            {
                "type": "new_event",
                "data": {
                    "id": str(event.id),
                    "session_id": str(event.session_id),
                    "event_type": event.event_type,
                    "path": event.path,
                    "method": event.http_method,
                    "status_code": event.status_code,
                    "source_ip": str(event.source_ip),
                    "timestamp": event.timestamp.isoformat(),
                },
            }
        )

        await manager.broadcast(
            {
                "type": "session_updated",
                "data": {
                    "id": str(session.id),
                    "source_ip": str(session.source_ip),
                    "request_count": session.request_count,
                    "severity": session.severity,
                    "score": session.score,
                    "status": session.status,
                    "first_seen": session.first_seen.isoformat(),
                    "last_seen": session.last_seen.isoformat(),
                },
            }
        )

        dashboard = DashboardRepository(
            self.session_repository.db
        )

        (
            total_events,
            active_sessions,
            latest_events,
            latest_sessions,
            breakdown,
        ) = dashboard.summary()

        await manager.broadcast(
            {
                "type": "dashboard_updated",
                "data": {
                    "total_events": total_events,
                    "active_sessions": active_sessions,
                    "event_breakdown": breakdown,
                },
            }
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