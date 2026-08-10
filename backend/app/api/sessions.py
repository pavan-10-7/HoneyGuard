"""Read-only API endpoints for attack sessions."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import ApplicationError
from app.database.session import get_db
from app.models.attack_session import AttackSession
from app.schemas.api_response import ApiResponse, success_response
from app.schemas.attack_session import (
    AttackSessionDetail,
    AttackSessionRead,
)

router = APIRouter(
    prefix="/api/v1/sessions",
    tags=["sessions"],
)


@router.get("", response_model=ApiResponse[list[AttackSessionRead]])
def list_sessions(
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    db: Session = Depends(get_db),
):
    sessions = list(
        db.scalars(
            select(AttackSession)
            .order_by(AttackSession.last_seen.desc())
            .limit(limit)
        )
    )

    return success_response(
        [AttackSessionRead.model_validate(s) for s in sessions],
        message="Attack sessions retrieved.",
    )


@router.get("/{session_id}", response_model=ApiResponse[AttackSessionDetail])
def get_session(
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

    return success_response(
        AttackSessionDetail.model_validate(session),
        message="Attack session retrieved.",
    )