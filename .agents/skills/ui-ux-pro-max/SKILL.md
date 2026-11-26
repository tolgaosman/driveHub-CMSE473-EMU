---
name: ui-ux-pro-max
description: >-
  Comprehensive UI/UX design intelligence system covering product-matched visual
  styles, color systems, typography pairings, UX priority hierarchy, accessibility,
  responsive & touch ergonomics, data visualization, and framework patterns
  (React, Next.js, Tailwind, shadcn/ui). Use when planning, designing, or auditing
  interfaces and design systems.
---

# UI/UX Pro Max — Design Intelligence & System Generator

`ui-ux-pro-max` provides a structured, priority-ranked design system methodology so every interface balances visual excellence with usability, accessibility, and engineering clarity.

## 1. UX Priority Hierarchy (Strict Order)

When trade-offs arise, resolve them strictly in this priority order:
1. **Accessibility & Legibility (P0):** Contrast ratios, keyboard navigation, semantic landmarks, readable font sizes, screen-reader labels.
2. **Clarity & Task Completion (P1):** Clear primary CTA, scannable hierarchy, intuitive navigation, immediate system feedback.
3. **Touch, Pointer & Responsive Ergonomics (P2):** Minimum `44x44px` touch targets, thumb-zone mobile actions, zero horizontal overflow, clean breakpoints.
4. **Performance & Layout Stability (P3):** Zero cumulative layout shift (CLS), crisp skeleton states, fast perceived response.
5. **Visual Style & Delight (P4):** Brand personality, surface depth, tasteful motion, micro-interactions.

## 2. Domain-Matched Style Selection

Choose a style family that fits the product domain instead of defaulting to one template:
- **SaaS / Productivity / Booking Platforms:** Clean Swiss/Linear minimalism — high-contrast neutral canvas, subtle 1px hairlines, dense scannable tables/calendars, single confident primary accent.
- **Marketplace / Consumer Discovery (e.g., Driving Schools, Rentals, Travel):** Warm Editorial + Bento Cards — crisp photography, clear trust signals (ratings, verified badges, transparent pricing), frictionless filter bar, sticky booking summary.
- **Analytics / Telemetry / Admin:** Utilitarian Data-First — tabular numerals, restrained semantic chart palette (max 4–5 series colors), clear KPI deltas, filterable views.
- **Editorial / Portfolio / Showcase:** Expressive Typography + Asymmetric Grid — bold display scale, generous whitespace, curated color moments.

## 3. Design System Blueprint (Define Before Building)

1. **Color Palette:**
   - Neutral scale (`50` to `950`) with consistent undertone.
   - 1 Primary brand accent + hover/active shades.
   - Semantic tokens: `success`, `warning`, `destructive`, `info` (always paired with text/icon—never color alone).
2. **Typography Scale:**
   - Display (`36px–60px`), H1 (`28px–36px`), H2 (`22px–26px`), H3 (`18px–20px`), Body (`15px–16px`), Small (`13px–14px`), Micro/Label (`11px–12px`).
3. **Spacing & Elevation:**
   - Strict `4px` base grid (`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`).
   - 3 elevation tiers: Base Canvas, Surface Card, Floating Overlay (popover/modal/toast).
4. **Component State Matrix:**
   - Every interactive control must define: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `error`, and `empty`.

## 4. Forms, Flows & Navigation UX Rules

- **Progressive Disclosure:** Break complex multi-field forms into logical steps or collapsible sections; show clear step progress.
- **Inline Validation:** Validate on blur/submit (not aggressively on the first keystroke); place error messages directly beneath the offending field with `aria-describedby`.
- **Destructive Safety:** Require confirmation (or undo toast) for irreversible actions; visually distinguish destructive buttons from primary actions.
- **Filter & Search Ergonomics:** Persist filter state in URL query parameters where practical so views are shareable and survive refresh.

## 5. Data Visualization & Charts

- Pick the simplest accurate chart: Line (trends over time), Bar (categorical comparison), Stacked Bar (composition), Scatter (correlation). Avoid 3D charts and cluttered pie charts (>5 slices).
- Label axes, units, and hover tooltips clearly using `tabular-nums`.

## 6. Pre-Ship UX Audit Checklist

- [ ] Contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text & UI borders.
- [ ] Full keyboard operability with visible focus rings.
- [ ] All interactive targets ≥ 44×44px on touch viewports.
- [ ] Empty, loading, and error states designed for every async view.
- [ ] Mobile (`375px`), tablet (`768px`), and desktop (`1440px`) layouts verified with zero horizontal scroll.

