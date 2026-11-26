---
name: image-to-code
description: >-
  Translates UI screenshots, wireframes, Figma exports, and visual design mockups
  into clean, semantic, responsive, tokenized production code with a structured
  decomposition and visual verification loop. Use when asked to recreate or
  implement code from an image, screenshot, or mockup.
---

# Image-to-Code — Faithful Visual-to-Production Translation

This skill converts visual references (screenshots, Figma frames, sketches, or reference sites) into clean, modular, responsive frontend code—not fragile absolute-positioned clones.

## Phase 1: Visual Anatomy & Token Extraction

Before writing code, systematically analyze the reference image and note:
1. **Layout Skeleton:** Outer shell (sidebar, topbar, split view, centered container), grid column structure, and responsive collapse behavior.
2. **Color Extraction:** Canvas background, card/surface tones, primary/secondary/muted ink colors, border opacity, accent colors, and semantic badge colors.
3. **Typography Extraction:** Display vs. body font character, approximate size scale, font weights, uppercase/tracking styles, and alignment.
4. **Spacing & Geometry:** Card padding, section gaps, border radius consistency, shadow softness, and aspect ratios of images/thumbnails.
5. **Component Inventory:** Break the visual into reusable semantic components (e.g., `Navbar`, `FilterBar`, `StatCard`, `BookingRow`, `PricingTier`) instead of one flat JSX blob.

## Phase 2: Clean Structural Implementation

- **Use Real Layout Primitives:** Build with CSS Grid and Flexbox—never hardcode pixel `top`/`left` absolute coordinates for normal flow content.
- **Semantic & Accessible HTML:** Infer proper roles (`<nav>`, `<main>`, `<article>`, `<button>`, `<input>`, `<table>`) even when the source is a flat bitmap.
- **Responsive Translation:** Extrapolate sensible mobile (`375px`) and tablet (`768px`) adaptations when only a desktop mockup is provided (e.g., 4-col grid → 2-col → 1-col, sidebar → mobile drawer).
- **Interactive Completeness:** Wire up realistic interactive states (hover, focus, active tabs, dropdown toggles, form inputs) rather than leaving static dead markup.
- **Asset Handling:** Replace blurry bitmap icons from screenshots with crisp vector icons (e.g., Lucide/SVG); use clean aspect-ratio containers and realistic placeholder/domain imagery for photos.

## Phase 3: Visual Diff & Fidelity Verification Loop

After implementing the code:
1. Render the implementation in a real browser (or preview) at the reference viewport width.
2. Compare side-by-side against the original image checking:
   - Alignment & grid proportions
   - Typographic scale, weight, and line wrapping
   - Color harmony, border softness, and contrast
   - Whitespace balance and vertical rhythm
3. Fix every visible discrepancy (spacing drift, wrong weight, clipped text, mismatched radius) until fidelity is high.
4. Verify mobile and desktop responsiveness so the implementation works as real production software, not just a single-width screenshot clone.

