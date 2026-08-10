"""Database-related deception endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.decoys.service import DecoyService
from app.decoys.templates import PHPMYADMIN_LOGIN
from app.schemas.security_event import SecurityEventType
from app.telemetry.collector import TelemetryCollector
from app.telemetry.dependencies import get_telemetry_collector

router = APIRouter(tags=["Database Decoys"])


@router.get("/phpmyadmin", status_code=status.HTTP_200_OK)
async def phpmyadmin(
    request: Request,
    collector: Annotated[TelemetryCollector, Depends(get_telemetry_collector)],
):
    return await DecoyService(collector).html(
        request=request,
        event_type=SecurityEventType.PHPMYADMIN,
        content=PHPMYADMIN_LOGIN,
    )