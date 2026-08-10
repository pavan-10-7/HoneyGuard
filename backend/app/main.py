"""HoneyGuard FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.decoys.admin import router as admin_decoy_router
from app.api.decoys.wordpress import router as wordpress_decoy_router
from app.api.decoys.database import router as database_decoy_router
from app.api.decoys.backups import router as backup_decoy_router
from app.api.decoys.internal_api import router as internal_api_decoy_router
from app.api.decoys.infrastructure import router as infrastructure_decoy_router
from app.api.sessions import router as session_router
from app.api.events import router as events_router
from app.api.health import router as health_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.api.timeline import router as timeline_router


configure_logging(settings.log_level)
app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(events_router)
app.include_router(admin_decoy_router)
app.include_router(wordpress_decoy_router)
app.include_router(database_decoy_router)
app.include_router(backup_decoy_router)
app.include_router(internal_api_decoy_router)
app.include_router(infrastructure_decoy_router)
app.include_router(session_router)
app.include_router(timeline_router)

register_exception_handlers(app)