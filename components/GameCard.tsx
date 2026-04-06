/**
 * GameCard — Claymorphic block-style card for game selection in Play tab
 * Solid color background with 3D clay depth via border treatment
 */
import { useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, FontWeight, Spacing, BorderRadius, Shadows, ComponentTokens } from '@/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

/** Darken a hex color by a given amount (0–1) */
function darkenColor(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const num = parseInt(c, 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** Lighten a hex color by a given amount (0–1) */
function lightenColor(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const num = parseInt(c, 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const LOCKED_COLOR = '#9CA3C4';
const CARD_RADIUS = 24;

interface GameCardProps {
  title: string;
  emoji: string;
  tagline?: string;
  gradient: readonly [string, string, ...string[]];
  onPress: () => void;
  badge?: string;
  statusBadge?: string;
  statusColor?: string;
  locked?: boolean;
  icon?: IoniconsName;
}

export default function GameCard({
  title,
  emoji,
  tagline,
  gradient,
  onPress,
  badge,
  statusBadge,
  statusColor,
  locked = false,
  icon,
}: GameCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  };

  const bgColor = locked ? LOCKED_COLOR : gradient[0];
  const borderTopColor = lightenColor(bgColor, 0.15);
  const borderBottomColor = darkenColor(bgColor, 0.18);

  return (
    <TouchableWithoutFeedback
      onPress={locked ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: bgColor,
              borderTopColor,
              borderBottomColor,
              borderLeftColor: bgColor,
              borderRightColor: bgColor,
            },
          ]}
        >
          {locked && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={28} color="rgba(255,255,255,0.7)" />
            </View>
          )}

          {statusBadge && (
            <View style={[styles.statusBadge, statusColor ? { backgroundColor: statusColor } : {}]}>
              <Text style={styles.statusText}>{statusBadge}</Text>
            </View>
          )}

          <Text style={styles.emoji}>{emoji}</Text>
          {icon && <Ionicons name={icon} size={32} color="rgba(255,255,255,0.9)" />}
          <Text style={styles.title}>{title}</Text>
          {tagline && <Text style={styles.tagline}>{tagline}</Text>}

          {badge && (
            <View style={styles.badge}>
              <Ionicons name="star" size={12} color={Colors.xpGold} />
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    ...Shadows.cardLifted,
  },
  card: {
    borderRadius: CARD_RADIUS,
    minHeight: ComponentTokens.gameCard.minHeight,
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 2,
    borderBottomWidth: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  emoji: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    color: '#FFF',
    textAlign: 'center',
  },
  tagline: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: Spacing.sm,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    color: '#FFF',
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 5,
  },
  statusText: {
    fontSize: FontSize['2xs'],
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
