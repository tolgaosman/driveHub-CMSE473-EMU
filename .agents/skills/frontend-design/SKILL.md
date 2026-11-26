---
name: frontend-design
description: >-
  Anthropic-style frontend design skill for creating distinctive, production-grade
  web interfaces with bold aesthetic direction, intentional typography, cohesive
  CSS variable theming, and memorable spatial composition instead of generic
  boilerplate. Use when building pages, landing screens, dashboards, or components.
---

# Frontend Design — Distinctive, Production-Grade UI

This skill directs the agent to design and implement web interfaces with a clear, memorable visual point of view rather than falling back to bland, unstyled templates.

## 1. Design Thinking Before Code

Before writing HTML/JSX/CSS, explicitly decide:
1. **Purpose & Audience:** What exact problem does this screen solve, and who is using it?
2. **Aesthetic Direction:** Commit to a clear visual direction tailored to the domain (e.g., editorial minimalism, high-precision utilitarian dashboard, warm tactile studio, bold industrial-swiss grid, refined luxury, or kinetic showcase). Avoid timid middle-ground defaults.
3. **Signature Detail:** Define 1–2 memorable visual motifs (e.g., crisp architectural grid lines, custom typographic numeral display, refined layered cards, or tactile interactive controls) that anchor the brand identity.
4. **Technical Fit:** Match the project's existing stack (React, Next.js, Tailwind, CSS Modules, vanilla CSS) cleanly with zero unnecessary dependencies.

## 2. Typography & Hierarchy

- **Intentional Font Choices:** Select expressive, legible font pairings (display + body + optional monospace for code/metrics) and load them cleanly.
- **Clear Scale & Weight Contrast:** Establish an unmistakable hierarchy across Display, H1–H3, Lead, Body, Caption, and Overline.
- **Readable Measure:** Constrain long-form text widths (`max-w-prose` / `60ch–70ch`) and tune line-height and letter-spacing per level.

## 3. Cohesive Color & CSS Variable System

Define semantic design tokens at `:root` (and `.dark` if dark mode is supported) rather than scattering arbitrary hex values:
```css
:root {
  --bg-canvas: ...;
  --bg-surface: ...;
  --bg-elevated: ...;
  --text-primary: ...;
  --text-secondary: ...;
  --text-muted: ...;
  --border-subtle: ...;
  --border-strong: ...;
  --accent-primary: ...;
  --accent-foreground: ...;
}
```
- Commit to a dominant canvas + strong ink contrast + one disciplined accent.
- Ensure every foreground/background pair passes WCAG AA contrast.

## 4. Spatial Composition & Atmosphere

- **Intentional Layout:** Use asymmetric splits, structured CSS Grid compositions, full-bleed hero bands, sticky navigation/sidebars, and generous negative space rather than repetitive uniform grids.
- **Subtle Depth & Texture:** Use layered tonal elevation, crisp hairlines, subtle radial lighting, or fine noise/grid textures only where they reinforce the aesthetic—never heavy cluttered effects.
- **Responsive Architecture:** Design fluidly for mobile (`375px`), tablet (`768px`), and desktop (`1280px–1440px+`) from the start.

## 5. High-Impact Motion & Polish

- Focus animation budget on **high-impact moments**: coordinated page-load stagger (`animation-delay`), meaningful state transitions, and crisp hover/press micro-feedback.
- Keep all animations hardware-accelerated (`transform`, `opacity`) and respect `prefers-reduced-motion`.
- Deliver complete, working, semantically accessible markup (`<header>`, `<main>`, `<nav>`, `<section>`, proper heading order, labels, focus rings).

