"""Focused persistence operations for attack sessions."""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.attack_session import AttackSession


class AttackSessionRepository:
    """Persist and retrieve attack sessions."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_or_create(
        self,
        *,
        source_ip: str,
        timestamp: datetime,
    ) -> AttackSession:
        """Return an active session or create one."""

        statement = (
            select(AttackSession)
            .where(
                AttackSession.source_ip == source_ip,
                AttackSession.status == "active",
            )
            .limit(1)
        )

        session = self.db.scalar(statement)

        if session is None:
            session = AttackSession(
                source_ip=source_ip,
                first_seen=timestamp,
                last_seen=timestamp,
                request_count=1,
                status="active",
            )

            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)
            return session

        session.last_seen = timestamp
        session.request_count += 1

        self.db.commit()
        self.db.refresh(session)

        return session