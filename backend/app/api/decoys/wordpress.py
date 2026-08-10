"""WordPress deception endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.decoys.service import DecoyService
from app.decoys.templates import WORDPRESS_LOGIN
from app.schemas.security_event import SecurityEventType
from app.telemetry.collector import TelemetryCollector
from app.telemetry.dependencies import get_telemetry_collector

router = APIRouter(tags=["WordPress Decoys"])


@router.get(
    "/wp-admin",
    status_code=status.HTTP_200_OK,
)
async def wordpress_login(
    request: Request,
    collector: Annotated[
        TelemetryCollector,
        Depends(get_telemetry_collector),
    ],
):
    """Serve a fake WordPress login page."""

    return await DecoyService(collector).html(
        request=request,
        event_type=SecurityEventType.WORDPRESS,
        content=WORDPRESS_LOGIN,
        status_code=status.HTTP_200_OK,
    )