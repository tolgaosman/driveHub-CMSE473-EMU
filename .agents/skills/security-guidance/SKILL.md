---
name: security-guidance
description: >-
  Proactive secure-coding guardrails embedded during feature implementation:
  input validation, auth/authz enforcement, secret hygiene, XSS/SQLi/SSRF
  prevention, secure headers, file upload safety, and dependency hygiene.
  Use whenever writing backend endpoints, auth flows, database queries, or
  handling untrusted user input.
---

# Security Guidance — Proactive Secure Coding Guardrails

Unlike a post-hoc audit, `security-guidance` applies secure-by-default engineering practices *while* writing code so vulnerabilities are never introduced in the first place.

## 1. Input Validation & Boundary Hygiene

- **Validate at Every Trust Boundary:** Validate and coerce all incoming request bodies, query params, route params, headers, and webhook payloads using a strict schema validator (e.g., Zod, Joi, Pydantic) before business logic executes.
- **Allowlist Over Denylist:** Validate enums, file extensions, redirect URLs, and sort columns against explicit allowlists.
- **Prevent Mass Assignment:** Explicitly pick allowed fields when creating or updating database records—never pass raw `req.body` directly into an ORM `create()`/`update()`.

## 2. Authentication & Authorization

- **Deny by Default:** Protect routes centrally via middleware/guards; explicitly mark public routes.
- **Object-Level Authorization (Prevent IDOR):** On every `GET/PUT/PATCH/DELETE /resource/:id`, verify that the authenticated user owns the resource or holds the required role (`WHERE id = $1 AND user_id = $2`).
- **Passwords & Tokens:**
  - Hash passwords with `Argon2id` or `bcrypt` (cost ≥ 12).
  - Store session tokens in `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict`) cookies; avoid storing long-lived access tokens in `localStorage` when cookie sessions are viable.
  - Use constant-time comparison (`crypto.timingSafeEqual`) for secrets, HMAC signatures, and tokens.

## 3. Injection & Execution Safety

- **Database Queries:** Always use parameterized queries or safe ORM query builders. Never concatenate user input into SQL, NoSQL filters, or `ORDER BY` clauses.
- **XSS Prevention:** Rely on framework auto-escaping; avoid `dangerouslySetInnerHTML`, `innerHTML`, or `v-html`. If rich HTML is required, sanitize strictly with DOMPurify. Never construct `javascript:` URLs from user input.
- **Command & Path Safety:** Never pass user input to `exec`/`sh -c`; use `execFile`/`spawn` with argument arrays. For file paths, resolve canonical paths and assert `resolved.startsWith(baseDir)` to prevent path traversal (`../`).
- **SSRF Prevention:** When fetching user-supplied URLs server-side, restrict protocol to `https:`, block private/loopback/link-local IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `169.254.169.254`, `::1`), and disable unsafe redirects.

## 4. Secrets, Errors & Headers

- **Zero Secrets in Code:** Load secrets strictly from environment variables; keep `.env*` out of git (verify `.gitignore`) and provide `.env.example` with placeholders only.
- **Safe Error Responses:** Return generic error messages to clients in production; log structured details server-side without logging passwords, tokens, or raw PII.
- **HTTP Security Headers:** Configure `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and explicit CORS origin allowlists.
- **Rate Limiting:** Apply rate limits to login, registration, password reset, OTP, and expensive/AI endpoints.

## 5. File Upload Safety

- Enforce strict max file size limits, validate both MIME type and magic bytes, rename uploaded files to random UUIDs, and store outside executable web roots (e.g., object storage with `Content-Disposition: attachment` or isolated CDN domain).

