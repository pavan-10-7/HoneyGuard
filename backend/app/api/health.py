"""Backend service health endpoint."""

from typing import Any

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import engine


router = APIRouter()


@router.get("/health", response_model=None)
def get_health() -> dict[str, Any] | JSONResponse:
    """Return backend and PostgreSQL connectivity health without exposing internals."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "success": False,
                "message": "Backend service is unhealthy.",
                "data": {
                    "backend": {"status": "healthy"},
                    "database": {"status": "unhealthy"},
                },
                "error": {
                    "code": "database_unavailable",
                    "message": "PostgreSQL is unavailable.",
                },
            },
        )

    return {
        "success": True,
        "message": "Backend service is healthy.",
        "data": {
            "backend": {"status": "healthy"},
            "database": {"status": "healthy"},
        },
        "error": None,
    }
