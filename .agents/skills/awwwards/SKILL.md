---
name: awwwards
description: >-
  Award-caliber creative web craft scored against Awwwards judging criteria
  (Design 40%, Usability 30%, Creativity 20%, Content 10%), focusing on editorial
  typography, choreographed scroll/motion storytelling, spatial composition, and
  60fps technical polish. Use when building showcase landing pages, brand
  experiences, or high-impact marketing sites.
---

# Awwwards — Award-Caliber Creative Web Craft

This skill guides the creation of showcase-level web experiences judged against the four Awwwards evaluation pillars: **Design (40%)**, **Usability (30%)**, **Creativity (20%)**, and **Content (10%)**.

## 1. The Four Awwwards Pillars

### Design (40%)
- **Unmistakable Art Direction:** Bold typographic presence, disciplined color story, editorial grid alignment, and tactile surface detail.
- **Focal Choreography:** Every viewport height ("fold") should feel like a composed poster with a single dominant focal point and clean negative space.
- **Micro-Craft:** Hairline dividers, custom cursor/hover reveals (subtle, never obstructive), optical alignment, and museum-grade imagery framing.

### Usability (30%)
- **Creative Never Means Confusing:** Navigation must remain effortless, legible, and instantly understandable.
- **Performance Is UX:** Target smooth 60fps animations, fast First Contentful Paint, crisp responsive mobile layout, and full keyboard/reduced-motion accessibility.
- **Zero Scroll-Hijack Pain:** Enhance scrolling with subtle parallax, sticky reveals, or progress cues—never break native scroll physics or trap users.

### Creativity (20%)
- **Signature Interaction Moment:** Introduce 1–2 memorable, domain-relevant interactive moments (e.g., interactive bento showcase, kinetic typography reveal, smooth shared-layout transition, or tactile card/route explorer) rather than 15 disconnected gimmicks.
- **Unexpected Composition:** Break the standard SaaS template with editorial split-screens, oversized typographic anchors, horizontal showcase rails, or pinned narrative sections.

### Content (10%)
- **Sharp Editorial Copy:** Short, confident headlines paired with crisp, concrete subcopy. Zero generic AI buzzwords.
- **Visual Storytelling:** Use authentic imagery, live interactive product previews, and real domain metrics to prove value rather than empty marketing claims.

## 2. Motion & Scroll Choreography Patterns

- **Above-the-Fold Entrance:** Staggered mask-reveal (`clip-path` or `overflow-hidden` + `y: 100% -> 0%`) over `500–700ms` with smooth exponential ease-out (`cubic-bezier(0.19, 1, 0.22, 1)`).
- **Scroll-Driven Pacing:** Tie subtle transforms (`y`, `scale`, `opacity`) to scroll progress using `framer-motion` `useScroll` + `useTransform` or CSS scroll-driven animations—GPU-composited only.
- **Interactive Hover Micro-Theater:** Subtle image zoom (`scale(1.03)` inside `overflow-hidden`), directional arrow slide, or magnetic button feel (subtle 4–6px max displacement).

## 3. Awwwards Self-Scoring Gate (Target ≥ 8.0 / 10)

Before finalizing a showcase page, score honestly out of 10 on each pillar:
- **Design (40%):** Does the hero feel like a bespoke studio piece? Are typography, grid, and color cohesive?
- **Usability (30%):** Is navigation obvious, contrast accessible, mobile clean, and performance 60fps?
- **Creativity (20%):** Is there at least one genuinely memorable, domain-fitted visual or interactive moment?
- **Content (10%):** Is every headline and section concrete, authentic, and free of filler?

If any pillar scores below 8.0, iterate on that specific dimension before shipping.

