"""Centralized standard-library logging configuration."""

import logging


def configure_logging(log_level: str) -> None:
    """Configure application logging once using the configured log level."""
    level = getattr(logging, log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s level=%(levelname)s logger=%(name)s message=%(message)s",
        force=True,
    )
    logging.getLogger("app").info("event=logging_configured log_level=%s", log_level)
