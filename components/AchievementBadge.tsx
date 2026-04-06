/**
 * AchievementBadge — Badge card for achievements
 * Unlocked: gold glow border, full color
 * Locked: silhouette with "?" overlay
 */
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface AchievementBadgeProps {
  emoji: string;
  title: string;
  description?: string;
  unlocked: boolean;
}

export default function AchievementBadge({
  emoji,
  title,
  description,
  unlocked,
}: AchievementBadgeProps) {
  return (
    <View style={[styles.badge, unlocked && styles.badgeUnlocked]}>
      <View style={[styles.iconWrap, unlocked && styles.iconWrapUnlocked]}>
        {unlocked ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : (
          <Text style={styles.locked}>?</Text>
        )}
      </View>
      <Text
        style={[styles.title, !unlocked && styles.titleLocked]}
        numberOfLines={2}
      >
        {unlocked ? title : '???'}
      </Text>
      {description && unlocked && (
        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  badgeUnlocked: {
    backgroundColor: Colors.card,
    borderColor: Colors.cardBorder,
    ...Shadows.glow,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  iconWrapUnlocked: {
    backgroundColor: Colors.primaryMuted,
  },
  emoji: {
    fontSize: 24,
  },
  locked: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
  },
  title: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  titleLocked: {
    color: Colors.textMuted,
  },
  description: {
    fontSize: FontSize['2xs'],
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});
