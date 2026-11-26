---
name: taste
description: >-
  Design-taste engineering heuristics (design-taste-frontend) for making refined,
  high-craft UI micro-decisions across typography, color systems, spacing, visual
  rhythm, and component proportions. Use when designing, building, or critiquing
  frontend interfaces.
---

# Taste — Design-Taste Frontend Heuristics

Great interfaces are rarely defined by one flashy trick; they are the compound result of dozens of disciplined micro-decisions. This skill encodes concrete visual-taste rules so generated interfaces feel designed by a senior product designer.

## 1. Typography Taste

- **Pairing Discipline:** Choose fonts with character that fit the product domain (e.g., Plus Jakarta Sans / Geist / Satoshi / Instrument Serif / JetBrains Mono). Never let display headings and body text share the exact same weight and tracking feel.
- **Scale & Tension:** Create clear contrast between display headings, section titles, body copy, and metadata labels. Avoid timid 2px differences (`16px` body vs `18px` heading).
- **Refinement Details:**
  - Tighten letter-spacing on large headings (`-0.025em` to `-0.04em`).
  - Slightly widen letter-spacing (`+0.04em` to `+0.08em`) on tiny uppercase eyebrows/labels (`11px–12px`).
  - Use `tabular-nums` for numbers in tables, prices, KPIs, and clocks.
  - Pair dark primary text (`#111315` / `#18181b`) with muted secondary text (`#52525b` / `#64748b`) rather than flat pure black everywhere.

## 2. Color & Surface Taste

- **Tinted Neutrals Beat Pure Grays:** Add a subtle cool or warm undertone (2–5% saturation) to grays so the entire palette harmonizes with the brand accent.
- **Layered Surfaces:** Distinguish background canvas, elevated cards, recessed inputs, and hover states by 2–4% lightness steps rather than heavy outlines.
- **Hairline Borders & Soft Shadows:**
  - Prefer `1px solid rgba(0, 0, 0, 0.08)` (light) or `1px solid rgba(255, 255, 255, 0.09)` (dark).
  - Use multi-layered, low-opacity shadows (tight contact shadow + wide ambient shadow) instead of a single muddy drop shadow.
- **Accent Restraint:** Reserve the primary accent color for primary actions, active states, and key focal highlights. Overusing the accent destroys its signal value.

## 3. Proportion, Radius & Alignment Taste

- **Concentric Border Radii:** When nesting a rounded element inside a rounded container, match curvature mathematically: `innerRadius = max(0, outerRadius - padding)`.
- **Optical Alignment:** Icons with triangular play glyphs or asymmetrical silhouettes need 1–2px optical nudging to look centered.
- **Whitespace as Structure:** Use generous outer margins and section gaps to create breathing room; keep tightly related labels and values close together (Law of Proximity).
- **Information Density Calibration:**
  - Marketing/landing pages: generous whitespace, bold storytelling, high contrast.
  - Dashboards/tools: compact, scannable rows, clear visual anchors, zero wasted chrome.

## 4. Imagery, Icons & Media Taste

- Never stretch, squash, or awkwardly crop photos—always enforce `object-cover` with intentional `aspect-ratio` containers.
- Add a subtle inner border (`ring-1 ring-inset ring-black/10` or `ring-white/10`) around avatars and thumbnails so light images never bleed into light backgrounds.
- Keep icon sizes proportional to text (`16px` for `14px` text, `20px` for `16px` text) with consistent stroke width (`1.5px` or `1.75px`).

## 5. Interactive Taste

- Every clickable element must give immediate tactile feedback (subtle background shift, hairline contrast lift, or `active:scale-[0.98]` micro-press).
- Tooltips, dropdowns, and modals should feel anchored to their trigger with subtle directional origin—not teleporting abruptly.
- Preserve layout stability: never let hover states, loading spinners, or validation errors cause surrounding content to jump.

