/**
 * Progress Tab — Streaks, XP, listening time, badges
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Colors, Spacing, FontSize, FontWeight, FontFamily,
  BorderRadius, Shadows, ClayStyle,
} from '@/constants/theme';
import * as Storage from '@/services/storageService';

const { width } = Dimensions.get('window');
const BAR_WIDTH = (width - Spacing.md * 2 - Spacing.lg * 2 - 6 * 8) / 7;

export default function ProgressScreen() {
  const [xp, setXP] = useState(0);
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState<Storage.StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    freezesAvailable: 0,
    totalDaysActive: 0,
  });
  const [listening, setListening] = useState<Storage.ListeningStats>({
    totalMinutes: 0,
    weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
    lastListenDate: '',
  });
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [alphabetProgress, setAlphabetProgress] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const [xpVal, coinsVal, streakData, listeningData, missions, alphabet] = await Promise.all([
      Storage.getXP(),
      Storage.getCoins(),
      Storage.getStreak(),
      Storage.getListeningStats(),
      Storage.getCompletedMissions(),
      Storage.getAlphabetProgress(),
    ]);
    setXP(xpVal);
    setCoins(coinsVal);
    setStreak(streakData);
    setListening(listeningData);
    setCompletedMissions(missions);
    setAlphabetProgress(alphabet);
  }

  const levelInfo = Storage.getLevel(xp);
  const streakEmoji = streak.currentStreak >= 30 ? '🔥🔥🔥' : streak.currentStreak >= 15 ? '🔥🔥' : streak.currentStreak >= 5 ? '🔥' : '❄️';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxListening = Math.max(...listening.weeklyMinutes, 1);

  const badges = [
    { id: 'first-lesson', emoji: '📖', title: 'First Lesson', unlocked: completedMissions.length > 0 },
    { id: 'streak-5', emoji: '🔥', title: '5-Day Streak', unlocked: streak.longestStreak >= 5 },
    { id: 'streak-15', emoji: '🔥', title: '15-Day Streak', unlocked: streak.longestStreak >= 15 },
    { id: 'streak-30', emoji: '👑', title: '30-Day Streak', unlocked: streak.longestStreak >= 30 },
    { id: 'alphabet', emoji: '🔤', title: 'All Letters', unlocked: alphabetProgress.length >= 28 },
    { id: 'level-1', emoji: '🏆', title: 'Level 1 Complete', unlocked: completedMissions.length >= 5 },
    { id: 'listener-60', emoji: '🎧', title: '1 Hour Listening', unlocked: listening.totalMinutes >= 60 },
    { id: 'listener-300', emoji: '📻', title: '5 Hours Listening', unlocked: listening.totalMinutes >= 300 },
    { id: 'xp-1000', emoji: '⭐', title: '1000 XP', unlocked: xp >= 1000 },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Streak Card */}
      <View
        style={[
          styles.streakCard,
          { backgroundColor: streak.currentStreak > 0 ? Colors.accent : '#9CA3C4' },
        ]}
      >
        <Text style={styles.streakFireEmoji}>{streakEmoji}</Text>
        <Text style={styles.streakCount}>{streak.currentStreak}</Text>
        <Text style={styles.streakLabel}>Day Streak</Text>
        <View style={styles.streakMeta}>
          <View style={styles.streakMetaItem}>
            <Text style={styles.streakMetaValue}>{streak.longestStreak}</Text>
            <Text style={styles.streakMetaLabel}>Longest</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakMetaItem}>
            <Text style={styles.streakMetaValue}>{streak.totalDaysActive}</Text>
            <Text style={styles.streakMetaLabel}>Total Days</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakMetaItem}>
            <Text style={styles.streakMetaValue}>{streak.freezesAvailable}</Text>
            <Text style={styles.streakMetaLabel}>Freezes</Text>
          </View>
        </View>
      </View>

      {/* XP & Level Card */}
      <View style={styles.xpCard}>
        <View style={styles.xpHeader}>
          <View>
            <Text style={styles.xpTitle}>Level {levelInfo.level}</Text>
            <Text style={styles.xpTotal}>{xp} XP total</Text>
          </View>
          <View style={styles.coinBadge}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.coinText}>{coins}</Text>
          </View>
        </View>
        <View style={styles.xpBarBg}>
          <View
            style={[
              styles.xpBarFill,
              { width: `${Math.min((levelInfo.currentXP / levelInfo.nextLevelXP) * 100, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.xpProgress}>
          {levelInfo.currentXP} / {levelInfo.nextLevelXP} to Level {levelInfo.level + 1}
        </Text>
      </View>

      {/* Listening Stats */}
      <View style={styles.listeningCard}>
        <Text style={styles.cardTitle}>🎧 Listening Time</Text>
        <Text style={styles.listeningTotal}>{listening.totalMinutes} minutes total</Text>

        <View style={styles.barChart}>
          {listening.weeklyMinutes.map((minutes, i) => (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(minutes / maxListening) * 100}%`,
                      backgroundColor: i === new Date().getDay() ? Colors.primary : Colors.surface,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, i === new Date().getDay() && styles.barLabelActive]}>
                {days[i]}
              </Text>
              {minutes > 0 && <Text style={styles.barValue}>{minutes}m</Text>}
            </View>
          ))}
        </View>
      </View>

      {/* Achievements */}
      <Text style={styles.sectionTitle}>🏅 Achievements</Text>
      <View style={styles.badgeGrid}>
        {badges.map((badge) => (
          <View
            key={badge.id}
            style={[styles.badgeCard, !badge.unlocked && styles.badgeLocked]}
          >
            <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
            <Text style={[styles.badgeTitle, !badge.unlocked && styles.badgeTitleLocked]}>
              {badge.title}
            </Text>
            {badge.unlocked && <Text style={styles.badgeUnlocked}>✓</Text>}
          </View>
        ))}
      </View>

      {/* Stats Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>📊 Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Missions Completed</Text>
          <Text style={styles.summaryValue}>{completedMissions.length} / 5</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Letters Learned</Text>
          <Text style={styles.summaryValue}>{alphabetProgress.length} / 28</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Words Learned</Text>
          <Text style={styles.summaryValue}>~{completedMissions.length * 10}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Listening Time</Text>
          <Text style={styles.summaryValue}>{listening.totalMinutes} min</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },
  streakCard: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(0,0,0,0.06)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    ...Shadows.cardLifted,
  },
  streakFireEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  streakCount: {
    color: '#FFF',
    fontSize: 56,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
  },
  streakLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.semibold,
  },
  streakMeta: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.lg,
  },
  streakMetaItem: {
    alignItems: 'center',
  },
  streakMetaValue: {
    color: '#FFF',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
  streakMetaLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  streakDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  xpCard: {
    ...ClayStyle.card,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    ...Shadows.card,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  xpTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
  xpTotal: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  coinEmoji: {
    fontSize: 16,
  },
  coinText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
  },
  xpBarBg: {
    height: 12,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  xpProgress: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  listeningCard: {
    ...ClayStyle.card,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    ...Shadows.card,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.sm,
  },
  listeningTotal: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barColumn: {
    alignItems: 'center',
    width: BAR_WIDTH,
  },
  barContainer: {
    width: BAR_WIDTH - 4,
    height: 80,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    minHeight: 4,
    borderRadius: 4,
  },
  barLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  barLabelActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  barValue: {
    color: Colors.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badgeCard: {
    width: (width - Spacing.md * 2 - Spacing.sm * 2) / 3,
    ...ClayStyle.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  badgeLocked: {
    opacity: 0.4,
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  badgeTitle: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
  badgeTitleLocked: {
    color: Colors.textMuted,
  },
  badgeUnlocked: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginTop: 2,
  },
  summaryCard: {
    ...ClayStyle.card,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadows.card,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  summaryValue: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
});
