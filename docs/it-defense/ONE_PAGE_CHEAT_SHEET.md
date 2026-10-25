# CalFit — One-Page Defence Sheet
**5 minutes · 6 slides · then the demo.** Glance at this between questions, not during the talk.

---

## The clock

| | Slide | Say this in one line | Time |
|---|---|---|---|
| 1 | Title | CalFit: one app for food, workouts, sleep, fasting — with an AI coach. | 0:15 |
| 2 | The problem | Four reasons people quit: scattered records, foreign food data, generic plans, nobody checking in. | 0:40 |
| 3 | The solution | Each cause has one answer — and nothing was built that does not remove a cause. | 0:50 |
| 4 | The screens | Home → log food → get the plan → train. Four screens, one daily loop. | 0:45 |
| 5 | Under the hood | One codebase, private rows in the database, AI keys on the server. | 0:40 |
| 6 | Proof & status | 32/32, 21/21, 0 errors; three real bugs fixed; honest about what is next. | 0:40 |

**Total talk: 3:50. Demo gets the rest.** If you are behind at slide 4, skip slide 5's detail and say its one line.

---

## Numbers you must not get wrong

| Claim | Number |
|---|---|
| Automated checks | **32 / 32 pass** (`scripts/verify-fixes.js`) |
| Expo Doctor | **21 / 21 pass** |
| TypeScript errors | **0** (`tsc --noEmit`) |
| Nigerian dishes | **25** |
| Exercises / categories | **48** across **8** |
| Fasting protocols | **5** (16:8, 18:6, 20:4, 24h, 5:2) |
| Accountability partners | up to **3** |
| Tables / data | Supabase Postgres, one row per user, RLS on every user table |

---

## Architecture — three lines, no diagram

1. **Phone:** React Native + Expo, one codebase → Android, iOS, web. Zustand for state, session in secure storage.
2. **Data:** Supabase — PostgreSQL, Auth, Realtime chat, Storage. **Row-Level Security**: `user_id = auth.uid()`.
3. **AI:** phone → **Edge Function (`ai-proxy`)** → NVIDIA. The API key lives in **Supabase secrets**, never in the app.

---

## The four answers they will actually ask

| Question | Answer (say it in this shape) |
|---|---|
| **What problem?** | People quit because progress is invisible. Scattered records, food they cannot log, generic plans, no accountability. |
| **What did *you* do vs AI tools?** | We defined the requirements, chose the architecture, reviewed and tested every change. AI drafted and debugged faster. If it broke, it was our call. |
| **How did you test?** | Three layers: read the code, 32 automated checks after every fix, and a written device test list. Nothing counts as passed until it runs on a phone. |
| **What is unfinished?** | AI proxy still accepts unauthenticated calls, account deletion is not finished server-side, charts need a long-history redesign, device testing is incomplete. All in `KNOWN_ISSUES.md`. |

**Backup answers** (the report has the long versions): why Expo · where data lives · how calories remaining is calculated (`goal − eaten`) · what happens offline (message, never a crash) · how the fasting timer survives a restart (derived from stored start time).

---

## Demo path — 5 steps, ~2 minutes

1. **Home** — today's calories, water, steps, sleep, streak.
2. **Calorie** — search `eba`, log it, watch the remaining number drop.
3. **AI Coach** — generate a short workout.
4. **Activity** — start it: voice cue, timer, auto-advance.
5. **Progress** — week view, then export.

**If only 60 seconds:** steps 1 → 2 → 3. Then say "the rest is in the deck."

---

## If something goes wrong

- **Wi-Fi dies:** switch to the deployed web build, then to the screen recording. Keep talking; never debug in front of the panel.
- **AI is slow:** keep narrating what *should* happen; it caches for 5 minutes, so try the same request once more.
- **You forget a number:** say "I will come back to that" — and come back. Never guess a statistic.
- **They challenge the scope:** "It runs today; it is not a store product yet, and the report says exactly what is missing."

---

## Names on the record

**Oluwadare Taye Ayo** · **Okechukwu David Chukwuebuka**
Computer Science, University of Port Harcourt · Industrial Training at **AI HIVE** · 2026

**Files:** deck `CALFIT_IT_DEFENCE_DECK.pptx` · report `CALFIT_IT_PROJECT_REPORT.md` (has the long answers)
