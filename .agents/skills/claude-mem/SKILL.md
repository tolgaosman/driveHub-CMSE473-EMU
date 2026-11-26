---
name: claude-mem
description: >-
  Persistent cross-session project memory and context continuity workflow
  (inspired by thedotmack/claude-mem). Captures architectural decisions,
  session observations, recurring pitfalls, and progressive-disclosure recall
  indexes so agents never lose project context between sessions. Use when
  starting/ending significant sessions or recording durable project knowledge.
---

# Claude-Mem — Persistent Project Memory & Context Continuity

`claude-mem` solves cross-session amnesia by maintaining structured, high-signal, compressed project memory that stays lightweight in context and easy to retrieve on demand.

## 1. Memory Storage Convention

Store durable, project-scoped memory in `.agents/memory/` (or a dedicated `MEMORY.md` index):
- `.agents/memory/INDEX.md` — Compact table of contents (1–2 lines per entry with topic, date, and file link) loaded quickly at session start.
- `.agents/memory/decisions.md` — Architecture Decision Records (ADRs): what was chosen, why, and what alternatives were rejected.
- `.agents/memory/observations.md` — High-signal technical discoveries (env quirks, schema gotchas, API constraints, bug root causes).
- `.agents/memory/sessions/YYYY-MM-DD-<slug>.md` — Compressed end-of-session summaries for major milestones.

## 2. Progressive Recall Protocol (3-Layer Retrieval)

To avoid bloating the context window, retrieve memory progressively:
1. **Layer 1 (Index Scan):** Read `.agents/memory/INDEX.md` first (~50–100 lines max) to see what historical knowledge exists.
2. **Layer 2 (Targeted Lookup):** Open only the specific memory entries relevant to the current task.
3. **Layer 3 (Code Verification):** Always verify remembered file paths, symbols, or behaviors against the live codebase before relying on them (code is truth; memory is a guide).

## 3. Structured Observation Capture

When capturing a new memory entry, keep it concise, factual, and searchable using this template:
```markdown
### [YYYY-MM-DD] <Short Descriptive Title>
- **Type:** decision | bugfix | constraint | architecture | workflow
- **Files:** `path/to/file.ts`
- **Context:** What problem or requirement triggered this.
- **Finding / Decision:** The exact technical fact or choice made.
- **Why / Trade-off:** Reasoning so future sessions do not accidentally revert it.
```

## 4. What to Record vs. What to Skip

- **DO Record:** Architectural choices, non-obvious bug root causes, database/API invariants, user workflow preferences, environment/build gotchas, and completed milestone summaries.
- **DO NOT Record:** Trivial typos, temporary debug prints, raw command logs, secrets/API keys/passwords, or information already obvious from a 2-second file read.

## 5. Session Handoff Routine

At the end of a substantial work session (or when requested):
1. Summarize completed work, key files touched, verification status, and exact next steps.
2. Append any new durable decisions or pitfalls to `.agents/memory/` and update `INDEX.md`.
3. Prune or mark superseded entries as `[SUPERSEDED]` so memory stays accurate over time.

