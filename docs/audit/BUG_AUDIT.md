# CalFit — Bug Audit (2026-10-14)

Evidence: `node scripts/verify-fixes.js` → 29/29 pass post-fix.

## Fixed (verified)
| ID | Severity | Finding | Root cause | Fix | Evidence |
|---|---|---|---|---|---|
| B1 | P1 | Sleep export avg always `—`/0 | `DownloadDataScreen` used `duration_hours`, column is `hours` | Use `r.hours ?? r.duration_hours` (CSV + avg) | verify-fixes #1–3 |
| B2 | P1 | CSV sleep column blank | Same as B1 | Same fix | #1 |
| B3 | P2 | BMI hidden/null for real users | `MealsScreen` read `weight_kg`, DB writes `current_weight_kg` | Prefer `current_weight_kg` | #4 |
| B4 | P2 | Progress weight null | `ProgressScreen` selected `weight_kg` only | Select + prefer `current_weight_kg` | #5–6 |
| B5 | P2 | False "data stays on this device" (Welcome, Onboarding x2, sign-out) | Copy predates Supabase sync | Accurate sync copy | #7–9 |
| B6 | P2 | Tab highlight wrong on hidden routes | `isFocused = state.index===index` on filtered list | Compare global `routeIndex` | #18 |
| B7 | P2 | Tab bar obscured by gesture nav; no a11y | Fixed height 72, no insets, no roles | `insets.bottom`, `role=tab`, labels, hitSlop | #19–20 |
| B8 | P2 | Android content under gesture bar | `AndroidSafeView` top-only | All insets | #16–17 |
| B9 | P1 | PDF HTML injection via names/AI text | Raw interpolation | `escapeHtml` on user/AI strings | #13–15 |
| B10 | P3 | Web zoom blocked | `user-scalable=no` | Removed | #21 |

## Fixed (second pass, 2026-10-14 afternoon)
| ID | Severity | Finding | Root cause | Fix |
|---|---|---|---|---|
| B11 | P1 | Fasting CSV columns blank (`completed_at`/`status` don't exist) | Schema drift | Map to `ended_at` + `completed?'completed':'incomplete'` (verified vs migration lines 272-285) |
| B12 | P1 | Workout CSV columns blank (`exercise_name`/`duration_minutes`/`sets`/`reps`/`weight_kg` don't exist) | Schema drift; real cols are `name`/`duration_seconds`/`exercises` JSONB | Use `name`, minutes derived from `duration_seconds`, exercise count, `status` |
| B13 | P2 | Text-report recent workouts blank names | Used `exercise_name` | Fall back `name ?? exercise_name` |

## Fixed (third pass — launch-crash hardening, 2026-10-14 evening)
| ID | Severity | Finding | Root cause | Fix |
|---|---|---|---|---|
| B14 | P0 | APK crashed instantly on open (assessor device) | `supabase.ts` threw at module import when `EXPO_PUBLIC_*` missing — EAS cloud builds don't include local `.env` | Lazy client via Proxy + `supabaseConfigError`; App.tsx renders readable config screen + skips session init |
| B15 | P1 | Fasting progress NaN after restart | `loadData` select omitted `protocol/fast_hours/eating_hours/target_end_at` | Full column select |
| B16 | P2 | Exercise-demo arms/legs invisible | `AnimatedInterpolation * number` = NaN coords | Mirror anim values to state; plain-number math |
| B17 | P3 | Voice badge timer wrong (16:40 at 60s) | `formatDuration` divided ms by 60 | Divide by 1000 |

## Open — do NOT fix without approval (P0, backend/RLS)
| ID | Severity | Finding | Proposed fix | Risk |
|---|---|---|---|---|
| O1 | P0 | `ai-proxy` no JWT, `CORS:*`, no allowlist/rate-limit | Mirror `deepgram-proxy` auth + model allowlist + quotas | Touching proxy; needs Supabase deploy + key rotation |
| O2 | P0 | `avatars` bucket world-read + any-user overwrite | Add `foldername==auth.uid()` policies; consider private+signed URLs | Storage policy change |
| O3 | P0 | Delete-account only signs out | Edge Function (service_role) deleting rows+storage+user, or keep honest copy (done) | Destructive; needs design review |
| O4 | P1 | `ai_api_usage` user-insertable (metric spoof) | Service-role only + trigger | Migration |
| O5 | P1 | `insert_partner_reverse` SECURITY DEFINER without `auth.uid()` guard | Add `IF p_user_id != auth.uid() RAISE` + grants check | Function change |

## Open — product limitations (document, don't invent)
- No BMR/TDEE (MealPlan hardcodes 1800/2500/2000); no tonnage; fasting history column mapping in CSV (`completed_at/status` vs actual `ended_at/completed`) — flagged for next pass; streak freeze copy says week, enforces month.
- CSV export shares 40-line preview, not a file; PDFs linger in cache (no post-share delete).
- `tsc --noEmit` timed out (>120s) — still NOT VERIFIED; rerun on faster machine/CI.

## Formulas verified (spot-checks #22–29)
`remaining=max(goal-consumed,0)`; macros 30/45/25 P/C/F; portion `round(base*portion/100)`; steps `round(s*0.04)`; BMI `kg/(m^2)`; sleep avg/consistency; fasting `elapsed/(fastH*3.6M)`; streak day-diff dedup.
