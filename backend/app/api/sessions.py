"""API endpoints for attack sessions."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status
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
from app.websocket.manager import manager

router = APIRouter(
    prefix="/api/v1/sessions",
    tags=["sessions"],
)


@router.post("/demo/new")
async def start_new_demo_session(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    End the current active session for the requesting IP.

    The next decoy interaction will automatically create a fresh
    attack session with score 0.
    """

    source_ip = (
        request.client.host
        if request.client is not None
        else "0.0.0.0"
    )

    session = db.scalar(
        select(AttackSession)
        .where(
            AttackSession.source_ip == source_ip,
            AttackSession.status == "active",
        )
        .order_by(AttackSession.last_seen.desc())
        .limit(1)
    )

    if session is None:
        return success_response(
            {
                "source_ip": source_ip,
                "session_id": None,
                "status": "ready",
            },
            message="No active session found. The next attack will start a new session.",
        )

    session.status = "completed"

    db.commit()
    db.refresh(session)

    await manager.broadcast(
        {
            "type": "session_updated",
            "data": {
                "id": str(session.id),
                "source_ip": str(session.source_ip),
                "request_count": session.request_count,
                "severity": session.severity,
                "score": session.score,
                "status": session.status,
                "first_seen": session.first_seen.isoformat(),
                "last_seen": session.last_seen.isoformat(),
            },
        }
    )

    return success_response(
        {
            "source_ip": source_ip,
            "session_id": str(session.id),
            "status": "completed",
            "next_session_score": 0,
        },
        message="Demo session ended. The next attack will start a fresh session.",
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