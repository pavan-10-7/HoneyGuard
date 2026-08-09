"""HoneyGuard deception endpoints.

These routes intentionally expose simulated resources designed to observe
suspicious interactions. They do not provide access to real services,
credentials, or application functionality.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status

from app.schemas.api_response import ApiResponse, error_response
from app.telemetry.collector import TelemetryCollector
from app.telemetry.dependencies import get_telemetry_collector


router = APIRouter(
    prefix="/decoy",
    tags=["decoy"],
)


@router.post(
    "/admin/login",
    response_model=ApiResponse[dict],
    status_code=status.HTTP_401_UNAUTHORIZED,
)
async def decoy_admin_login(
    request: Request,
    collector: Annotated[
        TelemetryCollector,
        Depends(get_telemetry_collector),
    ],
) -> ApiResponse[dict]:
    """Simulate an administrative login endpoint."""

    await collector.collect_decoy_interaction(
        request,
        status_code=status.HTTP_401_UNAUTHORIZED,
    )

    return error_response(
        code="invalid_credentials",
        message="Invalid username or password.",
    )