# CalFit — Architecture Audit (2026-10-14)

## 1. Stack (verified from package.json / app.json)
- Expo SDK ~54.0.35, React Native 0.81.5, React 19.1.0, TypeScript ~5.9 (strict), newArchEnabled: true.
- Navigation: React Navigation v7 (Stack + Bottom Tabs). No Expo Router. Custom tab bar (`AppNavigator.tsx:76 CustomTabBar`) + RadialMenu quick actions. Root gates on `!user || isOnboarding`.
- State: Zustand v5 — `authStore` (session/user/profile/liveSteps/onboarding), `themeStore`, `aiCoachStore`, `mealPlanStore`. No Redux/Context-global.
- Backend: Supabase (Auth incl. anonymous, Postgres, Realtime for `partner_messages`+`notifications`, Storage `avatars`+`partner-media`). Edge Functions: `ai-proxy`, `deepgram-proxy`.
- AI: NVIDIA Llama 3.1 70B chat + Llama 3.2 90B Vision via proxy; model names in `EXPO_PUBLIC_*` config only. Voice STT via Deepgram proxy.
- Food DB: Open Food Facts HTTPS + local Nigerian foods fallback.
- Entry: `index.ts` → `App.tsx` (fonts, `supabase.auth.getSession` + `onAuthStateChange`, streak reminder, SafeAreaProvider).

## 2. Module map
- `src/navigation/AppNavigator.tsx` — AuthStack (Welcome/Onboarding/Subscription), AppStack (Main tabs + Settings/EditProfile/Subscription), 20+ hidden tab routes.
- `src/screens/*` — dashboard, calorie, meals, Activity, sleep, progress, streaks, AICoach, nutrition/Notes, settings, notifications, earnings, onboarding.
- `src/modules/accountability` — PartnerService, PartnerChatService (Realtime), PartnerCard/InviteSheet.
- `src/services` — supabase client, profileService, stepService (pedometer), nvidia-client (proxy), foodSearchService, imageService, notification/reminder, VoiceRecorderService, aiAnalysisService.
- `src/theme` — colors (light/dark), typography, spacing, responsive (largely unused scaling helpers).
- `supabase/migrations/000_full_schema.sql` — single 477-line schema, RLS on 20 tables.

## 3. Key execution paths
- Boot → fonts (5s timeout fallback) → getSession → setSession → loadProfile (skipped while isOnboarding) → onboarding or Main tabs.
- Steps: `useSteps` mounted once in TabNavigator, writes `authStore.liveSteps`, 60s Supabase upsert, goal notification once.
- Food log: CalorieScreen search (OFF API) → portion multiplier → insert `food_logs` → notify on goal.
- Workout: QuickStart 1s timer → per-exercise kcal → `workout_sessions`; AI variant via `ai-proxy`.
- Sleep: manual hours stepper → upsert `sleep_logs` by date.
- Fasting: 1s interval elapsed → progress/remaining → complete → update row.
- Export: DownloadData fetches 7 tables → CSV/text via Share sheet; PDF via Print+Sharing.

## 4. Strengths
- Fail-closed Supabase config; SecureStore auth storage on native; proxy keeps NVIDIA/Deepgram keys server-side.
- RLS enabled broadly; partner chat uses Realtime correctly; step subscription lifecycle sound.
- Onboarding ownership fix (authStore never flips isOnboarding mid-flow) avoids unmount bug.

## 5. Risks
- `ai-proxy` unauthenticated (P0); `avatars` RLS too broad (P0); fake delete-account (P0).
- Column-name drift (`weight_kg` vs `current_weight_kg`, `hours` vs `duration_hours`) — partially fixed 2026-10-14.
- No BMR/TDEE, no volume calc; hardcoded calorie suggestions.
- Zero accessibility labels; fixed Dimensions; modal keyboard gaps; tab focus bug (fixed 2026-10-14).
- No test runner; `tsc --noEmit` timed out (>120s) on 2026-10-14 — needs investigation on faster machine.
- `@react-native-async-storage/async-storage` installed but unused; `GETTING_STARTED.md` stale keys.

## 6. Baseline (2026-10-14, Windows, Node 20.20.2)
- `npm ls --depth=0`: all deps resolve; extraneous `@emnapi/sharp` entries harmless.
- `npx tsc --noEmit`: timed out after 120s (not a pass/fail — record as NOT VERIFIED).
- `node scripts/verify-fixes.js`: 29/29 pass (post-fix).
- No Jest/Vitest/CI present.
