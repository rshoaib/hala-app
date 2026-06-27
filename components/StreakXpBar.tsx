/**
 * StreakXpBar — the gamification summary shown on the Home/Today screen.
 *
 * Left: a fire-icon day-streak chip. Right: the current level, its title,
 * and a progress bar toward the next level. Purely presentational — it
 * renders whatever GamificationState it's given.
 */
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, FontSize, Spacing, BorderRadius, Surfaces, Shadows, fontStyle,
} from '@/constants/theme';
import {
  levelProgress,
  type GamificationState,
} from '@/services/gamificationService';

interface StreakXpBarProps {
  state: GamificationState;
  /** Dims the flame when today's streak isn't yet secured by practice. */
  active?: boolean;
}

export default function StreakXpBar({ state, active = true }: StreakXpBarProps) {
  const progress = levelProgress(state.xp);
  const streak = state.currentStreak;
  const flameColor = active && streak > 0 ? Colors.accent : Colors.textMuted;

  return (
    <View style={styles.row}>
      <View
        style={styles.streakCard}
        accessibilityRole="text"
        accessibilityLabel={`Current streak: ${streak} day${streak === 1 ? '' : 's'}`}
      >
        <Ionicons name="flame" size={22} color={flameColor} />
        <Text style={styles.streakNum}>{streak}</Text>
        <Text style={styles.streakLabel}>day{streak === 1 ? '' : 's'}</Text>
      </View>

      <View
        style={styles.xpCard}
        accessibilityRole="text"
        accessibilityLabel={`Level ${progress.level}, ${progress.title}. ${progress.intoLevel} of ${progress.levelSpan} XP to next level. ${state.xp} XP total.`}
      >
        <View style={styles.xpHead}>
          <Text style={styles.levelText}>Lvl {progress.level}</Text>
          <Text style={styles.titleText} numberOfLines={1}>
            {progress.title}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress.ratio * 100}%` }]} />
        </View>
        <Text style={styles.xpText}>
          {progress.intoLevel} / {progress.levelSpan} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  streakCard: {
    ...Surfaces.outlinedCard,
    ...Shadows.soft,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  streakNum: {
    ...fontStyle('black'),
    fontSize: FontSize.xl,
    color: Colors.text,
  },
  streakLabel: {
    ...fontStyle('semibold'),
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpCard: {
    ...Surfaces.outlinedCard,
    ...Shadows.soft,
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
  },
  xpHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  levelText: {
    ...fontStyle('bold'),
    fontSize: FontSize.sm,
    color: Colors.primaryDark,
  },
  titleText: {
    ...fontStyle('semibold'),
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    flexShrink: 1,
    marginLeft: Spacing.sm,
  },
  track: {
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  xpText: {
    ...fontStyle('semibold'),
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
