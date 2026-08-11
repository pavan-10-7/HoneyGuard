"""Shared constants used across HoneyGuard."""

# -------------------------
# Severity Levels
# -------------------------

SEVERITY_LOW = "low"
SEVERITY_MEDIUM = "medium"
SEVERITY_HIGH = "high"
SEVERITY_CRITICAL = "critical"

# -------------------------
# Event Titles
# -------------------------

EVENT_TITLES = {
    "admin_login": "Admin Login Probe",
    "wordpress": "WordPress Enumeration",
    "phpmyadmin": "phpMyAdmin Enumeration",
    "env_file": "Environment File Discovery",
    "backup_file": "Backup Archive Probe",
    "internal_api": "Internal API Access Attempt",
    "jenkins": "Jenkins Console Enumeration",
    "grafana": "Grafana Dashboard Probe",
}