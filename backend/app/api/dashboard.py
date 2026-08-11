"""Dashboard summary API."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dashboard.dashboard_repository import DashboardRepository
from app.database.session import get_db
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
    repository = DashboardRepository(db)

    (
        total_events,
        active_sessions,
        latest_events,
        latest_sessions,
        breakdown,
    ) = repository.summary()

    return success_response(
        DashboardSummary(
            total_events=total_events,
            active_sessions=active_sessions,
            latest_events=[
                SecurityEventRead.model_validate(event)
                for event in latest_events
            ],
            latest_sessions=[
                AttackSessionRead.model_validate(session)
                for session in latest_sessions
            ],
            event_breakdown=breakdown,
        ),
        message="Dashboard summary retrieved.",
    )