---
name: framer-motion
description: >-
  Production patterns and best practices for Framer Motion / Motion for React
  (`motion/react` / `framer-motion`): spring physics, layout animations,
  AnimatePresence exit choreography, gestures, scroll-linked motion, bundle
  optimization (LazyMotion), and accessibility. Use when building or optimizing
  React animations.
---

# Framer Motion — Production React Animation Guide

This skill provides concrete engineering patterns for building silky-smooth, accessible, and bundle-conscious animations in React using `motion/react` (or `framer-motion`).

## 1. Core Principles & Performance

- **Animate Compositor Properties Only:** Prefer `x`, `y`, `scale`, `rotate`, `opacity`, and `clipPath`. Avoid animating `width`, `height`, `top`, `left`, or `margin` directly (use `layout` projection instead).
- **Use `LazyMotion` in Production Apps:** Reduce client bundle size by wrapping the app with `<LazyMotion features={domAnimation} strict>` (or `domMax` only when drag/layout is needed) and using `m.div` instead of `motion.div`.
- **Accessibility First:** Always respect user OS settings by wrapping the root app in `<MotionConfig reducedMotion="user">` and using `useReducedMotion()` for custom JS/scroll animations.

## 2. Spring & Easing Presets

Define reusable transition tokens in a shared `motion-tokens.ts` file instead of scattering magic numbers:

```ts
export const transitions = {
  snappySpring: { type: "spring", stiffness: 420, damping: 32, mass: 0.8 },
  gentleSpring: { type: "spring", stiffness: 260, damping: 28, mass: 1 },
  easeOutFast: { duration: 0.18, ease: [0.23, 1, 0.32, 1] },
  easeOutMedium: { duration: 0.28, ease: [0.19, 1, 0.22, 1] },
} as const;
```

## 3. Mount / Unmount Choreography (`AnimatePresence`)

- Always give direct children of `<AnimatePresence>` a **stable, unique `key`** (never array index for reorderable lists).
- Use `mode="popLayout"` for smooth list item removal so siblings slide into place without waiting.
- Use `mode="wait"` for sequential view/step swaps where overlap would look messy.
- Set `initial={false}` on `<AnimatePresence>` when you do not want the initial page render to replay enter animations.

## 4. Shared Element & Layout Animations

- Use `layout` or `layout="position"` (to avoid distorting text aspect ratio) for smooth FLIP reflows.
- Use `layoutId` for shared-element transitions (e.g., active tab pill indicator, expanding card-to-modal):
  ```tsx
  {isActive && (
    <motion.span
      layoutId="active-nav-pill"
      transition={{ type: "spring", stiffness: 500, damping: 38 }}
      className="absolute inset-0 rounded-md bg-muted -z-10"
    />
  )}
  ```
- Wrap sibling groups that affect each other's geometry in `<LayoutGroup>` so measurements stay synchronized.

## 5. Scroll-Linked & Reveal Motion

- **Viewport Reveals:** Use `whileInView` with `viewport={{ once: true, amount: 0.2 }}` so content never re-hides annoyingly on scroll back up.
- **Continuous Scroll Progress:** Pair `useScroll({ target: ref, offset: ["start end", "end start"] })` with `useTransform` (and optional `useSpring` smoothing) to drive GPU transforms with zero React re-renders per frame.
- **Avoid React State in Animation Loops:** Store animated values in `MotionValue` (`useMotionValue`) rather than `useState`.

## 6. Gestures & Micro-Interactions

- Buttons: `whileHover={{ y: -1 }}` + `whileTap={{ scale: 0.97 }}`.
- Draggable sheets/cards: Combine `drag="y"`, `dragConstraints`, `dragElastic={0.18}`, and `onDragEnd` checking both `info.offset` and `info.velocity`.
- Always verify keyboard accessibility alongside pointer gestures (every drag action needs a keyboard/button equivalent).

## 7. Common Pitfalls to Audit

1. Missing `key` or unstable keys inside `AnimatePresence`.
2. Animating non-composited CSS properties causing jank on 60Hz/120Hz displays.
3. Forgetting `layout="position"` on text inside resizing containers (causes stretched glyphs).
4. Triggering `setState` inside `onUpdate` or scroll listeners instead of using `MotionValue`.
5. Ignoring `reducedMotion="user"`.

