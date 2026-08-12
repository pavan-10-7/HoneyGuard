"""Focused persistence operations for attack sessions."""

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.attack_session import AttackSession


# A session is considered finished after this much inactivity.
# This prevents attacks performed hours apart from being grouped
# into the same session.
SESSION_TIMEOUT_MINUTES = 5


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
        """Return the current active session or create a new one."""

        statement = (
            select(AttackSession)
            .where(
                AttackSession.source_ip == source_ip,
                AttackSession.status == "active",
            )
            .order_by(AttackSession.last_seen.desc())
            .limit(1)
        )

        session = self.db.scalar(statement)

        # No active session exists.
        if session is None:
            return self._create_session(
                source_ip=source_ip,
                timestamp=timestamp,
            )

        # If the attacker has been inactive long enough, close the
        # previous session and start a completely new attack session.
        timeout = timedelta(minutes=SESSION_TIMEOUT_MINUTES)

        if timestamp - session.last_seen > timeout:
            session.status = "completed"
            self.db.commit()

            return self._create_session(
                source_ip=source_ip,
                timestamp=timestamp,
            )

        # Existing session is still active.
        session.last_seen = timestamp
        session.request_count += 1

        self.db.commit()
        self.db.refresh(session)

        return session

    def _create_session(
        self,
        *,
        source_ip: str,
        timestamp: datetime,
    ) -> AttackSession:
        """Create and persist a fresh attack session."""

        session = AttackSession(
            source_ip=source_ip,
            first_seen=timestamp,
            last_seen=timestamp,
            request_count=1,
            severity="low",
            score=0,
            status="active",
        )

        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        return session