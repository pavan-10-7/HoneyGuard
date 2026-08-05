# Why HoneyGuard?

## Executive Summary
HoneyGuard is a lightweight, web-first deception and attack intelligence platform designed for developers, educators, and small security teams. Instead of emulating infrastructure services like SSH or FTP, HoneyGuard focuses on detecting and reconstructing reconnaissance against modern web applications.

---

# Problem

Modern web applications are continuously scanned for:

- Hidden admin panels
- Backup files
- Exposed configuration files
- Debug endpoints
- Sensitive APIs

Traditional applications return 403/404 responses but rarely explain attacker behavior.

---

# Existing Solutions

| Solution | Strengths | Limitations |
|-----------|-----------|-------------|
| Cowrie | SSH/Telnet honeypot | Infrastructure-focused |
| OpenCanary | Easy deployment | Limited visualization |
| T-Pot | Comprehensive honeypot suite | Heavyweight |
| Canarytokens | Tripwire notifications | Minimal attack context |
| Enterprise Deception Platforms | Powerful | Expensive and complex |

---

# Gap Analysis

Current tools are designed primarily for security teams.

Missing areas:

- Developer-friendly deployment
- Web-first deception
- Attack reconstruction
- Explainable threat scoring
- Educational visualization

---

# HoneyGuard Value Proposition

HoneyGuard focuses on:

1. Web application deception
2. Attack session reconstruction
3. Explainable rule-based detection
4. Real-time visualization
5. One-command deployment

---

# Core Differentiators

## Web-first
Purpose-built for web/API applications.

## Attack Story
Convert multiple requests into a readable attack timeline.

## Explainable Threat Score
Every score shows why it was assigned.

## Lightweight
Runs locally using Docker Compose.

---

# Target Users

Primary
- Developers
- Cybersecurity students
- Security researchers
- Small organizations

Secondary
- Blue Teams
- SOC Analysts

---

# Industry Relevance

Supports practical learning in:

- Detection Engineering
- Threat Analysis
- Web Security
- Secure Software Engineering
- DevSecOps
- Docker
- FastAPI
- React

---

# Feasibility

10-day MVP focuses on:

- Decoy endpoints
- Telemetry
- Session correlation
- Threat scoring
- Dashboard
- Attack timeline

Future enhancements remain out of scope.
