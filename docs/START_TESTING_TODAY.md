# CalFit — Start Testing Today (copy-paste guide)

All work below runs from the `calfit/` folder on your Windows machine.

## 0. Unpause Supabase (2 min)
1. Open your Supabase dashboard → unpause/resume the CalFit project.
2. Confirm these exist: tables per `supabase/migrations/000_full_schema.sql`, buckets `avatars` + `partner-media` (public), Realtime on for `partner_messages` and `notifications`.
3. `.env` already exists locally and `npx expo config --type public` reads it fine (verified 2026-10-14).

## 1. Expo Go demo — iOS + Android (5 min, no build needed)
Project is now on **SDK 57** (upgraded 2026-10-14), matching the current Expo Go. `expo-doctor` 21/21 pass.
```bash
cd "C:\My Workspace\Aotsecure-V1\projects\Mobile Apps\CalFit\calfit"
npx expo start
```
First bundle takes a few minutes — leave it running.
- iPhone: install **Expo Go** from App Store → scan QR with Camera app.
- Android: install **Expo Go** from Play Store → scan QR inside the Expo Go app.
- Same Wi-Fi for phone + PC. If QR fails: press `w` in the terminal for the web fallback, or use the tunnel option Expo offers.
- Known Go limitation: Recap image export falls back to text sharing (needs the APK for full test).

## 2. Preview APK for assessors (needs your Expo login once)

> **Why the first APK crashed:** EAS cloud builds do NOT include your local `.env`, and the app threw at startup when the Supabase URL/key were missing. Fixed in code (readable error screen instead of crash) — but you must still give EAS the 4 public vars below, then rebuild. The old APK is also stale (pre-SDK-57); uninstall it first.

**Step A — add env vars to EAS (one time).** Easiest in the browser: expo.dev → your account → calfit project → **Environment variables** → create these 4 for the **Preview** (and Production) environments (copy values from your local `.env`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_NVIDIA_MODEL`
- `EXPO_PUBLIC_NVIDIA_VISION_MODEL`

**Step B — rebuild + reinstall:**
```bash
cd "C:\My Workspace\Aotsecure-V1\projects\Mobile Apps\CalFit\calfit"
eas login
eas build -p android --profile preview
```
- Uninstall the old crashed APK from each device first, then install the new one (allow *Install unknown apps*).
- If the app ever opens to a dark **"Configuration error"** screen instead of crashing, it means Step A was missed — add the vars and rebuild.
- When finished, EAS prints an install URL + QR. Download the APK on each Android device → allow *Install unknown apps* → install.
- Do NOT use `--profile production` for assessors (that's the store path; you have no Play Console yet).
- I could not run this here: `eas whoami` waits for interactive login and this machine has no Android SDK, so there is no artifact path to hand you yet. The config is verified valid (`appId com.aotnetwork.calfit`, v1.0.0, permissions, icons, projectId all check out).

## 3. Smoke test (15 min, on device)
1. Onboarding → goal/stats/account → lands on Home (no crash, no mid-flow kick-out).
2. Calorie → search food → portion 150g → save; totals + macros move.
3. QuickStart workout → finish → appears in Activity + Progress.
4. Sleep → log 7.5h → hero shows 7.5/8; Settings → Download Data → TXT shows `7.5` (was `0.0` before today's fix).
5. Fasting → start 16:8 → end → history shows actual hours.
6. Streaks → check in → +1. Partners → add by CalFit ID → chat both sides.
7. Kill + reopen app → data intact, still signed in.

## 4. What I fixed today (all verified, 29/29 script pass)
Sleep export columns, fasting + workout export mappings (were blank/wrong columns), BMI/weight key drift, tab-bar highlight + gesture-nav overlap + labels, safe-area bottom insets, PDF HTML escaping, honest privacy/auth copy, web zoom, stale setup docs.

## 5. Do NOT do today
- No store uploads, no production builds, no key rotation, no RLS/proxy changes (proposals await your explicit go-ahead in `docs/security/SECURITY_AUDIT.md`).
- Test data only — don't delete anything from the live Supabase project.
