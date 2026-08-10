"""Infrastructure deception endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.decoys.service import DecoyService
from app.decoys.templates import GRAFANA_LOGIN, JENKINS_LOGIN
from app.schemas.security_event import SecurityEventType
from app.telemetry.collector import TelemetryCollector
from app.telemetry.dependencies import get_telemetry_collector

router = APIRouter(tags=["Infrastructure Decoys"])


@router.get("/jenkins", status_code=status.HTTP_200_OK)
async def jenkins(
    request: Request,
    collector: Annotated[TelemetryCollector, Depends(get_telemetry_collector)],
):
    return await DecoyService(collector).html(
        request=request,
        event_type=SecurityEventType.JENKINS,
        content=JENKINS_LOGIN,
    )


@router.get("/grafana", status_code=status.HTTP_200_OK)
async def grafana(
    request: Request,
    collector: Annotated[TelemetryCollector, Depends(get_telemetry_collector)],
):
    return await DecoyService(collector).html(
        request=request,
        event_type=SecurityEventType.GRAFANA,
        content=GRAFANA_LOGIN,
    )