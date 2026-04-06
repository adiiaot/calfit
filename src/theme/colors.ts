const palette = {
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