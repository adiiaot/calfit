# CalFit — Release Guide (controlled test release only)

1. Bump version in app.json if needed; confirm IDs, icons, permissions.
2. `eas build -p android --profile preview` → APK for assessors (sideload). No store upload.
3. Demo fallback: `npx expo start` QR (note view-shot limitation).
4. iOS needs macOS + Apple account — pending. Full steps in `docs/release/BUILD_AND_DISTRIBUTION.md`.
