"""Threat detection API."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database.session import get_db
from app.detection.engine import DetectionEngine
from app.models.attack_session import AttackSession
from app.schemas.api_response import ApiResponse, success_response
from app.schemas.detection import DetectionResult
from app.core.exceptions import ApplicationError

router = APIRouter(
    prefix="/api/v1/detection",
    tags=["detection"],
)


@router.get("/{session_id}", response_model=ApiResponse[DetectionResult])
def detect_session(
    session_id: UUID,
    db: Session = Depends(get_db),
):
    session = db.scalar(
        select(AttackSession)
        .options(selectinload(AttackSession.events))
        .where(AttackSession.id == session_id)
    )

    if session is None:
        raise ApplicationError(
            "Attack session not found.",
            code="session_not_found",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    result = DetectionEngine.analyze(
        session,
        list(session.events),
    )

    return success_response(
        result,
        message="Threat analysis completed.",
    )