/**
 * Hala App — "Desert Gold Claymorphism" Design System
 * Culturally authentic Emirati identity with cool, modern claymorphic feel.
 *
 * Color psychology:
 * - Arabic Gold → heritage, mosque domes, desert warmth, achievement
 * - Deep Emerald → UAE flag, growth, success, nature
 * - Terracotta → desert sunset, energy, urgency, streaks
 * - Cool Off-White → readability, elegance, modern clarity
 */

export const Colors = {
  // ── Core Backgrounds ──
  background: '#F6F7FB',          // cool off-white (modern, clean)
  card: '#FFFFFF',
  cardElevated: '#F0F1F8',        // cool subtle
  surface: '#ECEDF5',             // cool neutral
  surfaceLight: '#F4F5FB',        // lighter variant

  // ── Primary — Arabic Gold ──
  primary: '#D4A328',             // vivid gold (brighter, more saturated)
  primaryLight: '#F0C95C',
  primaryDark: '#B8891E',
  primaryMuted: 'rgba(212, 163, 40, 0.12)',
  primarySoft: 'rgba(212, 163, 40, 0.06)',

  // ── Secondary — UAE Emerald ──
  secondary: '#1B9B6E',           // vivid emerald (more vibrant)
  secondaryLight: '#3DBF8E',
  secondaryDark: '#148A5C',
  secondaryMuted: 'rgba(27, 155, 110, 0.12)',

  // ── Accent — Desert Terracotta ──
  accent: '#F26B45',              // brighter terracotta
  accentLight: '#F89070',
  accentDark: '#D45530',
  accentMuted: 'rgba(242, 107, 69, 0.12)',

  // ── UAE Flag Colors ──
  uaeRed: '#EF3340',
  uaeGreen: '#00843D',
  uaeBlack: '#1C1C1E',
  uaeWhite: '#FFFFFF',

  // ── Text — Cool Neutral Tones ──
  text: '#1E2340',                // cool near-black
  textSecondary: '#6B7194',       // cool gray
  textMuted: '#A0A6C4',           // cool muted
  textOnPrimary: '#FFFFFF',
  textOnDark: '#F0F1F8',

  // ── Status ──
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',

  // ── Gamification ──
  fire: '#FF6B35',
  fireHot: '#FF4500',
  fireMax: '#FFD700',
  xpGold: '#FFD700',
  xpPurple: '#A855F7',
  crown: '#FFD700',
  coin: '#F5A623',
  levelGold: '#D4A328',

  // ── Borders ──
  border: '#DFE1EE',
  borderLight: '#ECEDF5',
  cardBorder: 'rgba(212, 163, 40, 0.12)',

  // ── Overlay ──
  overlay: 'rgba(30, 35, 64, 0.5)',
  overlayLight: 'rgba(30, 35, 64, 0.3)',
  glassBg: 'rgba(255, 255, 255, 0.95)',
} as const;

// ── Gradient Presets ──
export const Gradients = {
  gold: ['#D4A328', '#F0C95C'] as const,
  goldDark: ['#B8891E', '#D4A328'] as const,
  emerald: ['#1B9B6E', '#3DBF8E'] as const,
  fire: ['#FF6B35', '#FF4500'] as const,
  sunset: ['#F26B45', '#F89070'] as const,
  warmBg: ['#F6F7FB', '#F0F1F8'] as const,
  darkGold: ['#1E2340', '#2D3460'] as const,
  heroCard: ['#D4A328', '#B8891E'] as const,
  correct: ['#22C55E', '#16A34A'] as const,
  incorrect: ['#EF4444', '#DC2626'] as const,
  purple: ['#A855F7', '#9333EA'] as const,
  arcade: ['#F26B45', '#D45530'] as const,
  boss: ['#1E2340', '#0F1225'] as const,
} as const;

// ── Typography ──
export const FontSize = {
  '2xs': 9,
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  '2xl': 24,
  xxl: 28,
  '3xl': 32,
  xxxl: 36,
  hero: 44,
  arabic: 28,
  arabicLarge: 38,
  arabicHero: 56,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
};

export const FontFamily = {
  regular: 'Nunito-Regular',
  medium: 'Nunito-Medium',
  semibold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extraBold: 'Nunito-ExtraBold',
  black: 'Nunito-Black',
} as const;

// ── Spacing ──
export const Spacing = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  '3xl': 64,
} as const;

// ── Border Radius ──
export const BorderRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  round: 32,
  full: 9999,
} as const;

// ── Shadows — Claymorphic Layered Shadows ──
export const Shadows = {
  card: {
    shadowColor: '#6B7194',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLifted: {
    shadowColor: '#6B7194',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  button: {
    shadowColor: '#B8891E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: '#D4A328',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  soft: {
    shadowColor: '#6B7194',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  clay: {
    shadowColor: '#6B7194',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  sm: {
    shadowColor: '#6B7194',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#6B7194',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  tabBar: {
    shadowColor: '#1E2340',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// ── Component Tokens ──
export const ComponentTokens = {
  button: { height: 56, borderRadius: 20 },
  buttonSm: { height: 44, borderRadius: 16 },
  card: { borderRadius: 24, padding: 20 },
  input: { height: 52, borderRadius: 16 },
  avatar: { size: 48, borderRadius: 24 },
  pill: { height: 36, borderRadius: 18, paddingH: 16 },
  progressBar: { height: 10, borderRadius: 5 },
  tabBar: { height: 72, borderRadius: 32, margin: 16 },
  gameCard: { borderRadius: 24, minHeight: 170 },
  badge: { size: 32, borderRadius: 16 },
} as const;

// ── Claymorphic Style Helpers ──
export const ClayStyle = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(223, 225, 238, 0.6)',
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomColor: 'rgba(107, 113, 148, 0.12)',
  },
  cardSolid: (bgColor: string) => ({
    backgroundColor: bgColor,
    borderRadius: 24,
    borderWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
    borderRightColor: 'rgba(0, 0, 0, 0.06)',
    borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  }),
};

// ── React Navigation Theme ──
export const HalaTheme = {
  dark: false as const,
  colors: {
    background: Colors.background,
    card: Colors.card,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.primary,
    notification: Colors.accent,
  },
  fonts: {
    regular: { fontFamily: 'Nunito-Regular', fontWeight: '400' as const },
    medium: { fontFamily: 'Nunito-Medium', fontWeight: '500' as const },
    bold: { fontFamily: 'Nunito-Bold', fontWeight: '700' as const },
    heavy: { fontFamily: 'Nunito-Black', fontWeight: '900' as const },
  },
};
