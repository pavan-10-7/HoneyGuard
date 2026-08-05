# HoneyGuard - Rules.md

## Project Principles
- Build a focused MVP.
- Prefer clarity over cleverness.
- Every feature must support the core goal: Detect → Correlate → Explain.

## Tech Stack (Locked)
Frontend:
- React + Vite
- Tailwind CSS
- React Query
- React Router
- Recharts
- Framer Motion

Backend:
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic

Database:
- PostgreSQL

Deployment:
- Docker + Docker Compose

## AI Boundaries
ALWAYS:
- Write modular code.
- Add type hints.
- Keep functions <100 lines.
- Use async where appropriate.
- Write reusable components.

NEVER:
- Introduce new libraries without approval.
- Add AI/ML features.
- Change architecture.
- Add unnecessary abstractions.

## API Standards
Response:
{
  "success": true,
  "message": "",
  "data": {},
  "error": null
}

## Error Handling
- Central exception handler
- Structured logging
- User-friendly messages
- No stack traces exposed

## Coding Standards
- snake_case (Python)
- PascalCase (React Components)
- camelCase (JS variables)
- Feature-based folders

## Git
main
develop
feature/*
