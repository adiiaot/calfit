# CalFit — Security Audit (2026-10-14, code-read; no penetration tests)

## Verified safeguards
- `.env` gitignored, only `.env.example` tracked; no secrets found in `src/` grep for `nvapi-/sk-/ BEGIN PRIVATE`.
- Supabase client fail-closed on missing env; native session in SecureStore (Keychain/Keystore); web localStorage (expected, note in privacy docs).
- NVIDIA/Deepgram keys server-side (Edge Functions); client sends only prompts/audio via `supabase.functions.invoke`.
- Prompt hygiene: `sanitizeForPrompt` (500-char cap, `<user_data>` wrap), history slice(-10), food query `encodeURIComponent` + 200-char cap.
- RLS enabled on 20 tables; chat immutable (no DELETE); partner-messages scoped to sender/receiver.
- Logs: 25 console calls, all but font-warning guarded `__DEV__`; no tokens/passwords/base64 logged.

## Findings (do not change without approval)
| ID | Severity | Issue | Location | Proposal |
|---|---|---|---|---|
| S1 | P0 | `ai-proxy` unauthenticated, CORS `*`, arbitrary model/messages → quota burn | `supabase/functions/ai-proxy` | Enforce JWT (`getUser` like deepgram-proxy), model allowlist, max_tokens cap, per-user rate limit; rotate NVIDIA key |
| S2 | P0 | `avatars` public + any-auth overwrite | storage policies `444-454` | Require `(foldername(name))[1]=auth.uid()`; consider private + signed URLs |
| S3 | P0 | Delete-account dishonest (sign-out only) | SettingsScreen:220 | Copy fixed to honest; real deletion needs service_role Edge Function — pending design approval |
| S4 | P1 | `ai_api_usage` client-insertable | migration 388-389 | Service-role writes or trigger |
| S5 | P1 | `insert_partner_reverse` DEFINER w/o auth check | migration 311-329 | `IF p_user_id != auth.uid() RAISE` + grant audit |
| S6 | P2 | Unused `@react-native-async-storage` dep | package.json | Remove to prevent future insecure storage |
| S7 | P2 | `usesAppleSignIn:true` dead flag; deep-link session unhandled | app.json:19, supabase.ts | Remove flag or implement Apple auth + Linking config |

## Not verified
- RLS behavior under real anon/auth JWTs (needs live Supabase test); storage overwrite exploit not executed; iOS Info.plist permission strings in built IPA not inspected.
