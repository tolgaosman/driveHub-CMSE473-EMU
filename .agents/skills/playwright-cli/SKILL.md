---
name: playwright-cli
description: >-
  Terminal-first browser automation and verification skill using Playwright CLI
  (`npx playwright` / `playwright-cli`) for live page inspection, E2E user flow
  verification, responsive screenshots, visual regression checks, and console/network
  debugging. Use when testing web apps, debugging live UI issues, or capturing
  browser evidence from the CLI.
---

# Playwright CLI — Terminal-First Browser Automation & Verification

This skill guides fast, repeatable browser automation, live UI verification, and end-to-end testing from the command line using Playwright.

## 1. Core CLI Commands

### Setup & Verification
```bash
npx playwright --version
npx playwright install chromium
```

### Quick Live Inspection & Screenshots
```bash
# Open a URL interactively or inspect selectors
npx playwright open http://localhost:3000

# Capture full-page desktop & mobile screenshots
npx playwright screenshot --full-page --viewport-size=1440,900 http://localhost:3000 desktop.png
npx playwright screenshot --full-page --viewport-size=375,812 http://localhost:3000 mobile.png

# Generate test code interactively by recording actions
npx playwright codegen http://localhost:3000
```

### Running & Debugging Test Suites
```bash
# Run all tests headless
npx playwright test

# Run a specific spec with line reporter
npx playwright test tests/booking.spec.ts --reporter=line

# Run with trace capture on failure
npx playwright test --trace=on-first-retry
npx playwright show-trace trace.zip
```

## 2. Selector & Reliability Rules (Zero Flakiness)

Always prefer user-facing, accessible locators in this strict priority order:
1. `page.getByRole('button', { name: 'Book Lesson' })`
2. `page.getByLabel('Email address')`
3. `page.getByPlaceholder('Search driving schools...')`
4. `page.getByText('Confirmed')`
5. `page.getByTestId('booking-summary')` (fallback when semantic roles are ambiguous)

**Never** rely on brittle CSS chains (`div > div:nth-child(3) > span`) or arbitrary `waitForTimeout(3000)` sleeps—use Playwright's auto-waiting assertions (`await expect(locator).toBeVisible()`).

## 3. Structured UI Verification Workflow

When verifying a live feature or bugfix:
1. **Assert Zero Console/Page Errors:** Attach listeners for `page.on('console')` (type `'error'`) and `page.on('pageerror')`, and fail if unexpected runtime errors occur.
2. **Assert Network Health:** Verify critical API requests return expected `2xx` status codes (no silent `404`/`500` responses).
3. **Walk the Real User Flow:** Fill forms, click real buttons, verify URL/navigation changes, and confirm persisted state after `page.reload()`.
4. **Check Responsive Viewports:** Test at least `1440×900` (desktop) and `375×812` (mobile) and assert `document.documentElement.scrollWidth <= window.innerWidth` (zero horizontal overflow).
5. **Check Accessibility Basics:** Verify keyboard navigation (`Tab`, `Enter`, `Escape`) and visible focus states on key interactive elements.

## 4. Debugging Failures Fast

When a Playwright run fails:
1. Inspect the exact failing locator and timeout message.
2. Capture a screenshot + DOM snapshot (`await page.screenshot({ path: 'debug.png', fullPage: true })`).
3. Check console errors and failed network responses before assuming a selector issue.
4. Keep temporary debug screenshots out of git (delete or place in ignored scratch directories).

