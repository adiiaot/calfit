import { Dimensions, Platform, StatusBar, PixelRatio } from 'react-native';

// ── SCREEN DIMENSIONS ─────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions — designed on iPhone 14 (390 x 844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// ── SCALE FUNCTIONS ───────────────────────────────────────────

/**
 * Scale a horizontal dimension relative to screen width.
 * Use for widths, horizontal padding, margins, font sizes.
 */
export const scaleX = (size: number): number => {
  return Math.round(PixelRatio.roundToNearestPixel(
    (SCREEN_WIDTH / BASE_WIDTH) * size
  ));
};

/**
 * Scale a vertical dimension relative to screen height.
 * Use for heights, vertical padding, margins.
 */
export const scaleY = (size: number): number => {
  return Math.round(PixelRatio.roundToNearestPixel(
    (SCREEN_HEIGHT / BASE_HEIGHT) * size
  ));
};

/**
 * Moderate scale — blends screen width scaling with a factor.
 * Use for font sizes and elements that shouldn't scale too aggressively.
 * factor 0 = no scaling, factor 1 = full scaling. Default 0.5.
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return Math.round(size + (scaleX(size) - size) * factor);
};

// ── SAFE AREA HELPERS ─────────────────────────────────────────

/**
 * Top safe area — accounts for status bar on Android and notch on iPhone.
 * This is the main fix for the Android top layout issue.
 */
export const SAFE_TOP = Platform.select({
  android: StatusBar.currentHeight ?? 24,
  ios: 0, // iOS handles this via SafeAreaView
  default: 0,
});

/**
 * Bottom safe area — accounts for home indicator on iPhone
 * and navigation bar on Android.
 */
export const SAFE_BOTTOM = Platform.select({
  android: 0,
  ios: 0,
  default: 0,
});

// ── DEVICE DETECTION ──────────────────────────────────────────
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * True if screen width is tablet-sized (iPad, Android tablet).
 * Use to show side-by-side layouts on larger screens.
 */
export const isTablet = SCREEN_WIDTH >= 768;

/**
 * True if this is a small phone (iPhone SE, older Android).
 */
export const isSmallDevice = SCREEN_WIDTH < 375;

/**
 * True if this is a large phone (iPhone Pro Max, Samsung Ultra).
 */
export const isLargeDevice = SCREEN_WIDTH >= 430;

// ── FONT SCALING ──────────────────────────────────────────────

/**
 * Responsive font size.
 * Scales gently — never too small on small screens, never too large on big ones.
 */
export const rf = (size: number): number => {
  const scaled = moderateScale(size, 0.45);
  // Clamp to prevent extreme sizes
  const min = size * 0.85;
  const max = size * 1.25;
  return Math.round(Math.min(Math.max(scaled, min), max));
};

// ── SPACING SCALE ─────────────────────────────────────────────

/**
 * Responsive spacing — scales with screen width.
 * Use for padding, margin, gap.
 */
export const rs = (size: number): number => scaleX(size);

// ── SCREEN INFO ───────────────────────────────────────────────
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isIOS,
  isAndroid,
  isTablet,
  isSmallDevice,
  isLargeDevice,
};

// ── LAYOUT PRESETS ────────────────────────────────────────────
/**
 * Standard horizontal padding that scales with screen width.
 */
export const SCREEN_PADDING_H = scaleX(20);

/**
 * Card width — screen width minus horizontal padding on both sides.
 */
export const CARD_WIDTH = SCREEN_WIDTH - SCREEN_PADDING_H * 2;

/**
 * Grid item width for a 2-column grid with gap.
 */
export const GRID_2_COL = (gap = 12) =>
  (SCREEN_WIDTH - SCREEN_PADDING_H * 2 - gap) / 2;

/**
 * Grid item width for a 3-column grid with gap.
 */
export const GRID_3_COL = (gap = 8) =>
  (SCREEN_WIDTH - SCREEN_PADDING_H * 2 - gap * 2) / 3;