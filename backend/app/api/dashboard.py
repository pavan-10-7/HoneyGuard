"""Dashboard summary API."""

from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.attack_session import AttackSession
from app.models.security_event import SecurityEvent
from app.schemas.api_response import ApiResponse, success_response
from app.schemas.attack_session import AttackSessionRead
from app.schemas.dashboard import DashboardSummary
from app.schemas.security_event import SecurityEventRead

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["dashboard"],
)


@router.get("", response_model=ApiResponse[DashboardSummary])
def get_dashboard(
    db: Session = Depends(get_db),
):
    total_events = db.scalar(
        select(func.count(SecurityEvent.id))
    ) or 0

    active_sessions = db.scalar(
        select(func.count(AttackSession.id))
        .where(AttackSession.status == "active")
    ) or 0

    latest_events = list(
        db.scalars(
            select(SecurityEvent)
            .order_by(SecurityEvent.timestamp.desc())
            .limit(10)
        )
    )

    latest_sessions = list(
        db.scalars(
            select(AttackSession)
            .order_by(AttackSession.last_seen.desc())
            .limit(10)
        )
    )

    breakdown = Counter(event.event_type for event in latest_events)

    return success_response(
        DashboardSummary(
            total_events=total_events,
            active_sessions=active_sessions,
            latest_events=[
                SecurityEventRead.model_validate(e)
                for e in latest_events
            ],
            latest_sessions=[
                AttackSessionRead.model_validate(s)
                for s in latest_sessions
            ],
            event_breakdown=dict(breakdown),
        ),
        message="Dashboard summary retrieved.",
    )