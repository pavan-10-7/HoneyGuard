"""Reusable response builders for HoneyGuard deception endpoints."""

from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse, Response

from app.schemas.api_response import error_response


class DecoyResponse:
    """Factory methods for common decoy response types."""

    @staticmethod
    def html(content: str, status_code: int = 200) -> HTMLResponse:
        return HTMLResponse(
            content=content,
            status_code=status_code,
        )

    @staticmethod
    def json(
        *,
        code: str,
        message: str,
        status_code: int,
    ) -> JSONResponse:
        payload = error_response(
            code=code,
            message=message,
        ).model_dump(mode="json")

        return JSONResponse(
            content=payload,
            status_code=status_code,
        )

    @staticmethod
    def text(
        content: str,
        status_code: int = 200,
    ) -> PlainTextResponse:
        return PlainTextResponse(
            content=content,
            status_code=status_code,
        )

    @staticmethod
    def binary(
        content: bytes,
        *,
        filename: str,
        media_type: str,
        status_code: int = 200,
    ) -> Response:
        return Response(
            content=content,
            media_type=media_type,
            status_code=status_code,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )