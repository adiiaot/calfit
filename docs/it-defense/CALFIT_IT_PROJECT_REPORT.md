# CalFit — Industrial Training Project Report
*(Editable source. Export to print-ready DOCX/PDF before submission. Placeholders marked [INSERT …].)*

**Cover:** Project title: CalFit — AI Fitness & Nutrition Coach · Student: [INSERT NAME] · Matric: [INSERT MATRIC NUMBER] · Department: [INSERT DEPARTMENT] · Institution: [INSERT INSTITUTION] · IT Organisation: [INSERT ORGANISATION] · Session: [INSERT SESSION] · Date: [INSERT DATE]

## Chapter 1 — Introduction
- **Background:** Mobile fitness tracking fragmented across calorie, workout, sleep apps; CalFit unifies them with AI coaching.
- **Problem:** Inconsistent logging, no personalised guidance, poor cross-device sync.
- **Aim:** Reliable cross-platform tracker for calories, workouts, sleep, fasting, steps with AI support.
- **Objectives:** (1) log meals/water; (2) track workouts/steps/sleep/fasting; (3) AI chat + meal plans; (4) partners + streaks; (5) export; (6) Android/iOS readiness.
- **Scope:** Expo app + Supabase backend; test APK + Expo Go demo; no store release, no IAP.
- **Significance / users:** fitness beginners, gym-goers, accountability pairs.

## Chapter 2 — Requirements & Analysis
- **Existing problem → solution:** manual scattered tracking → single app with synced backend + AI.
- **Functional:** onboarding, auth, food/water, scanner, workouts, steps, sleep, fasting, streaks, progress, AI, partners/chat, notes, notifications, export, theme.
- **Non-functional:** offline-tolerant reads, RLS privacy, responsive + a11y, <5s start (font-timeout fallback).
- **Workflows:** log meal → totals; workout timer → session; sleep entry → average; fast start/end → history; check-in → streak.
- **Constraints:** no Play/Apple accounts (no store), AI quota costs, sensor availability, no BMR engine yet.

## Chapter 3 — System Design
- Stack: RN 0.81 + Expo 54 + TS strict; React Navigation v7 (Stack+Tabs, custom bar); Zustand; Supabase (Auth/PG/Realtime/Storage); Edge proxies → NVIDIA/Deepgram; OFF API.
- Architecture diagram: see `docs/ARCHITECTURE.md` (Mermaid).
- Data models: `profiles`, `food_logs`, `water_logs`, `workout_sessions`, `step_logs`, `sleep_logs(hours)`, `fasting_logs`, `notifications`, `partners`, `partner_messages`, `notes`, AI tables.
- Storage: RLS per-user; SecureStore session; public avatar/partner-media buckets (hardening pending).
- Decisions: proxy keeps keys server-side; steps hook once in TabNavigator; onboarding owns flow.

## Chapter 4 — Implementation
- Env: Node 20, Expo, Supabase CLI; modules per feature + shared.
- Key logic: remaining=max(goal-consumed,0); macros 30/45/25; portion round(base*p/100); steps kcal round(s*0.04); BMI kg/m²; sleep avg/consistency; fasting elapsed/total; streak day-diff.
- No BMR/TDEE — MealPlan fallbacks 1800/2500/2000 documented, not invented.
- Error handling: per-screen try/catch, loading/empty states; no silent swallows introduced.
- Cross-platform: AndroidSafeView insets, tab insets, portrait; iOS config reviewed, device test pending.

## Chapter 5 — Testing & Evaluation
- Method: static audits + `scripts/verify-fixes.js` (29/29) + manual matrix M1–M14 (pending devices).
- Results: 10 defects fixed + verified (sleep export, BMI keys, tab focus/insets/a11y, safe-area, PDF escape, copy honesty, viewport, docs).
- Remaining: P0 proxy/avatars/delete (proposed, unapplied), charts/keyboard/a11y backlog, tsc timeout, zero device tests — all logged honestly.

## Chapter 6 — Challenges & Lessons
- Column-name drift (`hours` vs `duration_hours`, `current_weight_kg` vs `weight_kg`) → lesson: single source of column constants + migration lint.
- Unauthenticated proxy + broad storage RLS → lesson: default-deny, JWT verify like deepgram-proxy.
- Zero a11y labels, fixed Dimensions → lesson: bake a11y/responsive checks into PR checklist.
- Prior technical base (planning, design, RN) vs IT-period gains (freelancing, negotiation, pricing, budgeting) kept distinct; AI assisted code/debug, I owned requirements, design approvals, review, and acceptance.

## Chapter 7 — Conclusion & Recommendations
- Current: more reliable codebase, verified fixes, honest docs, demo via APK/Go; not production-ready (P0s + device QA outstanding).
- Recommend: approve proxy/RLS hardening, real delete flow, chart overhaul, Jest suite, device matrix, preview APK build, then store accounts.

## References / Appendices
- In-repo: README, GETTING_STARTED, docs/audit, docs/qa, docs/security, docs/privacy, docs/release. Screenshots: capture from running app at defense time (none fabricated here). Test evidence: `scripts/verify-fixes.js` output.
