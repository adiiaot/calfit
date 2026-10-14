# CalFit — Likely Defense Questions (evidence-based)

1. **Problem solved?** Scattered tracking → unified synced log + AI. See Ch.1–2.
2. **Why this project?** Real product + verifiable codebase; extends prior RN/design base.
3. **Why Expo/RN?** One codebase Android+iOS, OTA/Go demo, native modules only where needed (camera, sensors).
4. **Architecture?** Stack+Tabs, Zustand, Supabase RLS/Realtime, Edge proxies. Diagram in report.
5. **Storage?** Postgres per-user RLS; SecureStore session; public avatar buckets (hardening proposed).
6. **APIs?** Supabase, NVIDIA/Deepgram via proxies, Open Food Facts. Keys server-side.
7. **Calorie math?** remaining=max(goal-consumed,0); macros 30/45/25; portion round(base*p/100). No BMR engine — documented.
8. **Sleep edge cases?** Manual hours 1–12 step 0.5; avg/consistency; export column fixed to `hours`.
9. **Testing?** 29/29 script + M1–M14 pending devices; tsc timed out — stated, not hidden.
10. **Android/iOS?** APK path agreed; Go demo; iOS config-only, no device claim.
11. **Security/privacy?** Proxy/RLS P0s disclosed with proposals; copy fixed; no compliance claimed.
12. **Challenges?** Column drift, unauth proxy, a11y debt — fixes + lessons in Ch.6.
13. **Limitations/future?** See KNOWN_ISSUES + Ch.7.
14. **AI role?** I defined requirements, design, priorities; AI assisted code/debug; I reviewed, tested (script), and accepted each change.
