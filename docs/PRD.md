# HoneyGuard - Product Requirements Document (PRD)

## Version
0.2 Draft

---

# Product Vision

HoneyGuard is a deception-based attack intelligence platform that detects reconnaissance against web applications using decoy resources and reconstructs attacker behavior into meaningful attack sessions.

---

# Problem Statement

Organizations often detect attacks only after exploitation attempts begin.

Reconnaissance activities usually go unnoticed.

HoneyGuard provides early visibility into suspicious activity.

---

# Objectives

## Functional

- Deploy decoy endpoints
- Capture telemetry
- Correlate sessions
- Generate threat scores
- Visualize attacks
- Provide attack timelines

## Learning

Demonstrate:

- Honeypots
- Detection Engineering
- Web Security
- FastAPI
- React
- Docker
- PostgreSQL

---

# Non Goals

Not a:

- SIEM
- IDS
- WAF
- Malware Sandbox
- Pentesting Toolkit

---

# Users

- Developers
- Students
- Researchers
- Small Security Teams

---

# User Stories

- View suspicious activity
- Investigate attack sessions
- Understand threat reasoning
- Monitor live attacks

---

# Functional Requirements

FR-1 Decoy endpoints

FR-2 Event collection

FR-3 Session engine

FR-4 Threat engine

FR-5 Dashboard

FR-6 Timeline

FR-7 Metrics

---

# Non Functional Requirements

- Docker deployment
- Responsive UI
- Low resource usage
- Modular architecture
- Explainable logic
- Offline demo support

---

# Success Metrics

- Detect reconnaissance
- Reconstruct sessions
- Real-time updates
- Demonstrate attack flow

---

# Constraints

- 10-day duration
- Rule-based detection
- Controlled environment
- No AI dependency

---

# Future Scope

- GeoIP
- MITRE ATT&CK
- Canary Tokens
- Email alerts
- Multiple sensors
- Plugin architecture
