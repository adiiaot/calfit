/* const palette = {
  // Greens
  green500: '#2DDC8C',
  green600: '#0DAE6C',
  green900: '#065F46',

  // Blues
  blue400: '#6699FF',
  blue600: '#4375E6',

  // Neutrals dark
  dark900: '#0C0D10',
  dark800: '#15171C',
  dark700: '#1C1F26',
  dark600: '#2E323C',

  // Neutrals light
  light100: '#F6F7F9',
  light200: '#FFFFFF',
  light300: '#E4E6EA',

  // Text dark
  textDark100: '#F4F5F7',
  textDark200: '#8B92A1',
  textDark300: '#545A66',

  // Text light
  textLight100: '#15181F',
  textLight200: '#646B7B',
  textLight300: '#A4AAB6',

  // Accents
  purple: '#B280FF',
  orange: '#FFB347',
  red: '#FF5959',
  gold: '#FFD133',
  yellow: '#FFD133',
  amber: '#F59E0B',

  // Transparent
  transparent: 'transparent',
  black: '#000000',
  white: '#FFFFFF',
};

export const colors = {
  dark: {
    bg: palette.dark900,
    surface: palette.dark800,
    card: palette.dark700,
    border: palette.dark600,
    accent: palette.green500,
    accentDim: 'rgba(45,220,140,0.15)',
    accentSecond: palette.blue400,
    textPrimary: palette.textDark100,
    textSecondary: palette.textDark200,
    textMuted: palette.textDark300,
    purple: palette.purple,
    orange: palette.orange,
    red: palette.red,
    gold: palette.gold,
    tabBar: palette.dark800,
    tabBarActive: palette.green500,
    tabBarInactive: palette.textDark300,
  },
  light: {
    bg: palette.light100,
    surface: palette.light200,
    card: palette.light200,
    border: palette.light300,
    accent: palette.green600,
    accentDim: 'rgba(13,174,108,0.15)',
    accentSecond: palette.blue600,
    textPrimary: palette.textLight100,
    textSecondary: palette.textLight200,
    textMuted: palette.textLight300,
    purple: '#7B3FE4',
    orange: palette.amber,
    red: '#C0392B',
    gold: '#B7770D',
    tabBar: palette.light200,
    tabBarActive: palette.green600,
    tabBarInactive: palette.textLight300,
  },
  // Subscription tier colors
  tiers: {
    free: '#6B7280',
    pro: '#F59E0B',
    premium: '#0DAE6C',
  },
  // CalFit Points
  points: {
    primary: '#FFD133',
    secondary: '#F59E0B',
  },
};

export type ColorScheme = 'dark' | 'light';
export type ThemeColors = typeof colors.dark;



const palette = {
  // Greens
  green500: '#2DDC8C',
  green600: '#0DAE6C',
  green900: '#065F46',

  // Blues
  blue400: '#6699FF',
  blue600: '#4375E6',

  // Neutrals dark
  dark900: '#080A0F',
  dark800: '#0F1117',
  dark700: '#161820',
  dark600: '#1E2130',

  // Neutrals light
  light100: '#F2F4F8',
  light200: '#FFFFFF',
  light300: '#E2E5EC',

  // Text dark
  textDark100: '#F0F2F5',
  textDark200: '#8B92A1',
  textDark300: '#545A66',

  // Text light
  textLight100: '#12151F',
  textLight200: '#646B7B',
  textLight300: '#A4AAB6',

  // Accents
  purple: '#B280FF',
  orange: '#FFB347',
  red: '#FF5959',
  gold: '#FFD133',
  yellow: '#FFD133',
  amber: '#F59E0B',

  // Transparent
  transparent: 'transparent',
  black: '#000000',
  white: '#FFFFFF',
};

export const colors = {
  dark: {
    // ── Backgrounds ───────────────────────────────────────────
    // Deeper base — makes glass cards pop more
    bg:      palette.dark900,
    surface: palette.dark800,

    // ── Glass card effect ──────────────────────────────────────
    // Semi-transparent instead of solid — this is the key change.
    // rgba(255,255,255,0.05) = white tint at 5% opacity on dark bg
    // gives the frosted glass look Apple uses in iOS
    card:       'rgba(255, 255, 255, 0.06)',

    // ── Glass borders ──────────────────────────────────────────
    // Ultra-thin white border at low opacity = glass edge highlight
    // This is exactly what iOS uses for its card edges
    border:     'rgba(255, 255, 255, 0.10)',

    // ── Accent ────────────────────────────────────────────────
    accent:     palette.green500,
    accentDim:  'rgba(45, 220, 140, 0.12)',
    accentSecond: palette.blue400,

    // ── Text ──────────────────────────────────────────────────
    textPrimary:   palette.textDark100,
    textSecondary: palette.textDark200,
    textMuted:     palette.textDark300,

    // ── Semantic ──────────────────────────────────────────────
    purple: palette.purple,
    orange: palette.orange,
    red:    palette.red,
    gold:   palette.gold,

    // ── Tab bar ───────────────────────────────────────────────
    // Slightly more opaque than cards so it reads as a solid bar
    tabBar:         'rgba(8, 10, 15, 0.92)',
    tabBarActive:   palette.green500,
    tabBarInactive: palette.textDark300,

    // ── Glass utility values ───────────────────────────────────
    // Use these for modals, sheets, overlays
    glassStrong:  'rgba(255, 255, 255, 0.10)',
    glassMedium:  'rgba(255, 255, 255, 0.06)',
    glassSubtle:  'rgba(255, 255, 255, 0.03)',
    glassOverlay: 'rgba(0, 0, 0, 0.60)',
  },

  light: {
    // ── Backgrounds ───────────────────────────────────────────
    bg:      palette.light100,
    surface: palette.light200,

    // ── Glass card effect ──────────────────────────────────────
    // On light mode, glass = white at high opacity with slight blur feel
    // rgba(255,255,255,0.72) = translucent white — Apple's light mode card
    card:   'rgba(255, 255, 255, 0.75)',

    // ── Glass borders ──────────────────────────────────────────
    // Black tint at very low opacity = subtle edge on light background
    border: 'rgba(0, 0, 0, 0.08)',

    // ── Accent ────────────────────────────────────────────────
    accent:     palette.green600,
    accentDim:  'rgba(13, 174, 108, 0.12)',
    accentSecond: palette.blue600,

    // ── Text ──────────────────────────────────────────────────
    textPrimary:   palette.textLight100,
    textSecondary: palette.textLight200,
    textMuted:     palette.textLight300,

    // ── Semantic ──────────────────────────────────────────────
    purple: '#7B3FE4',
    orange: palette.amber,
    red:    '#C0392B',
    gold:   '#B7770D',

    // ── Tab bar ───────────────────────────────────────────────
    tabBar:         'rgba(255, 255, 255, 0.90)',
    tabBarActive:   palette.green600,
    tabBarInactive: palette.textLight300,

    // ── Glass utility values ───────────────────────────────────
    glassStrong:  'rgba(255, 255, 255, 0.85)',
    glassMedium:  'rgba(255, 255, 255, 0.72)',
    glassSubtle:  'rgba(255, 255, 255, 0.50)',
    glassOverlay: 'rgba(0, 0, 0, 0.30)',
  },

  // Subscription tier colors — unchanged
  tiers: {
    free:    '#6B7280',
    pro:     '#F59E0B',
    premium: '#0DAE6C',
  },

  // CalFit Points — unchanged
  points: {
    primary:   '#FFD133',
    secondary: '#F59E0B',
  },
};

export type ColorScheme = 'dark' | 'light';
export type ThemeColors = typeof colors.dark; */
/*
const palette = {
  // Greens
  green500: '#2DDC8C',
  green600: '#0DAE6C',
  green900: '#065F46',

  // Blues
  blue400: '#6699FF',
  blue600: '#4375E6',

  // Neutrals dark
  dark900: '#080A0F',
  dark800: '#0F1117',
  dark700: '#161820',  // solid card bg — was glass rgba
  dark600: '#1E2130',  // solid border — was glass rgba

  // Neutrals light
  light100: '#F2F4F8',
  light200: '#FFFFFF',
  light300: '#E2E5EC',

  // Text dark
  textDark100: '#F0F2F5',
  textDark200: '#8B92A1',
  textDark300: '#545A66',

  // Text light
  textLight100: '#12151F',
  textLight200: '#646B7B',
  textLight300: '#A4AAB6',

  // Accents
  purple: '#B280FF',
  orange: '#FFB347',
  red: '#FF5959',
  gold: '#FFD133',
  yellow: '#FFD133',
  amber: '#F59E0B',

  // Transparent
  transparent: 'transparent',
  black: '#000000',
  white: '#FFFFFF',
};

export const colors = {
  dark: {
    // ── Backgrounds ───────────────────────────────────────────
    bg:      palette.dark900,   // #080A0F
    surface: palette.dark800,   // #0F1117

    // ── Cards — SOLID, no transparency ────────────────────────
    // Previously rgba(255,255,255,0.06) which let background bleed through.
    // Now solid so text behind cards never shows through.
    card:   palette.dark700,    // #161820

    // ── Borders — SOLID ───────────────────────────────────────
    border: palette.dark600,    // #1E2130

    // ── Accent ────────────────────────────────────────────────
    accent:       palette.green500,
    accentDim:    'rgba(45, 220, 140, 0.12)',
    accentSecond: palette.blue400,

    // ── Text ──────────────────────────────────────────────────
    textPrimary:   palette.textDark100,
    textSecondary: palette.textDark200,
    textMuted:     palette.textDark300,

    // ── Semantic ──────────────────────────────────────────────
    purple: palette.purple,
    orange: palette.orange,
    red:    palette.red,
    gold:   palette.gold,

    // ── Tab bar — solid, no see-through ───────────────────────
    tabBar:         palette.dark800,
    tabBarActive:   palette.green500,
    tabBarInactive: palette.textDark300,

    // ── Overlay utilities (modals/sheets only) ─────────────────
    glassStrong:  'rgba(255, 255, 255, 0.10)',
    glassMedium:  'rgba(255, 255, 255, 0.06)',
    glassSubtle:  'rgba(255, 255, 255, 0.03)',
    glassOverlay: 'rgba(0, 0, 0, 0.60)',
  },

  light: {
    // ── Backgrounds ───────────────────────────────────────────
    bg:      palette.light100,  // #F2F4F8
    surface: palette.light200,  // #FFFFFF

    // ── Cards — SOLID, no transparency ────────────────────────
    // Previously rgba(255,255,255,0.75) which was translucent.
    // Now fully opaque white so nothing bleeds through.
    card:   palette.light200,   // #FFFFFF

    // ── Borders — SOLID ───────────────────────────────────────
    border: palette.light300,   // #E2E5EC

    // ── Accent ────────────────────────────────────────────────
    accent:       palette.green600,
    accentDim:    'rgba(13, 174, 108, 0.12)',
    accentSecond: palette.blue600,

    // ── Text ──────────────────────────────────────────────────
    textPrimary:   palette.textLight100,
    textSecondary: palette.textLight200,
    textMuted:     palette.textLight300,

    // ── Semantic ──────────────────────────────────────────────
    purple: '#7B3FE4',
    orange: palette.amber,
    red:    '#C0392B',
    gold:   '#B7770D',

    // ── Tab bar ───────────────────────────────────────────────
    tabBar:         palette.light200,
    tabBarActive:   palette.green600,
    tabBarInactive: palette.textLight300,

    // ── Overlay utilities ─────────────────────────────────────
    glassStrong:  'rgba(255, 255, 255, 0.85)',
    glassMedium:  'rgba(255, 255, 255, 0.72)',
    glassSubtle:  'rgba(255, 255, 255, 0.50)',
    glassOverlay: 'rgba(0, 0, 0, 0.30)',
  },

  // Subscription tier colors
  tiers: {
    free:    '#6B7280',
    pro:     '#F59E0B',
    premium: '#0DAE6C',
  },

  // CalFit Points
  points: {
    primary:   '#FFD133',
    secondary: '#F59E0B',
  },
};

export type ColorScheme = 'dark' | 'light';
export type ThemeColors = typeof colors.dark; */

// src/theme/colors.ts
// ─────────────────────────────────────────────────────────────
// CalFit Design System — v4 (Client Redesign April 2026)
//
// WHAT CHANGED FROM v3:
//   • Light mode bg shifted from grey-white → soft lavender (#F4F0FF)
//   • New calorie/hero card: deep indigo (#1A1445) replaces dark navy
//   • Gradient system added: pink→orange→yellow (scan food, streak, CTA)
//   • Day-ring colours added: teal, purple, orange, coral (weekly calendar)
//   • Water card: light blue gradient bg token
//   • Steps card: soft sage/cream gradient bg token
//   • Sleep card: soft lavender gradient bg token
//   • CalFit green kept for: Coach button, nav active, primary CTA
//   • Dark mode updated to match — indigo-tinted darks instead of blue-black
// ─────────────────────────────────────────────────────────────

const palette = {
  // ── Brand greens (CalFit primary — coach, nav, CTA) ────────
  green400: '#34D98A',
  green500: '#2DDC8C',
  green600: '#0DAE6C',
  green900: '#065F46',

  // ── Indigo / navy (hero card, dark surfaces) ───────────────
  indigo950: '#0D0A2E',   // deepest — dark mode bg
  indigo900: '#1A1445',   // calorie hero card bg
  indigo800: '#231B5B',   // dark mode surface
  indigo700: '#2D2470',   // dark mode card
  indigo600: '#3B308A',   // dark mode border

  // ── Lavender (light mode backgrounds) ──────────────────────
  lavender50:  '#F9F7FF',  // lightest — modal bg
  lavender100: '#F4F0FF',  // main app background
  lavender200: '#EAE3FF',  // surface / section bg
  lavender300: '#D8CEFF',  // borders, dividers

  // ── Gradient stops — Pink → Orange → Yellow ────────────────
  // Used on: Scan Food banner, streak badge, primary CTA buttons
  gradPink:   '#F0427C',
  gradOrange: '#FF6B35',
  gradYellow: '#FFB830',
  gradPinkLight: '#FF6EB0',  // lighter pink for card overlays

  // ── Day ring colours (weekly calendar) ─────────────────────
  ringTeal:   '#2BBCB0',   // SUN
  ringBlue:   '#4A90E2',   // MON
  ringPurple: '#9B6FE8',   // TUE
  ringOrange: '#FF8C42',   // WED
  ringCoral:  '#FF6B6B',   // THU
  ringPink:   '#F0427C',   // FRI (today — filled)
  ringGrey:   '#C8C8D8',   // SAT (future — muted)

  // ── Stat card backgrounds ───────────────────────────────────
  waterCardBg:  '#D6EEFF',  // light blue tint
  stepsCardBg:  '#EEF5E8',  // soft sage/cream
  sleepCardBg:  '#EDE8FF',  // soft lavender

  waterCardBgDark:  '#0F2A3F',
  stepsCardBgDark:  '#1A2F15',
  sleepCardBgDark:  '#1E1540',

  // ── Semantic colours ───────────────────────────────────────
  red400:    '#FF6B6B',
  red600:    '#C0392B',
  amber400:  '#FFB830',
  amber600:  '#F59E0B',
  purple400: '#B280FF',
  purple600: '#7B3FE4',

  // ── Neutrals ───────────────────────────────────────────────
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',

  // ── Text — light mode ──────────────────────────────────────
  textL100: '#12101F',   // headings
  textL200: '#4A4670',   // body
  textL300: '#9490B0',   // muted / placeholder

  // ── Text — dark mode ───────────────────────────────────────
  textD100: '#F0EEF8',   // headings
  textD200: '#9B96C0',   // body
  textD300: '#5C5880',   // muted / placeholder
};

// ─────────────────────────────────────────────────────────────
// GRADIENT DEFINITIONS
// Import these wherever you use LinearGradient
// ─────────────────────────────────────────────────────────────
export const gradients = {
  // Scan Food banner + primary CTA
  pinkOrange: [palette.gradPink, palette.gradOrange],
  // Streak badge + earnings highlights
  orangeYellow: [palette.gradOrange, palette.gradYellow],
  // Full warm sweep (3-stop)
  pinkOrangeYellow: [palette.gradPink, palette.gradOrange, palette.gradYellow],
  // Calorie hero card overlay (subtle, on top of indigo bg)
  heroOverlay: ['rgba(26,20,69,0)', 'rgba(13,10,46,0.95)'],
  // Lavender page header fade
  lavenderFade: [palette.lavender100, palette.lavender50],
  // Water card
  waterCard: ['#C8E6FF', '#E8F4FF'],
  // Steps card
  stepsCard: ['#D8EDCC', '#F0F7E8'],
  // Sleep card
  sleepCard: ['#D8CEFF', '#EDE8FF'],
  // CalFit green (coach button, primary actions)
  green: [palette.green500, palette.green600],
};

// ─────────────────────────────────────────────────────────────
// DAY RING COLOURS — weekly calendar strip
// Index 0 = Sunday
// ─────────────────────────────────────────────────────────────
export const dayRingColors = [
  palette.ringTeal,    // 0 SUN
  palette.ringBlue,    // 1 MON
  palette.ringPurple,  // 2 TUE
  palette.ringOrange,  // 3 WED
  palette.ringCoral,   // 4 THU
  palette.ringPink,    // 5 FRI
  palette.ringGrey,    // 6 SAT
];

// ─────────────────────────────────────────────────────────────
// THEME COLOURS — light / dark
// ─────────────────────────────────────────────────────────────
export const colors = {

  light: {
    // ── Backgrounds ─────────────────────────────────────────
    bg:      palette.lavender100,   // #F4F0FF — soft lavender page bg
    surface: palette.lavender50,    // #F9F7FF — modal / sheet bg
    card:    palette.white,         // #FFFFFF — standard cards

    // ── Hero / calorie card ──────────────────────────────────
    heroCard: palette.indigo900,    // #1A1445 — deep indigo

    // ── Stat card backgrounds ────────────────────────────────
    waterCard: palette.waterCardBg,
    stepsCard: palette.stepsCardBg,
    sleepCard: palette.sleepCardBg,

    // ── Borders ─────────────────────────────────────────────
    border:  palette.lavender300,   // #D8CEFF

    // ── Brand accent (CalFit green) ──────────────────────────
    accent:      palette.green600,
    accentDim:   'rgba(13,174,108,0.12)',
    accentSecond: '#4A90E2',

    // ── Gradient accent (pink→orange→yellow) ─────────────────
    gradStart:  palette.gradPink,
    gradMid:    palette.gradOrange,
    gradEnd:    palette.gradYellow,

    // ── Text ────────────────────────────────────────────────
    textPrimary:   palette.textL100,
    textSecondary: palette.textL200,
    textMuted:     palette.textL300,
    textOnHero:    palette.white,    // text on indigo hero card
    textOnGrad:    palette.white,    // text on gradient banners

    // ── Semantic ────────────────────────────────────────────
    red:    palette.red600,
    amber:  palette.amber600,
    purple: palette.purple600,
    gold:   '#B7770D',

    // ── Tab bar ─────────────────────────────────────────────
    tabBar:         palette.white,
    tabBarActive:   palette.green600,
    tabBarInactive: palette.textL300,

    // ── Overlays ────────────────────────────────────────────
    overlay:      'rgba(18,16,31,0.40)',
    glassStrong:  'rgba(255,255,255,0.90)',
    glassMedium:  'rgba(255,255,255,0.70)',
    glassSubtle:  'rgba(255,255,255,0.45)',
  },

  dark: {
    // ── Backgrounds ─────────────────────────────────────────
    bg:      palette.indigo950,     // #0D0A2E — deep indigo-black
    surface: palette.indigo900,     // #1A1445
    card:    palette.indigo800,     // #231B5B

    // ── Hero / calorie card ──────────────────────────────────
    heroCard: palette.indigo900,    // same indigo — reads as card on darker bg

    // ── Stat card backgrounds ────────────────────────────────
    waterCard: palette.waterCardBgDark,
    stepsCard: palette.stepsCardBgDark,
    sleepCard: palette.sleepCardBgDark,

    // ── Borders ─────────────────────────────────────────────
    border:  palette.indigo600,     // #3B308A

    // ── Brand accent (CalFit green) ──────────────────────────
    accent:      palette.green500,
    accentDim:   'rgba(45,220,140,0.15)',
    accentSecond: '#6699FF',

    // ── Gradient accent (pink→orange→yellow) ─────────────────
    gradStart:  palette.gradPink,
    gradMid:    palette.gradOrange,
    gradEnd:    palette.gradYellow,

    // ── Text ────────────────────────────────────────────────
    textPrimary:   palette.textD100,
    textSecondary: palette.textD200,
    textMuted:     palette.textD300,
    textOnHero:    palette.white,
    textOnGrad:    palette.white,

    // ── Semantic ────────────────────────────────────────────
    red:    palette.red400,
    amber:  palette.amber400,
    purple: palette.purple400,
    gold:   palette.amber400,

    // ── Tab bar ─────────────────────────────────────────────
    tabBar:         palette.indigo900,
    tabBarActive:   palette.green500,
    tabBarInactive: palette.textD300,

    // ── Overlays ────────────────────────────────────────────
    overlay:      'rgba(0,0,0,0.65)',
    glassStrong:  'rgba(255,255,255,0.10)',
    glassMedium:  'rgba(255,255,255,0.06)',
    glassSubtle:  'rgba(255,255,255,0.03)',
  },

  // ── Subscription tier badges ──────────────────────────────
  tiers: {
    free:    '#6B7280',
    pro:     palette.amber600,
    premium: palette.green600,
  },

  // ── CalFit Points ─────────────────────────────────────────
  points: {
    primary:   palette.amber400,
    secondary: palette.amber600,
  },
};

export type ColorScheme = 'dark' | 'light';
export type ThemeColors = typeof colors.light;