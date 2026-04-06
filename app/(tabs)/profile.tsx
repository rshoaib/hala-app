/**
 * Profile Tab — Stats, achievements, radio, settings
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Colors, FontSize, FontWeight, FontFamily, Spacing,
  BorderRadius, Shadows, ClayStyle,
} from '@/constants/theme';
import StatPill from '@/components/StatPill';
import WeekDots from '@/components/WeekDots';
import AchievementBadge from '@/components/AchievementBadge';
import SectionHeader from '@/components/SectionHeader';
import GoldButton from '@/components/GoldButton';
import * as Storage from '@/services/storageService';
import { missions } from '@/data/missions';
import { alphabet } from '@/data/alphabet';

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_lesson', emoji: '📖', title: 'First Lesson', check: (d: any) => d.completedMissions.length >= 1 },
  { id: 'streak_5', emoji: '🔥', title: '5-Day Streak', check: (d: any) => d.streak.longestStreak >= 5 },
  { id: 'streak_15', emoji: '🔥', title: '15-Day Streak', check: (d: any) => d.streak.longestStreak >= 15 },
  { id: 'streak_30', emoji: '🏆', title: '30-Day Streak', check: (d: any) => d.streak.longestStreak >= 30 },
  { id: 'all_letters', emoji: '🔤', title: 'All Letters', check: (d: any) => d.alphabetProgress.length >= alphabet.length },
  { id: 'level1', emoji: '⭐', title: 'Level 1 Done', check: (d: any) => d.completedMissions.length >= missions.length },
  { id: 'listen_60', emoji: '🎧', title: '1 Hour Listening', check: (d: any) => d.listening.totalMinutes >= 60 },
  { id: 'listen_300', emoji: '🎵', title: '5 Hours Listening', check: (d: any) => d.listening.totalMinutes >= 300 },
  { id: 'xp_1000', emoji: '💎', title: '1000 XP', check: (d: any) => d.xp >= 1000 },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [xp, setXP] = useState(0);
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState<Storage.StreakData>({ currentStreak: 0, longestStreak: 0, lastActiveDate: '', freezesAvailable: 0, totalDaysActive: 0 });
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [alphabetProgress, setAlphabetProgress] = useState<number[]>([]);
  const [listening, setListening] = useState<Storage.ListeningStats>({ totalMinutes: 0, weeklyMinutes: [0,0,0,0,0,0,0], lastListenDate: '' });
  const [weeklyActivity, setWeeklyActivity] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [x, c, s, cm, ap, ls, wa] = await Promise.all([
          Storage.getXP(),
          Storage.getCoins(),
          Storage.getStreak(),
          Storage.getCompletedMissions(),
          Storage.getAlphabetProgress(),
          Storage.getListeningStats(),
          Storage.getWeeklyActivity(),
        ]);
        setXP(x); setCoins(c); setStreak(s);
        setCompletedMissions(cm); setAlphabetProgress(ap);
        setListening(ls); setWeeklyActivity(wa);
      })();
    }, [])
  );

  const level = Storage.getLevel(xp);
  const achieveData = { xp, streak, completedMissions, alphabetProgress, listening };
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.check(achieveData)).length;

  const getWeekDays = (): boolean[] => {
    const days: boolean[] = [];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push((weeklyActivity[d.toISOString().split('T')[0]] || 0) > 0);
    }
    return days;
  };
  const todayDotIndex = (new Date().getDay() + 6) % 7;

  const handleBuyFreeze = async () => {
    const c = await Storage.getCoins();
    if (c >= 50) {
      await Storage.addCoins(-50);
      await Storage.addStreakFreeze();
      setCoins(c - 50);
      setStreak({ ...streak, freezesAvailable: streak.freezesAvailable + 1 });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: Colors.primary }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>هـ</Text>
        </View>
        <Text style={styles.headerName}>Learner</Text>
        <Text style={styles.headerLevel}>Level {level.level}</Text>
        <View style={styles.statRow}>
          <StatPill icon="flame" value={streak.currentStreak} label="Streak" color="#FFF" bgColor="rgba(255,255,255,0.2)" />
          <StatPill icon="star" value={xp} label="XP" color="#FFF" bgColor="rgba(255,255,255,0.2)" />
          <StatPill icon="diamond" value={coins} label="Coins" color="#FFF" bgColor="rgba(255,255,255,0.2)" />
        </View>
      </View>

      <View style={styles.body}>
        {/* ── Streak Card ── */}
        <SectionHeader title="Streak" />
        <View style={styles.card}>
          <View style={styles.streakStats}>
            <View style={styles.streakStat}>
              <Text style={styles.streakStatNum}>{streak.currentStreak}</Text>
              <Text style={styles.streakStatLabel}>Current</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.streakStat}>
              <Text style={styles.streakStatNum}>{streak.longestStreak}</Text>
              <Text style={styles.streakStatLabel}>Longest</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.streakStat}>
              <Text style={styles.streakStatNum}>{streak.totalDaysActive}</Text>
              <Text style={styles.streakStatLabel}>Total Days</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.streakStat}>
              <Text style={styles.streakStatNum}>❄️ {streak.freezesAvailable}</Text>
              <Text style={styles.streakStatLabel}>Freezes</Text>
            </View>
          </View>
          <View style={styles.weekDotsSection}>
            <WeekDots activeDays={getWeekDays()} todayIndex={todayDotIndex} />
          </View>
          {coins >= 50 && (
            <TouchableOpacity style={styles.freezeBtn} onPress={handleBuyFreeze}>
              <Ionicons name="snow" size={16} color={Colors.info} />
              <Text style={styles.freezeBtnText}>Buy Streak Freeze (50 coins)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Learning Stats ── */}
        <SectionHeader title="Learning Stats" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          <View style={[styles.miniCard, { borderTopWidth: 2, borderTopColor: Colors.primary }]}>
            <Ionicons name="book" size={24} color={Colors.primary} />
            <Text style={styles.miniCardNum}>{completedMissions.length}/{missions.length}</Text>
            <Text style={styles.miniCardLabel}>Missions</Text>
          </View>
          <View style={[styles.miniCard, { borderTopWidth: 2, borderTopColor: Colors.secondary }]}>
            <Ionicons name="text" size={24} color={Colors.secondary} />
            <Text style={styles.miniCardNum}>{alphabetProgress.length}/{alphabet.length}</Text>
            <Text style={styles.miniCardLabel}>Letters</Text>
          </View>
          <View style={[styles.miniCard, { borderTopWidth: 2, borderTopColor: Colors.accent }]}>
            <Ionicons name="chatbubbles" size={24} color={Colors.accent} />
            <Text style={styles.miniCardNum}>{completedMissions.length * 10}</Text>
            <Text style={styles.miniCardLabel}>Words</Text>
          </View>
          <View style={[styles.miniCard, { borderTopWidth: 2, borderTopColor: Colors.xpPurple }]}>
            <Ionicons name="headset" size={24} color={Colors.xpPurple} />
            <Text style={styles.miniCardNum}>{listening.totalMinutes}m</Text>
            <Text style={styles.miniCardLabel}>Listening</Text>
          </View>
        </ScrollView>

        {/* ── Achievements ── */}
        <SectionHeader
          title="Achievements"
          subtitle={`${unlockedCount}/${ACHIEVEMENTS.length} unlocked`}
        />
        <View style={styles.achieveGrid}>
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge
              key={a.id}
              emoji={a.emoji}
              title={a.title}
              unlocked={a.check(achieveData)}
            />
          ))}
        </View>

        {/* ── Radio Section ── */}
        <SectionHeader
          title="Immersive Listening"
          subtitle="Arabic radio stations"
          actionLabel="Listen"
          onAction={() => router.push('/(tabs)/radio')}
        />
        <TouchableOpacity
          style={styles.radioCard}
          onPress={() => router.push('/(tabs)/radio')}
          activeOpacity={0.8}
        >
          <Text style={styles.radioEmoji}>📻</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.radioTitle}>Arabic Radio</Text>
            <Text style={styles.radioSubtitle}>
              Quran, News, Music — immerse yourself
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* ── Settings & Privacy ── */}
        <View style={styles.linksSection}>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.linkText}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/privacy')}>
            <Ionicons name="shield-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  body: { paddingHorizontal: Spacing.md },

  header: {
    paddingTop: 20,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: Spacing.sm,
  },
  avatarText: { fontSize: 32, color: '#FFF', fontWeight: FontWeight.bold, fontFamily: FontFamily.bold },
  headerName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#FFF', fontFamily: FontFamily.bold },
  headerLevel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontFamily: FontFamily.medium },
  statRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },

  card: {
    ...ClayStyle.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  streakStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
  streakStat: { alignItems: 'center' },
  streakStatNum: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, fontFamily: FontFamily.bold },
  streakStatLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, fontFamily: FontFamily.regular },
  divider: { width: 1, height: 30, backgroundColor: Colors.borderLight },
  weekDotsSection: { marginTop: Spacing.sm },
  freezeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.info + '10',
    borderRadius: BorderRadius.md,
  },
  freezeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.info, fontFamily: FontFamily.semibold },

  statsScroll: { gap: Spacing.sm, paddingBottom: Spacing.lg },
  miniCard: {
    ...ClayStyle.card,
    padding: Spacing.md,
    alignItems: 'center',
    width: 100,
    ...Shadows.soft,
  },
  miniCardNum: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginTop: Spacing.xs, fontFamily: FontFamily.bold },
  miniCardLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, fontFamily: FontFamily.regular },

  achieveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },

  radioCard: {
    ...ClayStyle.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  radioEmoji: { fontSize: 32 },
  radioTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, fontFamily: FontFamily.bold },
  radioSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, fontFamily: FontFamily.regular },

  linksSection: { marginBottom: Spacing.xxl },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  linkText: { flex: 1, fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium, fontFamily: FontFamily.medium },
});
