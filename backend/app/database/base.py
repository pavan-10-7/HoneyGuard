"""Shared SQLAlchemy declarative base for HoneyGuard ORM models."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for future HoneyGuard ORM models."""
