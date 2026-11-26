---
name: web-design-guidelines
description: >-
  Audits web UI code against Vercel's Web Interface Guidelines covering
  accessibility, focus management, forms, typography, motion, layout, touch
  ergonomics, and performance. Reports concrete findings in concise `file:line`
  format. Use when reviewing UI code, checking accessibility, or auditing UX polish.
---

# Web Design Guidelines — Interface Audit & Compliance

This skill applies rigorous Web Interface Guidelines (modeled on Vercel's Web Interface Guidelines) to audit and fix frontend codebases.

## Audit Workflow

1. Identify all UI files in scope (components, pages, layouts, stylesheets).
2. Inspect each file systematically against the 8 guideline categories below.
3. Report every violation concisely in **`path/to/file.tsx:line — [Category] Issue → Fix`** format.
4. Apply fixes cleanly when requested and re-verify.

## 1. Accessibility & Semantics
- Use native `<button>` for actions and `<a href>` for navigation—never clickable `<div>` or `<span>` without full keyboard/ARIA parity.
- Provide `aria-label` on all icon-only buttons; hide decorative icons with `aria-hidden="true"`.
- Maintain strict heading hierarchy (`h1` once per page, no skipped levels).
- Provide explicit `<label htmlFor>` (or `aria-labelledby`) for every form control.
- Ensure modals/dialogs trap focus, close on `Escape`, and restore focus to the trigger element on close.

## 2. Focus & Keyboard Ergonomics
- Never remove focus outlines (`outline-none`) without providing a clearly visible `:focus-visible` replacement ring.
- Ensure custom menus, tabs, comboboxes, and lists support Arrow keys, `Home`/`End`, `Enter`/`Space`, and `Escape`.
- Include a "Skip to main content" link on multi-section layouts.

## 3. Forms & Inputs
- Set accurate `type`, `inputMode`, and `autoComplete` attributes (`email`, `tel`, `current-password`, `new-password`, `one-time-code`, etc.).
- Never disable paste on password or OTP fields.
- Keep submit buttons enabled or clearly explain why submission is blocked; show inline validation errors next to fields and focus the first invalid field on submit failure.
- Protect against double submission by disabling/locking during pending async requests with a clear loading indicator.

## 4. Typography & Content
- Use curly typographic quotes/apostrophes and proper ellipsis (`…`) in user-facing copy where appropriate; use non-breaking spaces (`&nbsp;`) to prevent awkward orphan units (`10&nbsp;km`, `₺500`).
- Apply `font-variant-numeric: tabular-nums` to dynamic numbers, prices, counters, and tables.
- Prevent text overflow on flexible rows (`min-w-0`, `truncate`, `break-words`).
- Use `text-wrap: balance` on headings and `text-wrap: pretty` on body paragraphs.

## 5. Animation & Motion
- Respect `prefers-reduced-motion: reduce` globally and per animation.
- Never use `transition: all`; transition explicit properties (`transform`, `opacity`, `color`, `background-color`).
- Keep UI animations snappy (150–300ms) and interruptible.

## 6. Layout, Scroll & Viewport
- Prevent layout shift: always specify `width`/`height` or `aspect-ratio` on images, videos, and skeletons.
- Prevent horizontal overflow (`overflow-x`) on narrow viewports (`320px–375px`).
- Use `overscroll-behavior: contain` on scrollable modals, drawers, and sidebars so background pages do not scroll accidentally.
- Use `dvh` / `svh` rather than buggy mobile `100vh` for full-height sheets and hero sections.

## 7. Touch & Pointer Ergonomics
- Ensure touch targets are at least `44×44px` (use expanded hit areas if visual icons are smaller).
- Do not hide essential actions exclusively behind `:hover` (provide visible or tap-accessible affordances on touch devices).
- Apply `touch-action: manipulation` to prevent accidental double-tap zoom delays on interactive controls.

## 8. Images, State & Performance
- Deep-link meaningful UI state (tabs, filters, pagination, search query) to URL params so reload/back-button works naturally.
- Lazy-load below-the-fold images (`loading="lazy"`) and prioritize above-the-fold hero images (`fetchPriority="high"`).
- Always provide meaningful `alt` text (or `alt=""` for purely decorative images).

