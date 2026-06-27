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
  surface: '#ECEDF5',             // cool neutral
  // Animated splash backdrop — MUST equal expo.splash.backgroundColor in
  // app.json so the native→animated splash handoff is seamless.
  splashBackground: '#FBF7F0',

  // ── Primary — Arabic Gold ──
  primary: '#D4A328',             // vivid gold (brighter, more saturated)
  primaryDark: '#8A6716',         // deep gold — AA-safe for small text/icons on light bg
  primaryMuted: 'rgba(212, 163, 40, 0.12)',
  primarySoft: 'rgba(212, 163, 40, 0.06)',
  goldGlow: 'rgba(212, 163, 40, 0.15)',     // soft gold halo (splash)
  goldGlowDeep: 'rgba(138, 103, 22, 0.15)', // deep-gold tint (splash progress track)

  // ── Accent — Desert Terracotta ──
  accent: '#F26B45',              // brighter terracotta
  accentDark: '#D45530',

  // ── Text — Cool Neutral Tones ──
  text: '#1E2340',                // cool near-black
  textSecondary: '#646A8C',       // cool gray — 4.5:1+ on background and card
  textMuted: '#8A90B0',           // cool muted — 3:1+ for icons/decorative only
  textOnPrimary: '#1E2340',       // dark text on gold — white fails contrast (2.3:1)

  // ── States ──
  disabled: '#AEB2CC',            // disabled button surface (cool neutral)

  // ── Borders ──
  border: '#DFE1EE',
  borderLight: '#ECEDF5',

  // ── Overlay ──
  shimmer: 'rgba(255, 255, 255, 0.15)',     // moving highlight sweep (splash)
} as const;

// ── Typography ──
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  hero: 44,
  arabicLarge: 38,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
} as const;

export const FontFamily = {
  regular: 'Nunito-Regular',
  medium: 'Nunito-Medium',
  semibold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extraBold: 'Nunito-ExtraBold',
  black: 'Nunito-Black',
} as const;

/**
 * Pairs the matching Nunito file (`fontFamily`) with its numeric
 * `fontWeight`. Android picks the weight from the loaded font file; iOS
 * needs the explicit `fontWeight` too. Use this instead of hand-writing
 * both properties so the two never drift out of sync.
 */
export function fontStyle(weight: keyof typeof FontFamily) {
  return {
    fontFamily: FontFamily[weight],
    fontWeight: FontWeight[weight],
  } as const;
}

// ── Composite Text Styles ──
export const TextStyles = {
  /** Small uppercase brand/section kicker shown above a title. */
  eyebrow: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: Colors.primaryDark,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  /** Tiny uppercase metadata label (e.g. result counts). */
  label: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
} as const;

// ── Spacing ──
// All keys are bare identifiers so every site uses dot access (Spacing.xxs).
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
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
  button: {
    shadowColor: '#B8891E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  soft: {
    shadowColor: '#6B7194',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

// ── Component Tokens ──
export const ComponentTokens = {
  button: { height: 56, borderRadius: 20, letterSpacing: 0.3 },
  buttonSm: { height: 44, borderRadius: 16 },
  input: { height: 48, borderRadius: BorderRadius.lg },
  pill: { height: 44 },
  /** Interactive icon-only control — 44pt minimum tap target. */
  iconButton: { size: 44 },
  /** Decorative circular icon badge (card leads, row affordances). */
  iconBadge: { size: 40 },
} as const;

// ── Composite Surfaces ──
export const Surfaces = {
  /**
   * Standard outlined card: white surface with a hairline border.
   * Radius and shadow vary by context, so they stay per-site.
   */
  outlinedCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
} as const;

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
