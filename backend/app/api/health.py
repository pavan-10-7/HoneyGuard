"""Backend service health endpoint."""

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import engine
from app.schemas.api_response import ApiResponse, error_response, success_response


router = APIRouter()


class ServiceHealth(BaseModel):
    """Health state for an individual HoneyGuard service."""

    status: str


class HealthData(BaseModel):
    """Health states exposed by the backend health endpoint."""

    backend: ServiceHealth
    database: ServiceHealth


@router.get("/health", response_model=ApiResponse[HealthData])
def get_health() -> ApiResponse[HealthData] | JSONResponse:
    """Return backend and PostgreSQL connectivity health without exposing internals."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        response = error_response(
            code="database_unavailable",
            message="Backend service is unhealthy.",
            data={
                "backend": {"status": "healthy"},
                "database": {"status": "unhealthy"},
            },
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=response.model_dump(),
        )

    return success_response(
        HealthData(
            backend=ServiceHealth(status="healthy"),
            database=ServiceHealth(status="healthy"),
        ),
        message="Backend service is healthy.",
    )
