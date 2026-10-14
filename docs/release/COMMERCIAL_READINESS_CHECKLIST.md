# CalFit — Commercial Readiness Checklist (2026-10-14)

## Verified
- [x] App ID consistent: `com.aotnetwork.calfit` (scheme, iOS bundle, Android package)
- [x] Version 1.0.0, portrait, icon/splash configured, permissions justified (ACTIVITY_RECOGNITION/CAMERA/RECORD_AUDIO)
- [x] EAS projectId present; preview/production profiles exist

## Release blockers (must fix before any store submission)
- [ ] P0 S1: lock `ai-proxy` (auth/allowlist/rate-limit) + rotate key
- [ ] P0 S2: scope `avatars` RLS
- [ ] P0 S3: real delete-account or store-safe disclosure (copy fixed; function pending)
- [ ] Real device QA matrix (Android + iOS) — none executed here
- [ ] Privacy Data Safety / Apple labels + in-app privacy copy alignment
- [ ] Terms of Service (none found) + support URL
- [ ] No Play Console / Apple Developer accounts yet (owner confirmed) — submission impossible until created

## Agreed distribution (no store)
- Preview APK sideload for IT assessors + Expo Go QR for demo. No AAB, no submit.
