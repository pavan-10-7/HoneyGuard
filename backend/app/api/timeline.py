"""Timeline API."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.security_event import SecurityEvent
from app.schemas.api_response import ApiResponse, success_response
from app.schemas.timeline import TimelineEntry
from app.core.constants import EVENT_TITLES

router = APIRouter(
    prefix="/api/v1/timeline",
    tags=["timeline"],
)



@router.get("/{session_id}", response_model=ApiResponse[list[TimelineEntry]])
def get_timeline(
    session_id: UUID,
    db: Session = Depends(get_db),
):
    events = list(
        db.scalars(
            select(SecurityEvent)
            .where(SecurityEvent.session_id == session_id)
            .order_by(SecurityEvent.timestamp.asc())
        )
    )

    return success_response(
        [
            TimelineEntry(
                id=e.id,
                timestamp=e.timestamp,
                event_type=e.event_type,
                title=EVENT_TITLES.get(e.event_type, e.event_type),
                method=e.http_method,
                path=e.path,
                status_code=e.status_code,
            )
            for e in events
        ],
        message="Timeline retrieved.",
    )