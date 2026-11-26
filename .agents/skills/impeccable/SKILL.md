---
name: impeccable
description: >-
  High-craft frontend art direction, visual polish, and design verification system
  (inspired by Paul Bakaus's Impeccable framework). Use when building, redesigning,
  or auditing user interfaces to enforce intentional visual hierarchy, typographic
  rigor, surface craft, and strict anti-generic quality gates.
---

# Impeccable — High-Craft Frontend Art Direction & Verification

`impeccable` elevates frontend output from "functional mockup" to intentional, studio-grade product design through explicit art direction, bounded design tokens, and repeatable visual/functional audits.

## Core Philosophy

1. **Intentional Art Direction First:** Never open an editor without naming the visual concept, emotional register, primary focal point, and structural rhythm.
2. **Subtraction Over Decoration:** Every border, shadow, gradient, badge, and animation must earn its pixel budget. If removing an element improves clarity, remove it.
3. **Visual Authority Through Restraint:** High contrast in hierarchy (scale, weight, space) beats high noise (excess colors, competing cards, glowing borders).
4. **Verify What You Render:** Code is not the deliverable—the rendered interface across viewports and states is.

## Phase 1: Art Direction Brief (Before Coding)

Establish and document four decisions before writing layout code:
1. **Aesthetic Thesis:** One sentence defining the product's visual character (e.g., "Precision automotive telemetry — crisp monochrome surfaces, tabular numerals, high-signal amber accents").
2. **Surface & Depth Grammar:** Choose one coherent system:
   - Flat editorial (hairline rules + tonal surface steps), OR
   - Subtle layered elevation (soft translucent shadows + crisp 1px rgba borders), OR
   - Tactile dark studio (deep neutral canvas, controlled specular highlights, zero neon mud).
3. **Type Hierarchy:** Pair at most 2 typefaces (e.g., expressive geometric/grotesk display + ultra-legible UI sans, or editorial serif + crisp sans + monospace for metrics). Define exact scale ratios and line heights.
4. **Color Budget (60 / 30 / 10 Rule):**
   - 60% neutral canvas & primary surfaces
   - 30% secondary surfaces, borders, and body ink
   - 10% single disciplined brand accent + semantic status colors (success, warning, danger)

## Phase 2: Execution Standards

### Typography & Micro-Craft
- Use optical alignment and tight tracking (`-0.02em` to `-0.04em`) on large display headings; generous line-height (`1.5`–`1.65`) on body copy.
- Enforce `font-variant-numeric: tabular-nums` on all counters, prices, timers, and data tables.
- Limit prose measure to `55ch`–`72ch` and apply `text-wrap: balance` on headlines and `text-wrap: pretty` on paragraphs.

### Spatial Rhythm & Composition
- Use a strict 4px/8px spacing scale. Group related controls tightly; separate distinct sections generously.
- Break out of monotonous "3 equal cards in a grid" layouts: use asymmetric bento ratios, editorial split-screens, sticky context rails, or full-bleed bands with structured inner grids.
- Align every edge to an invisible column grid—avoid random padding overrides.

### Component Polish
- Style **all interactive states**: default, hover, active/pressed, focus-visible, disabled, loading, empty, and error.
- Prefer soft semi-transparent borders (`rgba(0,0,0,0.08)` / `rgba(255,255,255,0.10)`) over harsh solid hex borders.
- Keep icons from a single consistent stroke weight and library; optically center icons inside buttons and badges.

## Phase 3: Impeccable Polish & Audit Pass

After initial implementation, run five targeted refinement passes:
1. **Distill Pass:** Remove redundant containers, double borders, unnecessary badges, and filler copy.
2. **Clarify Pass:** Verify the user can identify the page purpose and primary CTA within 2 seconds.
3. **Typography & Contrast Pass:** Verify WCAG AA contrast (≥4.5:1 body, ≥3:1 large text/UI controls) in both light and dark modes.
4. **Edge-Case Stress Pass:** Test long strings, missing avatars/images, zero-data empty states, and 375px / 768px / 1440px viewports.
5. **Motion & Tactility Pass:** Ensure transitions are crisp (150–250ms), purposeful, interruptible, and respect `prefers-reduced-motion`.

## Output Expectations

When reviewing or polishing an existing UI under this skill, report concrete before/after improvements grouped by **Visual Hierarchy**, **Typography**, **Surface & Color**, **Layout & Rhythm**, and **Interaction Polish**.

