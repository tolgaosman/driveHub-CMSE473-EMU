---
name: code-review
description: >-
  Systematic pull-request and diff code review methodology covering correctness,
  edge cases, security, performance, architecture, maintainability, and test
  coverage. Produces actionable, severity-ranked feedback with exact `file:line`
  references. Use when asked to review code, PRs, commits, or diffs.
---

# Code Review — Systematic Engineering Review Guide

This skill switches the agent into a rigorous, constructive senior-engineer reviewer mode focused on catching real defects before they reach main.

## 1. Review Preparation

1. Inspect the full diff (`git diff`, `git status`, or PR files) plus surrounding context—never review isolated lines blindly.
2. Understand the **intent** of the change (feature, bugfix, refactor) and trace affected callers, types, and data flows.

## 2. Six-Axis Inspection Checklist

### A. Correctness & Edge Cases (Highest Priority)
- Off-by-one errors, null/undefined handling, empty arrays, timezone/locale bugs, floating-point currency math, race conditions, and async error propagation.
- State transitions: what happens on retry, cancel, partial failure, or duplicate submission?

### B. Security & Data Integrity
- Missing authentication or object-level authorization checks (IDOR).
- Injection vectors (SQL, XSS, command injection, path traversal, SSRF).
- Exposed secrets, overly permissive CORS, unvalidated user/webhook payloads, or mass-assignment vulnerabilities.

### C. Architecture & Maintainability
- Clear separation of concerns, cohesive module boundaries, appropriate abstractions (avoid both god-functions and premature over-abstraction).
- Naming clarity, type safety (avoid unsafe `any` / unchecked casts), and dead code or leftover debug statements.

### D. Performance & Resource Hygiene
- N+1 database queries, missing pagination/limits, unbounded memory growth, redundant re-renders in React, or missing memoization/debouncing on hot paths.
- Unclosed streams, timers, event listeners, or DB connections.

### E. API, Schema & Backward Compatibility
- Breaking changes to REST/GraphQL payloads, DB migrations (reversible? safe with existing rows?), or shared component props.

### F. Test Coverage & Verifiability
- Are happy paths, boundary cases, and error paths tested?
- Do tests assert real behavior rather than brittle implementation details?

## 3. Structured Review Output Format

Group findings by severity—never bury a critical bug inside a wall of nitpicks:

- **🔴 Blocker / Critical:** Bugs, data loss, security vulnerabilities, or broken builds that MUST be fixed before merge.
- **🟠 Major:** Significant edge cases, performance regressions, architectural flaws, or missing critical tests.
- **🟡 Minor / Suggestion:** Cleanups, readability improvements, or safer idioms.
- **🟢 Nit (Optional):** Pure style preferences (keep minimal).

For every finding, provide:
1. **`path/to/file.ts:line`** — Exact location.
2. **Why it matters** — Concrete failure scenario or risk.
3. **Suggested fix** — Minimal code snippet or clear direction.

Conclude with a clear **Verdict** (`Approve`, `Approve with minor comments`, or `Request changes`) and a brief summary of what looks solid.

