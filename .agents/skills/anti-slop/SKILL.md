---
name: anti-slop
description: >-
  Audits and eliminates generic AI-generated "slop" across UI design, UX copy,
  animations, and frontend code. Use whenever building or reviewing interfaces,
  landing pages, dashboards, or copy to strip cliché AI defaults and enforce
  authentic, human-crafted quality.
---

# Anti-Slop — Eliminating Generic AI Defaults

Default AI outputs fall into recognizable, low-trust clichés ("AI slop")—purple-indigo neon gradients, generic 3-column feature cards, robotic marketing copy, and amateur animations. This skill acts as an explicit quality filter to detect and eradicate slop before code ships.

## 1. Visual & Aesthetic Slop Blacklist

Reject and replace these clichés immediately unless the user explicitly requested them:

- **Color Clichés:**
  - Default purple/violet-to-blue gradients (`from-indigo-500 via-purple-500 to-pink-500`) on dark `#0f172a` backgrounds.
  - Glowing neon box-shadows (`shadow-purple-500/50`) around every card and button.
  - Pure `#000000` canvas paired with harsh `#ffffff` text and saturated primary accents.
- **Layout Clichés:**
  - Centered hero with a pill badge ("✨ Introducing..."), generic H1, 2-line subtitle, 2 buttons, followed by 3 identical icon-in-a-colored-square cards.
  - "Card-in-a-card-in-a-card" nesting where every minor text block is wrapped in a bordered rounded box.
  - Fake glassmorphism (`backdrop-blur` over flat solid backgrounds with nothing meaningful behind it).
  - Unmotivated decorative blobs/orbs floating behind text.
- **Typography Clichés:**
  - Unconfigured system/Inter defaults with uniform weights and flat hierarchy.
  - Oversized emoji bullets (`🚀`, `✨`, `🔥`, `💡`) acting as UI icons instead of crisp vector icons.

## 2. Copy & Microcopy Slop Blacklist

Eliminate hollow, robotic phrasing:
- **Banned Filler Words:** "Revolutionize", "Supercharge", "Unleash", "Elevate your workflow", "Seamless", "Cutting-edge", "Game-changer", "Next-generation", "Delve", "Empower", "Unlock the power of".
- **Fake Social Proof & Placeholder Trash:** Never ship "John Doe", "Acme Corp", "Lorem ipsum", or made-up "Trusted by 10,000+ companies" banners unless clearly marked as requested demo data.
- **Replacement Rule:** Write concrete, domain-specific copy that names real user actions, real constraints, and real outcomes (e.g., "Compare 42 verified instructors in Famagusta" instead of "Elevate your learning journey").

## 3. Motion & Interaction Slop Blacklist

- No `transition-all` (animate only specific GPU-friendly properties: `transform`, `opacity`, `color`, `background-color`, `border-color`).
- No bouncy `scale(0)` pop-ins for modals/tooltips/menus (start from `scale(0.95)` + `opacity: 0`).
- No slow, sluggish 600–1000ms UI transitions on everyday clicks (keep micro-interactions 120–240ms).
- No gratuitous scroll-jacking or continuous floating/pulsing animations that distract from reading.

## 4. Code & Component Slop Blacklist

- No giant monolithic 600-line single-file pages with hardcoded inline arrays when clean modular components and typed data models belong.
- No dead buttons, non-functional search inputs, or fake "Submit" forms that silently do nothing without clear feedback.
- No inconsistent spacing (`p-3` next to `p-5` next to `p-[18px]`) or conflicting border radii across sibling elements.

## 5. Anti-Slop Audit Checklist (Run Before Finishing)

1. **Squint Test:** Blur your eyes—does the page have one clear focal point and unmistakable hierarchy, or does it look like a generic SaaS template?
2. **Domain Authenticity Test:** If you swapped the logo, could this UI belong to any random AI startup? If yes, redesign using domain-specific visual cues, data density, and terminology.
3. **Copy Scan:** Search all visible strings for banned filler words and replace with specific, plain-language statements.
4. **Element Justification:** Pick 3 decorative elements and ask "what breaks if I delete this?" Delete anything that fails the test.
5. **State Completeness:** Confirm hover, focus, empty, loading, and error states are thoughtfully crafted—not left as browser defaults.

