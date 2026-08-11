"""Rule definitions used by the HoneyGuard detection engine."""

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