# CalFit — Responsiveness Audit (2026-10-14)

## Fixed this pass
- `AndroidSafeView`: now applies top+bottom+left+right insets on Android (was top-only). iOS uses SafeAreaView; web plain view.
- Tab bar: respects `insets.bottom` (`max(insets.bottom,8)`), no longer hard-covers gesture nav.
- Web: `user-scalable=no` removed for zoom accessibility.

## Remaining (verified by code read, needs device matrix)
1. **Charts**: `TrendCharts` static `Dimensions`, `barW=floor((W-n*4)/n)` → 30/90-day bars ~5px, labels blank, color-only (`#2DDC8C` vs `#F59E0B`), no ScrollView, no a11y. Fix: horizontal ScrollView + min bar width 8px + data-table alternative + patterns/labels.
2. **RadialMenu**: static `SCREEN_W/H`, `RING_RADIUS=140`, `cy=SCREEN_H-72` — breaks landscape/tablet/foldables. Fix: `useWindowDimensions` + relative radii.
3. **Modals**: 8+ `Modal transparent` (Sleep, Calorie, FitnessProfile, Milestone) lack `KeyboardAvoidingView` on Android and `statusBarTranslucent`; bio/notes inputs covered by keyboard. Fix per-modal KAV + bottom inset.
4. **Keyboard**: AICoach manual listeners + `scrollToEnd` fights keyboard; PartnerChat/Notes/EditProfile `behavior=undefined` on Android. Fix: unified KAV (`padding` iOS, `height` Android) + correct `keyboardVerticalOffset`.
5. **Small text**: `fontSize 9` tab labels, chart labels; no `maxFontSizeMultiplier`. Fix: min 11sp, allow scaling, test at 200% font.
6. **StatusBar**: `AndroidSafeView` no longer forces `barStyle`; follow-up: set per-theme (`dark-content` light mode) and remove duplicate `StatusBar.setTranslucent` in navigator.

## Device matrix — NOT EXECUTED (no devices in this environment)
Small Android (360dp), large Android (412dp+), iPhone SE/14/16 + Dynamic Island, tablet, landscape, font-scale 1.3x/2x, keyboard open, dark/light. Mark all as pending in TEST_PLAN.
