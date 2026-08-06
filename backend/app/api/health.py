"""Backend service health endpoint."""

from typing import Any

from fastapi import APIRouter


router = APIRouter()


@router.get("/health")
async def get_health() -> dict[str, Any]:
    """Return the current backend service health."""
    return {
        "success": True,
        "message": "Backend service is healthy.",
        "data": {"service": "backend", "status": "healthy"},
        "error": None,
    }
