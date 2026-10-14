# CalFit — Test Plan (2026-10-14)

## Automated (runnable now)
- `node scripts/verify-fixes.js` — 30 checks: source-pattern regressions (B1–B10) + pure formulas (remaining, steps→kcal, BMI, sleep avg, fasting progress). **29/29 pass.**
- `npx tsc --noEmit` — NOT VERIFIED (timed out >120s on this machine; rerun in CI/faster host).
- No Jest/Vitest present — recommend adding for `profileService` math + validators before store submission.

## Manual matrix (all NOT EXECUTED here — needs devices + live Supabase)
| ID | Feature | Steps | Expected |
|---|---|---|---|
| M1 | Onboarding | Fresh install → goal/stats/account → dashboard | Profile row created, no mid-flow unmount |
| M2 | Food log | Search OFF → portion 150g → save; manual add; empty name rejected | kcal = round(base*1.5); totals update |
| M3 | Workout | QuickStart start/pause/finish; AI workout | `workout_sessions` row, kcal = Σ |
| M4 | Steps | Grant motion perm; walk | liveSteps + 60s save; 0.04 kcal/step |
| M5 | Sleep | Log 7.5h; avg of 7d | Hero pct 7.5/8; export shows 7.5 |
| M6 | Fasting | Start 16:8; kill app; reopen; end | Timer resumes; history actualH correct |
| M7 | Streak | Check-in 2 consecutive days | +1/day; milestone at 3/7/14… |
| M8 | AI Coach | Ask plan; airplane mode | Answer or clear error; no crash |
| M9 | Partners | 2 accounts add + chat | Realtime both sides; unread badge |
| M10 | Export | CSV/TXT/PDF | TXT full; CSV note truncated-preview; PDF opens; no PII leak beyond user action |
| M11 | Restart persistence | Log data → force-stop → reopen | Data intact; session persists |
| M12 | Keyboard | Open every modal input on small Android | CTA visible above keyboard |
| M13 | A11y | TalkBack/VoiceOver pass on 4 tabs + chat | All actions announced, targets ≥44px |
| M14 | Dark/light | Toggle theme | Contrast readable, StatusBar correct |

Record results in TEST_RESULTS.md — do not mark passed unless executed.
