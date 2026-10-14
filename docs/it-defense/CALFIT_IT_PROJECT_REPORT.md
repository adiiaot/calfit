# CalFit — Industrial Training Project Report
*(Editable source. Export to print-ready DOCX/PDF before submission. Placeholders marked [INSERT …].)*

**Cover:** Project title: CalFit — AI Fitness and Nutrition Coach · Student name: [INSERT NAME] · Matriculation number: [INSERT MATRIC NUMBER] · Department: [INSERT DEPARTMENT] · Institution: [INSERT INSTITUTION] · Industrial Training organisation: [INSERT ORGANISATION] · Academic session: [INSERT SESSION] · Submission date: [INSERT DATE]

## Chapter 1 — Introduction
- **Background.** Many people who want to stay fit have to juggle several apps: one for counting calories, another for workouts, another for sleep. CalFit brings these together in one simple mobile app, with an AI coach that gives personal guidance.
- **Real-world problem identified.** During day-to-day observation, a clear pattern emerged: people start fitness journeys with enthusiasm but abandon them within weeks. The reasons are practical, not laziness. (1) Their records live in different places — workouts in a notebook, meals in memory, sleep nowhere — so nobody can see the full picture. (2) Popular fitness apps are built for foreign users: local dishes (e.g. Nigerian meals) are missing from their food databases, so logging food becomes guesswork. (3) Generic plans ignore the individual — a beginner and a gym regular get the same advice. (4) There is no one checking in, so a single missed week quietly becomes quitting. The result is the same everywhere: people cannot tell whether they are improving, so they stop trying.
- **How the application solves it.** CalFit answers each cause directly. (1) One home for everything — food, water, workouts, steps, sleep and fasting are logged in a single app and shown on one progress screen, so improvement (or slipping) is visible at a glance. (2) Local food support — the food search includes Nigerian dishes alongside the global database, and a photo scanner identifies meals for users who don't want to type. (3) Personal guidance — the AI coach and meal plans respond to the user's own goal, stats and history instead of handing out one-size-fits-all routines. (4) Built-in accountability — partners, shared goals, daily streaks and reminders supply the daily nudge that keeps a missed day from becoming a missed month. (5) Ownership of data — users can view and download everything they recorded, so their effort is never locked away.
- **Problem statement (short version).** Fitness tracking is scattered, foreign-centred and impersonal, so people quit. CalFit unifies tracking, localises food logging, personalises guidance and adds accountability, so users can see progress and stay consistent.
- **Aim.** To build one easy-to-use mobile app where a person can track food, workouts, sleep and fasting, and get helpful AI guidance.
- **Specific objectives.** (1) Let users log meals, water and calories. (2) Let users record workouts, steps, sleep and fasting. (3) Provide an AI coach for advice and meal plans. (4) Let users team up with accountability partners and build streaks. (5) Let users download their own data. (6) Make the app installable and testable on Android phones and iPhones.
- **Scope.** This covers the mobile app and its online database. It does not yet include release on the Play Store or App Store, and payments are not yet active.
- **Significance.** A single app is easier to stick with than five different ones. It helps beginners and regular gym-goers stay consistent.
- **Intended users.** Anyone tracking their health — beginners, gym members, and friends who want to motivate each other.

## Chapter 2 — Requirements and Analysis
- **The existing problem.** People write workouts in notebooks, count calories in their heads, and forget how they slept. Nothing is in one place, so progress is hard to see.
- **The proposed solution.** CalFit keeps every record in one app, saved to the user's own account, with charts that show progress and an AI coach that answers questions.
- **Functional requirements (what the app must do).** Sign up and build a profile; log food, water, workouts, steps, sleep and fasting; chat with the AI coach; generate meal plans; add accountability partners and chat with them; view progress charts; keep daily streaks; receive reminders; export personal data; switch between light and dark appearance.
- **Non-functional requirements (how well it must work).** The app must open quickly, keep working when the network is slow, keep each user's data private to them, and look right on small and large phones.
- **User workflows (how a person uses it).** A user opens the app, logs breakfast, and sees calories remaining for the day. After a workout, they save the session and watch their weekly chart grow. Before bed they log sleep hours. Each day they check in to grow their streak.
- **System constraints.** There are no Play Store or Apple developer accounts yet, so distribution is by direct install and Expo Go demo. AI answers depend on a third-party service with usage limits. Step counting needs a phone with a motion sensor.

## Chapter 3 — System Design
- **Technology in plain terms.** The app is written once and runs on both Android and iPhone. The screens are organised with a bottom menu. User records are kept in a secure online database, one account per user, so data follows the user across devices. Smart features (AI chat, meal plans, food photo scanning, voice notes) are powered by outside services called through a secure middleman, so secret keys never sit inside the app.
- **Structure.** Screens (what the user sees) → small helper services (which fetch and save) → online database and AI services. A diagram of this flow is in `docs/ARCHITECTURE.md`.
- **Data kept.** Profile and goals; food, water, workout, step, sleep and fasting records; notes; chat messages; partner links; reminders.
- **Privacy by design.** Every record belongs to one user, and the database only shows a user their own records. Login details are locked in the phone's secure storage.
- **Design decisions.** One shared codebase for both phone types to save time and avoid double work; AI keys kept on the server side so they cannot be stolen from the app; step counting set up once so it keeps running on every screen.

## Chapter 4 — Implementation
- **How it was built.** Built with a modern phone-app toolkit on a Windows computer, tested with Expo Go on a real iPhone and prepared for Android install. Work was done in small steps: inspect, fix, test, document.
- **Main features.** Onboarding and profiles; food search with Nigerian dishes included; photo food scanner; workout timer and history; step counter; sleep log; fasting timer; streaks with celebrations; progress charts; AI coach chat and meal plans; partner chat; personal notes; reminders; data download.
- **Important logic, simply explained.** Calories remaining = daily goal minus what was eaten. Portion math scales food values up or down. Steps convert to calories at a fixed rate. Sleep average is the week's total divided by days logged. The fasting timer counts from start time to target time. Streaks grow by one for each new day checked in.
- **What was deliberately left out.** The app does not guess the user's ideal calorie target with a medical formula — it uses sensible defaults the user can change. It does not claim features that are not finished (payments are only a placeholder screen).
- **Handling mistakes.** Every save is wrapped so a network failure shows a message instead of crashing. Empty screens explain what to do next. Deleting always asks for confirmation first.
- **Working on both phone types.** Layouts respect notches, home bars and small screens; the keyboard is kept from covering inputs; text can be enlarged.

## Chapter 5 — Testing and Evaluation
- **How testing was done.** First, the code was read carefully to find weak spots. Then an automatic check script (29–32 checks) was run to confirm fixes. Finally, a manual test list was prepared for real phones.
- **Test environment.** Windows computer for code checks; real iPhone with Expo Go for live runs; Android install file for assessor phones; a live test database kept separate from anything personal.
- **What was found and fixed.** Wrong sleep numbers in data download (fixed); missing fasting and workout details in downloads (fixed); the fasting timer breaking after reopening the app (fixed); the app crashing on launch when setup values were missing (fixed with a clear message screen); an AI model that was switched off by its provider (replaced with a working one); camera crashes when tapping too fast (fixed); misleading privacy wording (rewritten honestly).
- **Actual results.** All 32 automatic checks pass. The app's health check (Expo Doctor) passes 21 out of 21. Manual phone tests are listed step by step and marked honestly — none are claimed as passed until actually run on a device.
- **Remaining limitations.** A few behind-the-scenes improvements are proposed but not yet applied (tighter AI access control, stricter photo-storage rules, full account deletion). Charts need a redesign for very long histories. These are written down openly, not hidden.

## Chapter 6 — Challenges and Lessons
- **Records using old field names.** Some screens asked the database for fields by outdated names and got blank answers. Lesson: keep one shared list of field names and check them after every database change.
- **An AI model switched off without warning.** The provider retired the model and the coach went silent. Lesson: never depend on a single model name — keep it in settings, watch for shutdown notices, and have a replacement ready.
- **The app crashed instead of explaining.** A missing setup value killed the app on launch. Lesson: startup problems must always produce a readable message, never a crash.
- **Phone differences.** What fits on a big phone overflowed on a small one, and the keyboard covered buttons. Lesson: test on small screens first and build every form keyboard-safe.
- **What I knew before vs during IT.** Before the placement I already had software-planning, design and coding experience, which I used to plan and review this work. During the placement I additionally learned freelancing, client negotiation, pricing and budgeting. The two are kept separate in this report on purpose.
- **How AI tools were used.** I defined every requirement, chose what to build, and reviewed and tested each change. AI coding tools helped draft and debug code, but nothing entered the project without my review and a passing test.

## Chapter 7 — Conclusion and Recommendations
- **Summary.** CalFit is a working fitness app that went through a full audit: real defects were found, fixed and verified, and the documentation now describes the app honestly.
- **Current state.** Demonstrable today through Expo Go and an Android install file. Not yet a store product — the remaining security tasks and full phone testing come first, and the report says so plainly.
- **Recommendations.** (1) Approve and apply the proposed access hardening. (2) Add full account deletion. (3) Redesign long-history charts. (4) Complete the phone test list on real devices. (5) Build the assessor install file from the current code. (6) Only then open store accounts and publish.

## References and Appendices
- In this repository: README, GETTING_STARTED, the audit, test, security, privacy and release documents, and the automatic check script (`scripts/verify-fixes.js`).
- Screenshots: capture from the running app at defence time (none are pre-made here).
- No academic citations are invented; every claim above traces to the code or the checks.
