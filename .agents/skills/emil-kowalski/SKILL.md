---
name: emil-kowalski
description: >-
  Design engineering principles, interaction craft, animation physics, and UI
  stress-testing inspired by Emil Kowalski (emilkowalski/skills: emil-design-eng,
  animate, review-animations, apple-design, break-ui). Use when crafting polished
  UI interactions, reviewing CSS/JS animations, or hardening components against
  real-world edge cases.
---

# Emil Kowalski — Design Engineering & Interaction Craft

This skill translates design-engineering intuition (Vercel, Linear, Sonner, Vaul, Apple HIG) into concrete engineering rules covering restraint, animation physics, tactile responsiveness, and UI resilience.

## 1. Design Engineering Restraint (`emil-design-eng`)

- **Details Are the Product:** Users feel quality through latency, focus behavior, border crispness, and scroll smoothness—not through decorative flourishes.
- **No Unnecessary Chrome:** Prefer subtle tonal contrast and 1px hairline borders (`rgba(0,0,0,0.08)` light / `rgba(255,255,255,0.1)` dark) over heavy boxes and thick borders.
- **Tactile Press Feedback:** Interactive buttons should respond immediately on press (`active:scale-[0.97]` with fast 100–150ms ease-out) so the interface feels physical and alive.
- **Origin-Aware Popovers:** Menus, tooltips, and dialogs should scale/translate from the edge or trigger they emerge from (`transform-origin`), never from an arbitrary center point.

## 2. Animation Rules & Physics (`animate` & `review-animations`)

### Easing Curves (Non-Negotiable)
- **Entering / Revealing Elements:** Use strong `ease-out` (e.g., `cubic-bezier(0.23, 1, 0.32, 1)` or `cubic-bezier(0.19, 1, 0.22, 1)`). Elements arrive quickly and settle smoothly.
- **Moving / Morphing On-Screen Elements:** Use `ease-in-out` (`cubic-bezier(0.77, 0, 0.175, 1)`).
- **Never use `ease-in` for UI entrances**—it feels sluggish and unresponsive.
- **Springs for Gestures & Drag:** Use physics springs when velocity from a pointer/touch gesture must carry over naturally (drawers, sheets, swipe-to-dismiss toasts).

### Scale, Duration & Frequency
- **Never animate from `scale(0)`:** Popovers, modals, and tooltips should animate from `scale(0.95)` (or `0.92`) + `opacity: 0` to `scale(1)` + `opacity: 1`.
- **Duration Discipline:**
  - Micro-interactions (hover, active, toggle): `120ms – 180ms`
  - Dropdowns, tooltips, popovers: `150ms – 200ms`
  - Modals, drawers, sheets: `200ms – 300ms`
  - Almost no UI transition should exceed `350ms`.
- **Frequency Rule:** The more often a user triggers an action (e.g., command palette, keyboard navigation, tab switch), the faster and subtler its animation must be—or omit animation entirely.
- **Interruptibility:** Every animation must be interruptible mid-flight (hovering in/out rapidly, opening/closing a drawer mid-transition) without jumping or locking input.
- **Ban `transition-all`:** Explicitly list properties (`transition-[transform,opacity,background-color]`). Animate compositor-only properties (`transform`, `opacity`, `clip-path`) whenever possible.

## 3. Apple-Grade Motion & Gestures (`apple-design`)

- **Rubber-Banding / Resistance:** When dragging past boundaries (sheets, carousels), apply diminishing resistance rather than a hard wall.
- **Velocity-Aware Dismissal:** A fast short flick should dismiss a drawer/toast even if the drag distance did not cross 50%.
- **Reduced Motion Respect:** Wrap non-essential motion in `@media (prefers-reduced-motion: reduce)`—preserve instant opacity fades so state changes stay legible without spatial movement.

## 4. Break-UI Stress Testing (`break-ui`)

Never mark a component "done" until you stress-test it against hostile, realistic inputs:
1. **Extreme Text Length:** 80-character unbroken usernames/emails, multi-line button labels, 4-line card titles, and localized/long Turkish or German strings. Verify `min-w-0`, `truncate`, `line-clamp-*`, and `break-words`.
2. **Empty, Single, and Overflow States:** 0 items, 1 item, and 100+ items (scroll containers, sticky headers, pagination).
3. **Slow / Failed Network:** Skeleton loaders that match final layout geometry (zero CLS), optimistic rollback, and actionable error recovery.
4. **Input & Viewport Extremes:** 320px–375px narrow mobile screens, 200% browser zoom, keyboard-only navigation (`Tab`, `Shift+Tab`, `Escape`, Arrow keys), and touch devices (no hover-only critical actions).
5. **Rapid Interaction Spam:** Double-clicking submit buttons, rapidly toggling modals/accordions, and switching tabs mid-fetch.

