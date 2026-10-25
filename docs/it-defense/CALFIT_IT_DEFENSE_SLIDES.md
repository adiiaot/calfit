# CalFit — IT Defence Slides (6 slides · 5-minute slot)

> The built deck is `CALFIT_IT_DEFENCE_DECK.pptx` — 6 slides, 5-minute slot. This file is the text source, for editing.

**Presenters:** Oluwadare Taye Ayo · Okechukwu David Chukwuebuka
**Talk time:** 3:50 of slides, the rest goes to the live demo.

| # | Slide | Job of the slide | Time |
|---|-------|------------------|------|
| 1 | Title | Names, project, one-line thesis, roadmap of the five minutes | 0:15 |
| 2 | The problem | Four causes, one outcome — quitting | 0:40 |
| 3 | The solution | Cause → feature, one row each | 0:50 |
| 4 | The screens | Home, Calorie, AI Coach, Activity — the daily loop | 0:45 |
| 5 | Under the hood | One codebase, private rows, keys on the server | 0:40 |
| 6 | Proof & status | 32/32, 21/21, 0 errors; three fixes; honest next steps | 0:40 |

---

## Slide 1 — Title
- CalFit — one app for food, workouts, sleep and fasting, with an AI coach that knows your history.
- Oluwadare Taye Ayo · Okechukwu David Chukwuebuka
- Computer Science, University of Port Harcourt · Industrial Training at AI HIVE · 2026
- Quote to land later: “You can’t stay motivated by progress you can’t see.”

## Slide 2 — The problem
- **01 Records live everywhere** — notebook, memory, nowhere. No full picture, so no proof of progress.
- **02 Apps don’t know our food** — eba, ofada, moi moi become guesswork, so people stop logging.
- **03 Every plan is the same plan** — beginner and gym regular get identical advice.
- **04 Nobody checks in** — one missed week becomes a missed month, then the app is deleted.
- Bottom line: “You can’t stay motivated by progress you can’t see.”

## Slide 3 — The solution
- Scattered records → one dashboard: calories, macros, water, steps, sleep, workouts, progress views, PDF export.
- Foreign food → 25 Nigerian dishes + Open Food Facts + camera scanner.
- Generic plans → AI coach generates workouts and meal plans from goal, stats, equipment, history.
- No accountability → 3 partners, shared goals, live chat, streaks, reminders, fasting timer.
- Line to land: “If a feature did not remove one of those four causes, we did not build it.”

## Slide 4 — The screens
- **Home** — calories left, macros, water, steps, sleep, streak.
- **Calorie** — log meals, add water, scan the plate.
- **AI Coach** — a real session back: sets, reps, rest, form tips, progression.
- **Activity** — 8 categories, 48 exercises, guided timer with voice cues.
- Say: “You will see each of these in the demo.”

## Slide 5 — Under the hood
- Phone: React Native + Expo, one codebase → Android, iOS, web; Zustand; session in secure storage.
- Data: Supabase — Postgres, Auth, Realtime, Storage; RLS `user_id = auth.uid()` on every user table.
- AI: phone → `ai-proxy` Edge Function → NVIDIA. Key lives in Supabase secrets, never in the app.
- Honest footnote: AI proxy should reject unauthenticated calls; server-side account deletion not finished.

## Slide 6 — Proof and status
- 32/32 automated checks · 21/21 Expo Doctor · 0 TypeScript errors.
- Three real failures: launch crash on missing setup values; AI model retired overnight; fasting timer reset on reopen — all fixed.
- Working today: the full loop, coach, scanner, partners, streaks, export.
- Next: lock the AI proxy, finish account deletion, finish device testing, clean APK.
- Not yet: store release, real payments, medical calorie targets.
- Close: “It runs today — so let’s open it.”
