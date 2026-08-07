"""Read-only API endpoints for persisted HoneyGuard security events."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.exceptions import ApplicationError
from app.database.session import get_db
from app.schemas.api_response import ApiResponse, success_response
from app.schemas.security_event import SecurityEventRead
from app.telemetry.event_repository import SecurityEventRepository


router = APIRouter(prefix="/api/v1/events", tags=["events"])


@router.get("", response_model=ApiResponse[list[SecurityEventRead]])
def list_events(
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    db: Session = Depends(get_db),
) -> ApiResponse[list[SecurityEventRead]]:
    """Return recent security events with a bounded result size."""
    events = SecurityEventRepository(db).list_recent(limit)
    return success_response(
        [SecurityEventRead.model_validate(event) for event in events],
        message="Security events retrieved.",
    )


@router.get("/{event_id}", response_model=ApiResponse[SecurityEventRead])
def get_event(
    event_id: UUID,
    db: Session = Depends(get_db),
) -> ApiResponse[SecurityEventRead]:
    """Return one security event or a controlled not-found response."""
    event = SecurityEventRepository(db).get_by_id(event_id)
    if event is None:
        raise ApplicationError(
            "The requested security event was not found.",
            code="event_not_found",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    return success_response(
        SecurityEventRead.model_validate(event),
        message="Security event retrieved.",
    )
