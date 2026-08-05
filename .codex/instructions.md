# HoneyGuard - Codex Instructions

You are working on HoneyGuard, a production-quality cybersecurity capstone project.

Before writing any code, ALWAYS read the documentation inside /docs in the following order:

1. Why_HoneyGuard.md
2. PRD.md
3. Architecture.md
4. Rules.md
5. Phases.md
6. Design.md
7. Memory.md

## Project Rules

- Never change the project architecture.
- Never introduce new libraries without approval.
- Never change the tech stack.
- Never add AI/ML functionality.
- Never remove comments or documentation.
- Keep the code modular and production-ready.
- Write clean, maintainable code.
- Follow SOLID principles where applicable.

## Tech Stack

Frontend
- React
- Vite
- TailwindCSS
- React Query
- React Router
- Framer Motion
- Recharts

Backend
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic

Database
- PostgreSQL

Deployment
- Docker Compose

## Coding Standards

Python
- snake_case
- Type hints
- Async where appropriate

React
- Functional components
- Hooks
- PascalCase components

## API Response Format

{
  "success": true,
  "message": "",
  "data": {},
  "error": null
}

## After Every Completed Feature

- Update Memory.md
- Do not modify any other documentation unless instructed.