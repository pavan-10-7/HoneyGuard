"""HoneyGuard rule-based detection engine."""

from app.models.attack_session import AttackSession
from app.models.security_event import SecurityEvent
from app.schemas.detection import DetectionResult


class DetectionEngine:
    """Rule-based threat scoring."""

    SENSITIVE_EVENTS = {
        "env_file",
        "backup_file",
    }

    ADMIN_EVENTS = {
        "admin_login",
        "wordpress",
        "phpmyadmin",
        "jenkins",
        "grafana",
    }

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
        if event_types & cls.SENSITIVE_EVENTS:
            score += 30
            reasons.append("Sensitive file targeted")

        # Rule 4
        if len(event_types & cls.ADMIN_EVENTS) >= 2:
            score += 20
            reasons.append("Administrative interfaces probed")

        # Severity
        if score >= 70:
            severity = "critical"
        elif score >= 50:
            severity = "high"
        elif score >= 20:
            severity = "medium"
        else:
            severity = "low"

        return DetectionResult(
            severity=severity,
            score=score,
            reasons=reasons,
        )