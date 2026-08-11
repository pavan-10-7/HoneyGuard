"""Detection result schemas."""

from pydantic import BaseModel


class DetectionResult(BaseModel):
    """Result produced by the detection engine."""

    severity: str
    score: int
    reasons: list[str]