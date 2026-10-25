# CalFit — Changelog

## 2026-10-25 (defence day) — Dead AI model replaced, live again
- `deepseek-ai/deepseek-v4.1-flash` began hanging indefinitely (HTTP 546 worker limit after ~155s, direct NVIDIA timeouts). Diagnosed by direct probing: the API key authenticated fine (410 responses), so the failure was model availability, not credentials.
- Probed all 85 models on the account; most of the older instruct models return `410 Gone` or `404 Function not found`. Two live endpoints found:
  - `nvidia/nemotron-3.5-lightning-30b-a3b` — text (chat, workouts, meal plans)
  - `nvidia/nemotron-3.5-super-vl-120b-a12b` — vision (food scanner), also text-capable
- These are **reasoning** models: they spend `max_tokens` on hidden `reasoning_content` and leave `content` empty, which the app reads as a failed response. Fixed by sending `chat_template_kwargs: { enable_thinking: false }` on every call (constant `NO_THINKING` in `nvidia-client.ts`).
- Measured through the deployed proxy: chat 2.5s, workout JSON 1.6–4.4s, vision 3.3s.
- Updated code defaults, `.env`, `.env.example`, README, GETTING_STARTED, app documentation, project report. No edge-function code change needed — the model name passes through from the client.
- Added `.env.vercel` (public build vars only) for the Vercel deployment; gitignored.
- `tsc --noEmit`: 0 errors.

## 2026-10-14 — Audit + safe fixes (unreleased)
- Fixed sleep export (`hours` with legacy fallback) in CSV + text avg.
- Fixed BMI/weight key drift (`current_weight_kg` preferred in Meals + Progress).
- Fixed tab-bar focus bug, added bottom insets + a11y roles/labels.
- Fixed AndroidSafeView to apply all safe-area insets.
- Escaped PDF HTML (user/AI strings); fixed privacy + auth copy honesty; listed all data processors.
- Removed web `user-scalable=no`; fixed GETTING_STARTED stale AI-key docs.
- Added `scripts/verify-fixes.js` (29/29 pass) + audit/QA/security/privacy/release docs.
- Not changed (pending approval): ai-proxy auth, avatars RLS, real delete-account, migrations.

## 2026-10-14 (afternoon) — export mapping fixes
- Fasting CSV now uses real `ended_at`/`completed` columns.
- Workout CSV now uses real `name`/`duration_seconds`/`exercises` columns.
- Text report falls back to `name` for workouts.
- Added `docs/START_TESTING_TODAY.md` (Expo Go + preview APK steps).
- Verified: `expo config` valid; `expo export -p web` could not complete here (Metro too slow on this machine); EAS build requires interactive login; no Android SDK locally.

## 2026-10-14 (evening) — Expo SDK 54 → 57 upgrade (for Expo Go 57 compat)
- `npx expo install expo@^57.0.0 --fix`: RN 0.81.5→0.86.3, React 19.1→19.2.3, TS 5.9→6.0, all expo modules to SDK 57 pins. `expo-doctor`: 21/21 pass.
- Removed `expo-av` (deleted upstream in SDK 57): voice recording migrated to `expo-audio` (`useAudioRecorder` hook in VoiceMicButton; permission helpers stay in VoiceRecorderService). Added `expo-audio`, `expo-asset`, `expo-splash-screen` (+ auto plugins).
- `expo-speech.getVoicesAsync` → `getAvailableVoicesAsync` (renamed upstream).
- `StyleSheet.absoluteFillObject` → `absoluteFill` (RadialMenu, NotesScreen).
- app.json: dropped invalid `newArchEnabled`, top-level `splash` (moved into `expo-splash-screen` plugin), `android.edgeToEdgeEnabled` (now default); viewport zoom fix retained.
- tsconfig excludes `supabase/functions` (Deno files, not app code).
- Real bugs found via TS 6 strictness and fixed: fasting `loadData` select omitted `protocol/fast_hours/eating_hours/target_end_at` (progress ring NaN after restart); exercise-demo arms/legs used `AnimatedInterpolation * number` (= NaN, limbs dropped) — now mirrored to state; `formatDuration` divided ms by 60 instead of 1000; `Equipment` union missing `'machine'`.
- tsc: 4 pre-existing type-only mismatches remain (casts in Notifications/Sleep, `estimatedDate null`, `bodyScroll` style key) — runtime-safe, Metro doesn't typecheck. `scripts/verify-fixes.js`: 29/29.

## 2026-10-14 (night) — AI model swap + camera/notification fixes
- Retired `meta/llama-3.1-70b-instruct` (410 Gone) → `deepseek-ai/deepseek-v4.1-flash` (live multimodal free endpoint) for chat AND food-scanner vision. Updated code defaults, local `.env`, `.env.example`. No edge-function change needed (model passes through). NOTE: update the same 2 vars in EAS env + rebuild for builds to pick it up.
- FoodScanner: shutter gated on `onCameraReady` (fixes CameraOutputNotReadyException spam) + a11y label.
- reminderService: dropped deprecated `shouldShowAlert` (use banner/list).
- Verified: 32/32 script, doctor 21/21, tsc still only the 4 known pre-existing type-only issues.
