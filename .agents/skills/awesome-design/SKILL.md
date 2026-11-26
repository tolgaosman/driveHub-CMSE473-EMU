---
name: awesome-design
description: >-
  Design-system enforcer and brand-consistency craft guide covering semantic design
  tokens, component architecture, visual hierarchy, iconography, dark/light theme
  parity, and cohesive surface language. Use when establishing or scaling a design
  system across a project.
---

# Awesome Design — Design System & Brand Consistency Guide

This skill enforces cohesive, scalable design systems across an entire application so every page, modal, card, and control feels like part of one unified product.

## 1. Single Source of Truth: Design Tokens

Never hardcode ad-hoc colors, radii, or shadows inside individual components. Centralize tokens in a theme layer (CSS variables + Tailwind theme config):
- **Color Tokens:** `canvas`, `surface`, `surface-subtle`, `surface-elevated`, `ink-primary`, `ink-secondary`, `ink-muted`, `border-subtle`, `border-strong`, `brand`, `brand-hover`, `brand-subtle`, `success`, `warning`, `danger`, `info`.
- **Radius Tokens:** `radius-sm` (inputs/badges), `radius-md` (buttons/cards), `radius-lg` (modals/feature panels), `radius-full` (avatars/pills).
- **Shadow Tokens:** `shadow-xs` (controls), `shadow-sm` (cards), `shadow-md` (dropdowns), `shadow-lg` (modals/drawers).
- **Typography Tokens:** Font families (`--font-display`, `--font-sans`, `--font-mono`), sizes, weights, line heights, and tracking.

## 2. Visual Hierarchy Rules

- Every view has **one primary action** (solid brand fill), optional **secondary actions** (subtle outline or tinted fill), and **tertiary actions** (ghost/text link). Never place two competing primary solid buttons side-by-side.
- Separate content into clear scannable layers: Page Header → Key Metrics/Filters → Primary Content → Secondary Context.
- Maintain consistent vertical rhythm between headings, descriptions, and controls across every page.

## 3. Component System Architecture

Build composable, accessible primitives first, then assemble domain components:
1. **Primitives:** `Button`, `Input`, `Select`, `Badge`, `Card`, `Dialog`, `Drawer`, `Tabs`, `Toast`, `Tooltip`, `Skeleton`, `EmptyState`.
2. **Variant Discipline:** Expose explicit semantic variants (`variant="primary" | "secondary" | "ghost" | "destructive"`, `size="sm" | "md" | "lg"`) instead of arbitrary class overrides.
3. **Consistent Iconography:** Use a single icon set (e.g., Lucide) with uniform stroke width (`1.75`) and standardized sizes (`14px`, `16px`, `20px`, `24px`).

## 4. Light & Dark Theme Parity

When supporting both themes:
- Do not blindly invert colors—dark surfaces need slightly desaturated accents to avoid visual vibration.
- Elevate dark surfaces by stepping background lightness upward (`#0b0d10` → `#12151a` → `#1a1f26`) rather than relying on black drop shadows that disappear on dark backgrounds.
- Test contrast ratios independently in both modes.

## 5. Consistency Audit

Before merging new UI work, verify:
- All colors reference semantic tokens (zero random hex values in JSX).
- Border radii, padding, and button heights match existing screens.
- Empty states, loading skeletons, and error banners follow the same visual grammar as the rest of the app.

