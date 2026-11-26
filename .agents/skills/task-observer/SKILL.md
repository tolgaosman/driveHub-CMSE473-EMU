---
name: task-observer
description: >-
  Execution monitoring, scope-drift detection, requirement traceability, and
  milestone verification skill. Use during complex, multi-step tasks to track
  progress against the original user requirements, prevent silent scope creep,
  and audit completeness before finishing.
---

# Task Observer — Execution Monitoring & Scope Integrity

`task-observer` acts as a disciplined internal watchtower during complex or long-running tasks—keeping execution aligned with the user's exact requirements, catching drift early, and verifying every deliverable.

## 1. Requirement Baseline Capture

At the start of a multi-step task, extract and pin a crisp **Requirement Contract**:
- **Explicit Goals:** Every concrete deliverable the user asked for.
- **Constraints:** Tech stack, formatting, performance, security, or scope boundaries.
- **Non-Goals / Out-of-Scope:** Adjacent refactors or features NOT requested (do not touch unless required).
- **Acceptance Criteria:** Objective checks that prove each goal is satisfied.

## 2. Continuous Drift & Risk Checkpoints

Pause briefly at every major milestone (after planning, after core implementation, before final reply) and check:
1. **Scope Drift Check:** Have edits strayed into unrelated files or unrequested refactors? If yes, revert or isolate them.
2. **Assumption Check:** Did any silent assumption replace a missing requirement? If critical, surface it clearly or ask the user.
3. **Loop / Thrash Detection:** If the same command or fix fails twice in a row, stop repeating it—step back, inspect the underlying cause, and change strategy.
4. **Partial Completion Trap:** Check whether every item in a multi-item user list was actually handled (no silently skipped items).

## 3. Requirement Traceability Matrix

Before closing a complex task, mentally (or explicitly in the summary for large tasks) verify each requirement:

| Requirement | Status (`Done` / `Partial` / `Blocked`) | Artifact / File | Verification Evidence |
| :--- | :--- | :--- | :--- |
| Goal 1 | Done | `path/to/file` | Test / command output |

## 4. Escalation & Transparency Rules

- Never hide a failing test, skipped edge case, or missing dependency behind confident language.
- If blocked by missing credentials, external services, or conflicting requirements, report the exact blocker, what was already completed, and the minimal next step needed to unblock.
- Keep user progress updates concise, factual, and milestone-focused.

