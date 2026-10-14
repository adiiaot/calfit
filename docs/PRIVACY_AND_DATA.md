# CalFit — Privacy & Data (actual behavior)

Collects: profile, body stats, food/water/workout/steps/sleep/fasting, notes, AI prompts, voice clips (on use), avatar.
Stored: Supabase (RLS) + public Storage URLs; session in SecureStore (native)/localStorage (web).
Sent to: Supabase, NVIDIA-proxy (prompt+context), Open Food Facts (search text), Deepgram-proxy (voice).
User controls: view/edit in app, export in DownloadData, delete via support (in-app permanent delete unavailable).
No compliance claimed. Confirm `expo-insights` status before release.
