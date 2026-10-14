# CalFit — UX & Accessibility Audit (2026-10-14)

## Fixed this pass
- Tab bar + quick-action button: `accessibilityRole`, `accessibilityState selected`, labels, 8px hitSlop.
- Privacy + auth copy now honest (sync disclosure, processors, delete path).

## Critical remaining: zero a11y coverage elsewhere
- Grep `accessibilityLabel|accessibilityRole|accessibilityHint` → 0 hits in `src/` before this pass (now 4 in navigator only).
- Every icon-only button (back 34px, send 32px, shutter, pills, chips), segment tabs (AICoach, MealPlan), chat bubbles, camera/result images, RadialMenu dialog, milestone dialog: no labels/roles/live-regions.
- Touch targets 30–36px (<44px WCAG); hitSlop inconsistent.
- Contrast risks: `textMuted #9490B0` on `#F4F0FF`, white 40–70% on indigo, hardcoded `#1A1D26` bubbles in light mode, 9px labels. Needs measured contrast pass (tool unavailable here).
- No `allowFontScaling`/`maxFontSizeMultiplier` policy; 19× `numberOfLines={1}` truncation.

## UX positives (keep)
- Onboarding ownership, single `useSteps` mount, consistent `keyboardShouldPersistTaps` in 5 forms, confirm-before-delete dialogs, empty states via shared component.

## Recommendations (next, low-risk)
1. Add labels/roles to all icon buttons + tabs (same pattern as tab bar fix).
2. `accessibilityLiveRegion="polite"` on chat + error bar announcements.
3. Enforce 44px min targets; audit hitSlop.
4. Contrast measurement + fix muted/white-on-indigo.
5. Chart data-table alternative + non-color encoding.
