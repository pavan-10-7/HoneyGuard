# HoneyGuard - Memory.md

Current Phase:
Phase 2 — Telemetry
Phase 2.3 complete

Progress

Completed
✓ Project finalized
✓ Why HoneyGuard
✓ PRD v1
✓ Architecture v1
✓ Rules v1
✓ Phases v1
✓ Design v1

In Progress
None

Completed This Phase
- Initial FastAPI backend foundation
- Backend health endpoint
- Backend configuration and frontend CORS
- PostgreSQL 16 Docker Compose service with persistent storage and healthcheck
- SQLAlchemy database engine, sessions, declarative base, and FastAPI dependency
- Alembic foundation sharing the application database configuration
- Database-aware backend health endpoint
- Phase 1.3 React + Vite + Tailwind frontend foundation
- React Router and TanStack React Query application providers
- Environment-configured frontend health check with loading, healthy, and unavailable states
- Minimal responsive skeuomorphic HoneyGuard foundation screen
- Phase 1.4 shared API response contract
- Centralized API exception handling with safe client responses and server-side logs
- Centralized standard-library backend logging configured by LOG_LEVEL
- Phase 1 backend foundation hardening and validation
- Phase 2.1 SecurityEvent persistence foundation
- PostgreSQL security_events table created through Alembic migration
- UUID-based SecurityEvent SQLAlchemy model
- IPv4/IPv6 source address storage using PostgreSQL INET
- Timezone-aware security event timestamps
- Pydantic schemas for internal event creation and API output
- SecurityEvent repository for create, lookup, and recent-event retrieval
- Read-only GET /api/v1/events endpoint
- Read-only GET /api/v1/events/{event_id} endpoint
- Bounded event listing limit
- Controlled event-not-found handling
- Database indexes for timestamp, source_ip, and event_type
- Phase 2.2 TelemetryCollector service implemented
- Internal telemetry dependency for request-scoped collectors
- Automatic normalization of decoy interactions
- Request body size limiting (16 KiB)
- Recursive JSON payload sanitization
- Automatic redaction of sensitive fields (passwords, tokens, API keys, cookies, authorization values)
- Structured telemetry logging
- Phase 2.3 first production decoy endpoint (/decoy/admin/login)
- End-to-end telemetry pipeline validated:
  Decoy → Collector → Repository → PostgreSQL → Events API

Blocked
None

Architecture Decisions
✓ FastAPI
✓ React
✓ PostgreSQL
✓ Docker
✓ Rule-based detection

Future Decisions
- Multi-decoy strategy
- Session correlation strategy
- Decoy endpoint catalogue
- Session correlation strategy
- Detection rules
- Threat scoring model
- Dashboard widgets

Change Log

v0.1
Initial documentation created.

v0.2
Initial FastAPI backend foundation completed with a configured health endpoint.

v0.3
Phase 1.2 PostgreSQL, SQLAlchemy, and Alembic foundation completed without domain tables or migrations.

v0.4
Phase 1.3 frontend foundation completed and validated with lint and production build.

v0.5
Phase 1.4 backend foundation hardening completed: shared API response schemas,
centralized exception handling, LOG_LEVEL-driven standard logging, and full Phase 1 validation.

v0.6
Phase 2.1 security event persistence completed. Added the SecurityEvent domain model,
Alembic migration, event schemas, repository layer, and read-only event APIs.

v0.7
Phase 2.2 introduced the TelemetryCollector responsible for request normalization,
payload sanitization, sensitive-data redaction, and event persistence.

v0.8
Phase 2.3 introduced HoneyGuard's first deception endpoint and validated the
complete telemetry pipeline from decoy interaction through PostgreSQL storage
and API retrieval.