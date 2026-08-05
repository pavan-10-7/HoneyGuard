# HoneyGuard - Architecture

# High Level

Request

↓

Telemetry Collector

↓

Event Engine

↓

Session Engine

↓

Threat Engine

↓

Timeline Generator

↓

Dashboard

---

# Application Flow

Attacker

↓

Decoy Endpoint

↓

FastAPI

↓

Telemetry

↓

PostgreSQL

↓

Threat Analysis

↓

WebSocket

↓

React Dashboard

---

# Tech Stack

Frontend

- React
- Vite
- Tailwind CSS
- React Router
- React Query
- Framer Motion
- Recharts

Backend

- FastAPI
- SQLAlchemy
- Pydantic
- WebSockets

Database

- PostgreSQL

Deployment

- Docker
- Docker Compose

---

# Folder Structure

HoneyGuard/

docs/

frontend/
    src/
        components/
        pages/
        hooks/
        services/
        layouts/
        assets/

backend/
    api/
    core/
    telemetry/
    detection/
    sessions/
    timeline/
    models/
    schemas/
    database/
    websocket/
    utils/

docker/

---

# Core Modules

Telemetry
Collects every request.

Event Engine
Normalizes events.

Session Engine
Groups events.

Threat Engine
Assigns scores.

Timeline Generator
Creates attack stories.

Dashboard
Displays analytics.

---

# Database

users

events

sessions

rules

alerts

---

# Request Lifecycle

Incoming Request

↓

Store Event

↓

Create / Update Session

↓

Evaluate Rules

↓

Generate Threat Score

↓

Update Timeline

↓

Push Dashboard

---

# Deployment

Docker Compose

Frontend

Backend

PostgreSQL
