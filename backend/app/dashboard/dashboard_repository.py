"""Dashboard data access."""

from collections import Counter

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.attack_session import AttackSession
from app.models.security_event import SecurityEvent


class DashboardRepository:
    """Queries backing the dashboard."""

    def __init__(self, db: Session):
        self.db = db

    def summary(self):
        total_events = self.db.scalar(
            select(func.count(SecurityEvent.id))
        ) or 0

        active_sessions = self.db.scalar(
            select(func.count(AttackSession.id))
            .where(AttackSession.status == "active")
        ) or 0

        latest_events = list(
            self.db.scalars(
                select(SecurityEvent)
                .order_by(SecurityEvent.timestamp.desc())
                .limit(10)
            )
        )

        latest_sessions = list(
            self.db.scalars(
                select(AttackSession)
                .order_by(AttackSession.last_seen.desc())
                .limit(10)
            )
        )

        breakdown = Counter(
            event.event_type for event in latest_events
        )

        return (
            total_events,
            active_sessions,
            latest_events,
            latest_sessions,
            dict(breakdown),
        )