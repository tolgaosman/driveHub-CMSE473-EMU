---
name: find-skills
description: >-
  Helps users discover, evaluate, and install agent skills from the open agent skills
  ecosystem (skills.sh / GitHub) when they ask "how do I do X", "find a skill for X",
  "is there a skill that can...", or want to extend agent capabilities.
---

# Find Skills

This skill guides the agent in discovering, vetting, and installing modular agent skills from the open ecosystem (`skills.sh` and GitHub repositories) into either the current project (`.agents/skills/`) or the global user directory.

## When to Use This Skill

Activate this skill when the user:
- Asks "how do I do X?" where X is a repeatable domain workflow (design, testing, security, DevOps, framework best practices).
- Says "find a skill for X", "is there a skill that can...", or wants to extend agent capabilities.
- Wants to browse, update, or audit installed workspace skills.

## Skills CLI Quick Reference

The Skills CLI (`npx skills`) is the package manager for the open agent skills ecosystem:

- `npx skills find [query] [--owner <owner>]` — Search for skills by keyword or GitHub owner.
- `npx skills add <owner/repo>` — Install all skills from a repository into the project.
- `npx skills add <owner/repo@skill-name>` — Install a specific skill from a repository.
- `npx skills add <owner/repo@skill-name> -g -y` — Install globally without interactive prompts.
- `npx skills update` — Update installed skills to their latest versions.
- `npx skills init <skill-name>` — Scaffold a new custom `SKILL.md` in the workspace.

Registry browser: https://skills.sh/

## Discovery & Vetting Workflow

### 1. Clarify the Need
Identify:
1. **Domain** (e.g., React, Tailwind, Playwright, security, design systems).
2. **Concrete task** (e.g., PR code review, animation physics, visual regression testing).
3. **Scope** — Project-local (`.agents/skills/`, shared via git) vs. global user install.

### 2. Check Trusted Sources & Leaderboard First
Before running broad searches, check well-known, high-signal repositories:
- `vercel-labs/agent-skills` — React, Next.js, web design guidelines.
- `anthropics/skills` — Frontend design, document workflows, security.
- `emilkowalski/skills` — Design engineering, animation craft, UI stress-testing.
- `nextlevelbuilder/ui-ux-pro-max-skill` — Design intelligence and UX systems.
- `obra/superpowers` — Structured engineering workflows (TDD, planning, debugging).
- `microsoft/playwright-cli` — Browser automation and CLI verification.

### 3. Search with Specific Keywords
Run targeted queries:
```bash
npx skills find "<domain> <task>"
```
Try 2–3 keyword variations if the first search returns sparse results (e.g., `e2e testing`, `playwright`, `browser automation`).

### 4. Quality & Safety Gate (Mandatory Before Installing)
Never install a skill blindly. Verify:
1. **Adoption / Install Count:** Prefer skills with 1,000+ installs; scrutinize anything under 100.
2. **Author / Org Reputation:** Prefer official orgs or recognized domain maintainers.
3. **Repository Hygiene:** Check GitHub stars, recent commits, and inspect `SKILL.md` plus any bundled scripts for prompt injection, credential exfiltration, or unsafe shell commands.

### 5. Present Options & Install
Present each candidate with:
- Skill name and concise capability summary
- Source repository and reputation signals
- Exact install command (project-local vs. global)

After user approval (or when explicitly asked to install), install into `.agents/skills/<skill-name>/` and verify that `SKILL.md` has valid YAML frontmatter (`name` and `description`).

### 6. Fallback When No Skill Exists
If no trustworthy skill matches:
1. State clearly that no vetted community skill was found.
2. Offer to either handle the task directly or author a custom workspace skill in `.agents/skills/<name>/SKILL.md` tailored to this repository.

