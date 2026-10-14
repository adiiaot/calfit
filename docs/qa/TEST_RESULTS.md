# CalFit — Test Results (2026-10-14)

## Automated
- `node scripts/verify-fixes.js`: **29 passed, 0 failed** (Windows, Node 20.20.2).
- `npx tsc --noEmit`: NOT EXECUTED to completion (timeout >120s). No new type errors introduced knowingly; edits are narrowly scoped.
- `npm ls --depth=0`: all direct deps resolve.

## Manual
- M1–M14: NOT EXECUTED (no devices/emulators + live Supabase testing not performed in this session). No manual test marked passed.

## Static analysis
- Grep audits: sleep column drift confirmed + fixed; weight-key drift confirmed + fixed; a11y 0-coverage confirmed (navigator now has 4 attrs); secrets grep clean.
