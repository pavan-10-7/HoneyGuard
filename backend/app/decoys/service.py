"""Core service for serving HoneyGuard deception endpoints."""

from fastapi import Request
from fastapi.responses import Response

from app.decoys.response import DecoyResponse
from app.schemas.security_event import SecurityEventType
from app.telemetry.collector import TelemetryCollector


class DecoyService:
    """Coordinates telemetry collection and response generation."""

    def __init__(self, collector: TelemetryCollector) -> None:
        self.collector = collector

    async def html(
        self,
        *,
        request: Request,
        event_type: SecurityEventType,
        content: str,
        status_code: int = 200,
    ) -> Response:
        """Serve an HTML decoy while recording telemetry."""

        await self.collector.collect_decoy_interaction(
            request=request,
            status_code=status_code,
            event_type=event_type,
        )

        return DecoyResponse.html(
            content=content,
            status_code=status_code,
        )

    async def json(
        self,
        *,
        request: Request,
        event_type: SecurityEventType,
        code: str,
        message: str,
        status_code: int,
    ) -> Response:
        """Serve a JSON decoy while recording telemetry."""

        await self.collector.collect_decoy_interaction(
            request=request,
            status_code=status_code,
            event_type=event_type,
        )

        return DecoyResponse.json(
            code=code,
            message=message,
            status_code=status_code,
        )

    async def text(
        self,
        *,
        request: Request,
        event_type: SecurityEventType,
        content: str,
        status_code: int = 200,
    ) -> Response:
        """Serve a plain-text decoy while recording telemetry."""

        await self.collector.collect_decoy_interaction(
            request=request,
            status_code=status_code,
            event_type=event_type,
        )

        return DecoyResponse.text(
            content=content,
            status_code=status_code,
        )

    async def binary(
        self,
        *,
        request: Request,
        event_type: SecurityEventType,
        content: bytes,
        filename: str,
        media_type: str,
        status_code: int = 200,
    ) -> Response:
        """Serve a downloadable decoy while recording telemetry."""

        await self.collector.collect_decoy_interaction(
            request=request,
            status_code=status_code,
            event_type=event_type,
        )

        return DecoyResponse.binary(
            content=content,
            filename=filename,
            media_type=media_type,
            status_code=status_code,
        )