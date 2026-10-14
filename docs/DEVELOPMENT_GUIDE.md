# CalFit — Development Guide

1. Node 18+, `npm install`, copy `.env.example` → `.env` (Supabase URL + anon key only).
2. Supabase: run `supabase/migrations/000_full_schema.sql`, create `avatars` + `partner-media` buckets, enable Realtime for `partner_messages` (+`notifications`).
3. Edge secrets: `supabase secrets set NVIDIA_API_KEY=... DEEPGRAM_API_KEY=...`; deploy `ai-proxy`, `deepgram-proxy`.
4. Run `npx expo start` (Go QR) or `eas build -p android --profile preview` (APK).
5. Verify with `node scripts/verify-fixes.js`. `tsc --noEmit` may be slow — use CI.
