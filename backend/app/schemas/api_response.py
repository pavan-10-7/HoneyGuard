"""Shared API response schemas for HoneyGuard endpoints."""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel


DataT = TypeVar("DataT")


class ApiError(BaseModel):
    """Safe error details returned to API clients."""

    code: str
    message: str


class ApiResponse(BaseModel, Generic[DataT]):
    """Standard HoneyGuard API response envelope."""

    success: bool
    message: str
    data: DataT | dict[str, Any]
    error: ApiError | None = None


def success_response(data: DataT, message: str = "") -> ApiResponse[DataT]:
    """Create a successful standard API response."""
    return ApiResponse(success=True, message=message, data=data)


def error_response(
    *,
    code: str,
    message: str,
    data: dict[str, Any] | None = None,
) -> ApiResponse[dict[str, Any]]:
    """Create a failed standard API response without internal details."""
    return ApiResponse(
        success=False,
        message=message,
        data=data or {},
        error=ApiError(code=code, message=message),
    )
