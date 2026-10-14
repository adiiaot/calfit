# CalFit — Final Handover (2026-10-14)

## Application
- Structure: Expo 54 / RN 0.81 / TS strict / Nav v7 / Zustand / Supabase + proxies. Entry `App.tsx`, tabs in `AppNavigator`.
- Fixed: sleep export columns, BMI/weight keys, tab focus/insets/a11y, safe-area insets, PDF escaping, honest privacy/auth copy, web zoom, stale docs.
- Verified: 29/29 `scripts/verify-fixes.js`.
- Remaining: P0 ai-proxy auth, avatars RLS, real delete-account; chart/keyboard/a11y backlog; subscription stub.

## QA
- Passed: 29 script checks. Failed: 0. Not executed: tsc (timeout), M1–M14 devices, EAS build, iOS.

## Commercial
- Blockers: P0s + device QA + store accounts (none exist) + Data Safety/labels + ToS. APK path agreed, not built here.

## Documentation
- Created: audit (3), qa (4), security, privacy, release (2), project docs (7), it-defense (4).
- Updated: 8 source files + GETTING_STARTED. Needs from you: [INSERT NAME/MATRIC/DEPT/INSTITUTION/ORG/SESSION/DATE] + live screenshots + EAS build artifact path.

## IT Defense
- Report/slides/notes/Q&A as editable Markdown in `docs/it-defense/`. Print-ready DOCX/PDF/PPTX NOT generated (no office libs here) — export from these sources.

## 5 next steps
1. Approve + apply ai-proxy JWT/allowlist/rate-limit; rotate NVIDIA key.
2. Approve + apply avatars folder-check RLS (consider private+signed URLs).
3. Decide delete-account: build service_role Edge Function or keep disclosed support flow.
4. Run `eas build -p android --profile preview` + device matrix M1–M14; record in TEST_RESULTS.
5. Chart/keyboard/a11y pass + Jest suite + `tsc` in CI.
