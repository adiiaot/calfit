# CalFit — Changelog

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
