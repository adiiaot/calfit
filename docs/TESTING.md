# CalFit — Testing

- Quick: `node scripts/verify-fixes.js` (29 checks, no backend needed).
- Typecheck: `npx tsc --noEmit` (slow here; use CI).
- Manual: see `docs/qa/TEST_PLAN.md`; record in `TEST_RESULTS.md`. Use test accounts only; never prod deletes.
