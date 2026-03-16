// Investment Companion App — Design System & Theme
// Dark theme inspired by Zerodha Kite + Groww hybrid

export const Colors = {
  // Backgrounds (Light mode as default)
  background: '#F8F8F8',    // Light grey background
  surface: '#FFFFFF',       // White cards
  surfaceLight: '#F0F0F0',
  surfaceElevated: '#FFFFFF',

  // Brand / Accent
  primary: '#00B386',       // Groww primary green
  primaryLight: '#44C28A',  // Accent green
  primaryDark: '#00966F',
  primaryGlow: 'rgba(0, 179, 134, 0.12)',

  // Semantic
  gain: '#00B386',          // Regular gain
  gainLight: '#44C28A',
  gainBg: 'rgba(0, 179, 134, 0.1)',
  loss: '#E74C3C',          // Red
  lossLight: '#E9685B',
  lossBg: 'rgba(231, 76, 60, 0.1)',
  warning: '#F5A623',
  warningBg: 'rgba(245, 166, 35, 0.12)',
  info: '#4A90E2',
  infoBg: 'rgba(74, 144, 226, 0.12)',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#8C8C8C',
  textTertiary: '#A0A0A0',
  textInverse: '#FFFFFF',

  // Borders
  border: '#F0F0F0',
  borderLight: '#F8F8F8',

  // Chart specific
  chartGrid: '#F0F0F0',
  chartCrosshair: '#00B386',
  candleGreen: '#00B386',
  candleRed: '#E74C3C',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,    // Soft rounded corners
  xl: 16,    // Larger cards
  xxl: 24,
  full: 999,
};

export const FontSize = {
  xs: 10,
  sm: 12,    // Labels/captions
  md: 14,
  lg: 16,    // Stock names
  xl: 18,
  xxl: 24,   // Large numbers
  xxxl: 28,  // Largest numbers (Portfolios)
  display: 34,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  }),
};
