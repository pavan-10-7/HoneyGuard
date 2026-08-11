"""HoneyGuard rule-based detection engine."""

from app.core.constants import (
    SEVERITY_CRITICAL,
    SEVERITY_HIGH,
    SEVERITY_LOW,
    SEVERITY_MEDIUM,
)
from app.detection.rules import ADMIN_EVENTS, SENSITIVE_EVENTS
from app.models.attack_session import AttackSession
from app.models.security_event import SecurityEvent
from app.schemas.detection import DetectionResult


class DetectionEngine:
    """Rule-based threat scoring."""


    @classmethod
    def analyze(
        cls,
        session: AttackSession,
        events: list[SecurityEvent],
    ) -> DetectionResult:
        """Analyze one attack session."""

        score = 0
        reasons: list[str] = []

        # Rule 1
        if session.request_count >= 3:
            score += 20
            reasons.append("Multiple requests detected")

        if session.request_count >= 5:
            score += 20
            reasons.append("High request volume")

        # Rule 2
        event_types = {event.event_type for event in events}

        if len(event_types) >= 3:
            score += 20
            reasons.append("Multiple decoys targeted")

        # Rule 3
        if event_types & SENSITIVE_EVENTS:
            score += 30
            reasons.append("Sensitive file targeted")

        # Rule 4
        if len(event_types & ADMIN_EVENTS) >= 2:
            score += 20
            reasons.append("Administrative interfaces probed")

        # Severity
        if score >= 70:
            severity = SEVERITY_CRITICAL
        elif score >= 50:
            severity = SEVERITY_HIGH
        elif score >= 20:
            severity = SEVERITY_MEDIUM
        else:
            severity = SEVERITY_LOW

        return DetectionResult(
            severity=severity,
            score=score,
            reasons=reasons,
        )