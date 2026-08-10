"""Internal API deception endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.decoys.service import DecoyService
from app.schemas.security_event import SecurityEventType
from app.telemetry.collector import TelemetryCollector
from app.telemetry.dependencies import get_telemetry_collector

router = APIRouter(tags=["Internal API Decoys"])


@router.get("/api/internal", status_code=status.HTTP_401_UNAUTHORIZED)
async def internal_api(
    request: Request,
    collector: Annotated[TelemetryCollector, Depends(get_telemetry_collector)],
):
    return await DecoyService(collector).json(
        request=request,
        event_type=SecurityEventType.INTERNAL_API,
        code="unauthorized",
        message="Authentication required.",
        status_code=status.HTTP_401_UNAUTHORIZED,
    )