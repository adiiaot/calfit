# CalFit — Build & Distribution (2026-10-14; no build executed here)

## Agreed approach (owner confirmed)
- **Preview APK sideload** for IT assessors + **Expo Go QR** for demo. No Play Console / Apple Developer accounts exist — no AAB, no TestFlight, no store submit.

## Pre-build verification (done by code read)
- App name `CalFit`, slug `calfit`, version `1.0.0`, IDs `com.aotnetwork.calfit` consistent.
- Permissions justified: ACTIVITY_RECOGNITION (steps), CAMERA (food scan), RECORD_AUDIO (voice), INTERNET.
- Icons/splash present in `assets/`; `eas.json` has `preview` (internal) + `production` (APK) + `development` + `simulator`; `projectId 2da67313-…` set.
- No secrets in `app.json`/`eas.json`; `.env` gitignored.
- Known Expo Go limitation: Recap image export (`react-native-view-shot`) falls back to text sharing in Go — use APK for full test.

## Next steps (run with EAS login + live Supabase)
1. `npm install` then `npx expo start` → confirm QR loads on assessor devices.
2. `eas login` then `eas build -p android --profile preview` → download APK, record exact artifact path + version code here.
3. Sideload: enable Install-unknown-apps → install APK → smoke test M1–M7.
4. iOS: config-only review done; simulator/TestFlight require macOS + Apple account — document as pending.

## Status
- APK: NOT BUILT in this session (no EAS credentials in environment). No artifact path to report.
- iOS: NOT TESTED. Do not claim iOS compatibility beyond config review.
