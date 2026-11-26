---
name: anthropic-security-audit
description: >-
  Comprehensive security audit methodology for web applications and LLM/AI integrations
  (Anthropic Claude API, OWASP Top 10 for Web & LLMs, secrets hygiene, threat modeling,
  and remediation reporting). Use when asked to perform a security audit, threat model,
  or vulnerability assessment.
---

# Anthropic Security Audit & Assessment Guide

This skill provides a rigorous, structured methodology for auditing applications—covering both **LLM/AI-specific risks (OWASP Top 10 for LLMs)** and **general web/API security (OWASP Top 10)**.

## 1. LLM & AI Integration Security (OWASP Top 10 for LLMs)

Evaluate every point where user input, retrieved context, or external tools interact with a model:

- **LLM01 — Prompt Injection (Direct & Indirect):**
  - Check whether untrusted user input or external documents (RAG, web pages, emails) are interpolated raw into system prompts.
  - *Mitigation:* Strictly separate system instructions from user data using clear XML delimiters (e.g., `<user_input>...</user_input>`), enforce schema-validated structured outputs, and never trust model output to override authorization checks.
- **LLM02 — Insecure Output Handling:**
  - Check if LLM responses are passed into `eval()`, `dangerouslySetInnerHTML`, SQL queries, shell commands, or template engines.
  - *Mitigation:* Treat all model output as untrusted input; apply context-appropriate escaping, allowlists, and strict schema validation (Zod/Pydantic).
- **LLM03 — Training & RAG Data Poisoning:**
  - Verify provenance, sanitization, and access controls on fine-tuning corpora and vector database documents.
- **LLM04 — Model Denial of Service & Cost Exhaustion:**
  - Verify per-user/IP rate limits, `max_tokens` caps, request timeouts, input length caps, and circuit breakers on LLM endpoints.
- **LLM05 — Supply Chain Vulnerabilities:**
  - Audit LLM SDKs, agent frameworks, MCP servers, and third-party prompt templates for pinned versions and known CVEs.
- **LLM06 — Sensitive Information Disclosure:**
  - Verify whether PII, credentials, tokens, or private tenant data are sent to external LLM APIs or leaked across tenant boundaries in RAG retrieval.
  - *Mitigation:* Redact/mask PII before model calls; enforce tenant-scoped metadata filters in vector queries.
- **LLM07 — Insecure Plugin / Tool Design:**
  - Verify every tool exposed to an LLM validates parameters strictly, enforces least privilege, and checks the calling user's session permissions server-side.
- **LLM08 — Excessive Agency:**
  - Ensure destructive or state-mutating operations (`DELETE`, payments, permission changes, shell execution) require explicit human-in-the-loop confirmation.
- **LLM09 — Overreliance:**
  - Confirm mission-critical deterministic decisions (authentication, authorization, pricing, billing, access control) are implemented in deterministic code, not delegated to an LLM.
- **LLM10 — Model / System Prompt Theft:**
  - Ensure proprietary prompts, internal schemas, or secrets are never stored in client-side bundles or leaked via verbose error responses.

## 2. API Keys & Secrets Management

- Scan the repository and git history for committed `.env` files, Anthropic keys (`sk-ant-api03-*`), OpenAI keys (`sk-*`), JWT secrets, DB connection strings, and cloud credentials.
- Confirm **zero client-side LLM calls**: all model API calls must be proxied through an authenticated backend.
- Verify key scoping, rotation procedures, and environment separation (dev/staging/prod).

## 3. Web & Application Security (OWASP Top 10)

- **A01 Broken Access Control:** Verify authentication and object-level authorization (IDOR prevention) on every endpoint, server action, and WebSocket handler.
- **A02 Cryptographic Failures:** Verify strong password hashing (`Argon2id` or `bcrypt`), TLS/HTTPS enforcement, secure cookie flags (`HttpOnly`, `Secure`, `SameSite`), and no weak hashes (`MD5`/`SHA1`) for security purposes.
- **A03 Injection (SQLi, NoSQLi, XSS, Command Injection, SSRF):** Verify parameterized queries/ORM bindings, output encoding, URL allowlisting for outbound fetches, and no unvalidated shell interpolation.
- **A04 Insecure Design:** Review threat model, abuse cases, race conditions (TOCTOU), and business-logic invariants.
- **A05 Security Misconfiguration:** Verify production error redaction, CORS restrictions (no wildcard `*` with credentials), and security headers (`CSP`, `HSTS`, `X-Content-Type-Options`, `X-Frame-Options` / `frame-ancestors`).
- **A06 Vulnerable & Outdated Components:** Audit `package.json`, lockfiles, `requirements.txt`, or container base images for known CVEs.
- **A07 Auth & Session Failures:** Check brute-force protection, MFA/token expiration, refresh token rotation, and session invalidation on logout/password reset.
- **A08 Software & Data Integrity:** Verify webhook signature validation (HMAC), CI/CD pin hygiene, and deserialization safety.
- **A09 Logging & Monitoring:** Verify security events (auth failures, privilege changes) are logged without leaking secrets or raw PII.

## 4. Audit Execution Methodology

1. **Reconnaissance:** Map the stack, entry points, trust boundaries, auth flows, data stores, and external/LLM integrations.
2. **Automated & Static Pattern Search:** Search for dangerous sinks (`eval`, `new Function`, `innerHTML`, `dangerouslySetInnerHTML`, `child_process`, `exec`, raw SQL interpolation, `sk-ant-`, `verify=False`, `rejectUnauthorized: false`).
3. **Data-Flow Tracing:** Trace untrusted input end-to-end (Client → API → AuthZ → DB/LLM → Response → DOM).
4. **Prioritized Reporting:** Produce a structured report (`security_audit_report.md`) grouping findings by **Critical / High / Medium / Low / Informational**.

## 5. Required Deliverables

For every finding include:
- **ID & Severity** (with CVSS-style impact/likelihood rationale)
- **Exact Location** (`file:line`)
- **Exploit Scenario / Proof of Concept**
- **Concrete Remediation Patch** (exact code fix + verification test)

