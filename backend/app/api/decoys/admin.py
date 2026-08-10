"""Administrative deception endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.decoys.service import DecoyService
from app.decoys.templates import ADMIN_LOGIN
from app.schemas.security_event import SecurityEventType
from app.telemetry.collector import TelemetryCollector
from app.telemetry.dependencies import get_telemetry_collector


router = APIRouter(tags=["Admin Decoys"])


@router.get(
    "/admin/login",
    status_code=status.HTTP_200_OK,
)
async def admin_login_page(
    request: Request,
    collector: Annotated[
        TelemetryCollector,
        Depends(get_telemetry_collector),
    ],
):
    """Serve the fake administrator login page."""

    service = DecoyService(collector)

    return await service.html(
        request=request,
        event_type=SecurityEventType.ADMIN_LOGIN,
        content=ADMIN_LOGIN,
        status_code=status.HTTP_200_OK,
    )