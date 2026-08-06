"""Application exceptions and centralized FastAPI handlers."""

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas.api_response import error_response


logger = logging.getLogger(__name__)


class ApplicationError(Exception):
    """Base exception for expected HoneyGuard application errors."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "application_error",
        status_code: int = status.HTTP_400_BAD_REQUEST,
        data: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        self.data = data


def _json_error_response(
    status_code: int,
    *,
    code: str,
    message: str,
    data: dict[str, Any] | None = None,
) -> JSONResponse:
    """Serialize an error using the standard HoneyGuard API envelope."""
    response = error_response(code=code, message=message, data=data)
    return JSONResponse(status_code=status_code, content=response.model_dump())


def register_exception_handlers(app: FastAPI) -> None:
    """Register safe, consistently logged exception handlers."""

    @app.exception_handler(ApplicationError)
    async def handle_application_error(
        request: Request, exc: ApplicationError
    ) -> JSONResponse:
        logger.warning(
            "event=application_error method=%s path=%s code=%s status_code=%s",
            request.method,
            request.url.path,
            exc.code,
            exc.status_code,
        )
        return _json_error_response(
            exc.status_code, code=exc.code, message=str(exc), data=exc.data
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.warning(
            "event=request_validation_failed method=%s path=%s errors=%s",
            request.method,
            request.url.path,
            len(exc.errors()),
        )
        return _json_error_response(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            code="validation_error",
            message="The request data is invalid.",
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        messages = {
            status.HTTP_404_NOT_FOUND: "The requested resource was not found.",
            status.HTTP_405_METHOD_NOT_ALLOWED: "The request method is not allowed.",
        }
        message = messages.get(exc.status_code, "The request could not be completed.")
        logger.warning(
            "event=http_error method=%s path=%s status_code=%s",
            request.method,
            request.url.path,
            exc.status_code,
        )
        return _json_error_response(exc.status_code, code="http_error", message=message)

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "event=unexpected_error method=%s path=%s",
            request.method,
            request.url.path,
            exc_info=exc,
        )
        return _json_error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="internal_server_error",
            message="An unexpected server error occurred.",
        )
