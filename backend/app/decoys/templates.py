"""Helpers for loading HoneyGuard decoy templates."""

from pathlib import Path

_TEMPLATE_DIR = (
    Path(__file__).resolve().parent.parent
    / "templates"
    / "decoys"
)


def load_template(filename: str) -> str:
    """Load a decoy HTML template from disk."""
    return (_TEMPLATE_DIR / filename).read_text(encoding="utf-8")


ADMIN_LOGIN = load_template("admin_login.html")
WORDPRESS_LOGIN = load_template("wordpress_login.html")
PHPMYADMIN_LOGIN = load_template("phpmyadmin.html")
JENKINS_LOGIN = load_template("jenkins.html")
GRAFANA_LOGIN = load_template("grafana.html")


ENV_FILE = """404 Not Found"""