---
name: superpowers
description: >-
  Structured, high-discipline software engineering workflow (inspired by
  obra/superpowers): brainstorming & specification before coding, bite-sized
  implementation planning, strict Test-Driven Development (TDD), systematic
  root-cause debugging, subagent-driven execution, and verification-before-completion.
  Use for non-trivial features, refactors, and bug investigations.
---

# Superpowers — Disciplined Agentic Software Engineering

`superpowers` replaces ad-hoc "jump straight into editing" habits with a repeatable, evidence-driven engineering lifecycle.

## 1. Brainstorming & Spec First (Before Writing Code)

For any non-trivial feature or architectural change:
1. Clarify requirements, constraints, edge cases, and non-goals before touching production files.
2. Explore 2–3 concrete design options with explicit trade-offs and recommend the simplest clean architecture (YAGNI).
3. Document a concise design specification: data models, API/component boundaries, error handling, and acceptance criteria.

## 2. Bite-Sized Implementation Planning

Break the approved design into small, independently verifiable tasks (each taking 2–10 minutes of work):
- Name the exact files to create or modify.
- Specify the exact test or verification command for each step.
- Order tasks so the codebase stays buildable and green after every milestone.

## 3. Strict Test-Driven Development (Red → Green → Refactor)

Whenever writing business logic, API endpoints, utilities, or bug fixes:
1. **RED:** Write a minimal failing test that captures the required behavior or reproduces the bug. Run it and confirm it fails for the right reason.
2. **GREEN:** Write the minimal clean implementation needed to make the test pass.
3. **REFACTOR:** Clean up duplication, naming, and structure while keeping all tests green.
- Never delete or weaken an existing test just to make a build pass.

## 4. Systematic Root-Cause Debugging

Never apply blind "shotgun fixes" to symptoms:
1. **Reproduce:** Get a reliable, minimal reproduction and capture the exact error/stack trace.
2. **Isolate:** Narrow down the exact boundary where actual state diverges from expected state (logs, assertions, git bisect, targeted unit tests).
3. **Hypothesize & Verify:** State one clear root-cause hypothesis and verify it with evidence before editing.
4. **Fix & Guard:** Fix the root cause (not just the symptom) and add a regression test so the bug cannot silently return.

## 5. Subagent-Driven Parallel Execution

For independent workstreams (e.g., separate modules, parallel research, or independent review passes):
- Give each subagent a self-contained brief with explicit file ownership and done criteria.
- Review subagent diffs for both **spec compliance** and **code quality** before integrating.

## 6. Verification Before Completion (Iron Law)

**Never claim a task is fixed, built, or passing without fresh verification evidence.**
- Run the actual test suite, typecheck, linter, and build commands *after* your final edit.
- Inspect the real command output—no assumptions, no "should pass now".
- Report both what passed and any remaining caveats or untested areas honestly.

