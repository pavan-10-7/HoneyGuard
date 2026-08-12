# HoneyGuard
Capstone Project:
HoneyGuard is a real-time cybersecurity honeypot and threat-monitoring
platform that captures interactions with intentionally exposed decoy
services, correlates them into attack sessions, scores their behavior,
and visualizes threat intelligence through a live dashboard.

## Problem

Raw honeypot logs make it difficult to immediately understand what an
attacker is probing, whether requests belong to the same attack, and how
dangerous the behavior is.

## Solution

HoneyGuard:

1.  Exposes decoy endpoints.
2.  Captures interactions as telemetry.
3.  Groups related events into attack sessions.
4.  Applies explainable rule-based detection.
5.  Calculates a session-specific threat score.
6.  Assigns severity.
7.  Streams changes through WebSockets.
8.  Presents the result through a security dashboard.

## Architecture

``` text
Attacker / Demo Script
        ↓
Decoy Endpoints
        ↓
Telemetry Collector
        ↓
Event Storage + Session Correlation
        ↓
Detection Engine
        ↓
Score / Severity / Reasons
        ↓
PostgreSQL
        ↓
WebSocket
        ↓
React Dashboard
```

## Technology Stack

**Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL, Alembic,
WebSockets

**Frontend:** React, Vite, JavaScript, Tailwind/CSS, Framer Motion,
Lucide

**Demo:** Python `demo_attack.py`

## Dashboard

-   **Overview:** live events, active sessions, score, severity and
    event distribution.
-   **Threat Analysis:** current session score, severity and detection
    reasons.
-   **Timeline:** chronological attack progression.
-   **Alerts:** significant detected activity.
-   **Reports:** summarized attack activity.
-   **Settings:** monitoring status, detection rules, system status and
    Start New Demo Session.

## Running

Backend:

``` bash
cd backend
source .venv/Scripts/activate
```

Run the FastAPI application using the configured development command.

Frontend:

``` bash
cd frontend
npm run dev
```

Automated demonstration:

``` bash
python demo_attack.py
```

Start a fresh demonstration from **Settings → Start New Demo Session**
before running the attack.

## Real-Time Updates

HoneyGuard broadcasts changes through WebSockets. The React dashboard
consumes messages such as:

``` text
new_event
session_updated
dashboard_updated
```

This allows the dashboard to update without manual refresh.

## Detection Philosophy

The MVP deliberately uses explainable rule-based detection. The system
can show why a session's score increased instead of producing an
unexplained prediction.

## Status

**MVP COMPLETE --- Demo Ready**
