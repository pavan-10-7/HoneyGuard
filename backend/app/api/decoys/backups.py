"""Backup and configuration deception endpoints."""

from typing import Annotated

from fastapi import Depends, Request, status
from fastapi.responses import Response

from app.decoys.service import DecoyService
from app.schemas.security_event import SecurityEventType
from app.telemetry.collector import TelemetryCollector
from app.telemetry.dependencies import get_telemetry_collector

from fastapi import APIRouter

router = APIRouter(tags=["Backup Decoys"])


@router.get("/.env")
async def env_file(
    request: Request,
    collector: Annotated[
        TelemetryCollector,
        Depends(get_telemetry_collector),
    ],
):
    """
    Simulate a hidden environment configuration file.
    """

    await collector.collect_decoy_interaction(
        request=request,
        status_code=status.HTTP_404_NOT_FOUND,
        event_type=SecurityEventType.ENV_FILE,
    )

    return Response(
        status_code=status.HTTP_404_NOT_FOUND,
    )


@router.get("/backup.zip")
async def backup_file(
    request: Request,
    collector: Annotated[
        TelemetryCollector,
        Depends(get_telemetry_collector),
    ],
):
    """
    Simulate a protected backup archive.
    """

    await collector.collect_decoy_interaction(
        request=request,
        status_code=status.HTTP_403_FORBIDDEN,
        event_type=SecurityEventType.BACKUP_FILE,
    )

    return Response(
        status_code=status.HTTP_403_FORBIDDEN,
        headers={
            "Content-Disposition": 'attachment; filename="backup.zip"',
            "Content-Type": "application/zip",
            "Content-Length": "0",
        },
    )