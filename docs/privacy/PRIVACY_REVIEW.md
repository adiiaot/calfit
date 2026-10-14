# CalFit — Privacy Review (2026-10-14)

## What the app actually does (verified)
- **Collects**: name, CalFit ID, goal, height/weight, food/water/workout/steps/sleep/fasting logs, notes, AI prompts, voice clips (on use), avatar image.
- **Stores**: Supabase Postgres (RLS) + Storage (`avatars`, `partner-media` public URLs); auth session SecureStore (native) / localStorage (web).
- **Transmits**: Supabase HTTPS; NVIDIA via proxy (prompt + fitness context); Open Food Facts (search text); Deepgram via proxy (voice audio). No ads SDK, no analytics SDK found (`expo-insights` present but no init call found — verify).
- **Shares**: per PrivacyScreen (fixed 2026-10-14 to list all four processors).

## Fixed this pass
- PrivacyScreen Data Sharing lists Supabase + NVIDIA-proxy + Open Food Facts + Deepgram with data sent.
- Your-Rights Delete now honest ("contact support — in-app permanent deletion not yet available").
- Auth/onboarding/sign-out copy no longer claims on-device-only.

## Checklist before commercial release
- [ ] Decide data controller contact + DSR flow (access/export/correct/delete) — partial (export exists).
- [ ] Implement real delete-account (rows + storage + auth user) + retention purge proof.
- [ ] Private avatars or signed URLs; audit `partner-media` retention.
- [ ] Consent dialog before exports (health+PII, unencrypted Share/PDF, OS sheet can send anywhere); post-share cache delete.
- [ ] Disclose pedometer/camera/mic/photo usage in store Data Safety + Apple Privacy labels.
- [ ] Verify `expo-insights` disabled or disclosed; strip `__DEV__` logs in prod.
- [ ] No compliance claim (GDPR/NDPR/HIPAA/Play/Apple) made — none verified.
