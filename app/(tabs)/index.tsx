/**
 * Home Tab — Daily engagement hub
 * Streak hero, daily goal ring, stakes cards, continue mission, phrase of day
 */
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Colors, FontSize, FontWeight, FontFamily, Spacing,
  BorderRadius, Shadows, ComponentTokens, ClayStyle,
} from '@/constants/theme';
import StatPill from '@/components/StatPill';
import WeekDots from '@/components/WeekDots';
import SectionHeader from '@/components/SectionHeader';
import SkeletonLoader from '@/components/SkeletonLoader';
import { speakArabic } from '@/services/speechService';
import * as Storage from '@/services/storageService';
import { missions } from '@/data/missions';

// Phrase of the day pool
const PHRASES = [
  { arabic: 'هلا والله', translit: 'hala wallah', english: 'Hello / Welcome' },
  { arabic: 'شخبارك', translit: 'shakhbarak', english: 'How are you?' },
  { arabic: 'مشكور', translit: 'mashkoor', english: 'Thank you' },
  { arabic: 'إن شاء الله', translit: 'inshallah', english: 'God willing' },
  { arabic: 'يلّا', translit: 'yalla', english: "Let's go!" },
  { arabic: 'وايد زين', translit: 'wayid zain', english: 'Very good' },
  { arabic: 'ما عليه', translit: "ma alayh", english: "It's okay / No worries" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState<Storage.StreakData>({ currentStreak: 0, longestStreak: 0, lastActiveDate: '', freezesAvailable: 0, totalDaysActive: 0 });
  const [xp, setXP] = useState(0);
  const [coins, setCoins] = useState(0);
  const [dailyXP, setDailyXP] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(50);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [weeklyChallenge, setWeeklyChallenge] = useState<Storage.WeeklyChallenge | null>(null);
  const [monthlyChallenge, setMonthlyChallenge] = useState<Storage.MonthlyChallenge | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<Record<string, number>>({});
  const [challengeDone, setChallengeDone] = useState(false);
  const [phraseRevealed, setPhraseRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const phraseIndex = new Date().getDate() % PHRASES.length;
  const todayPhrase = PHRASES[phraseIndex];
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Check onboarding on first load
  useEffect(() => {
    Storage.hasOnboarded().then((done) => {
      if (!done) router.replace('/onboarding');
    });
  }, []);

  const loadData = useCallback(async () => {
    const [s, x, c, dx, dg, cm, wc, mc, wa, dc] = await Promise.all([
      Storage.getStreak(),
      Storage.getXP(),
      Storage.getCoins(),
      Storage.getDailyXP(),
      Storage.getDailyGoal(),
      Storage.getCompletedMissions(),
      Storage.getWeeklyChallenge(),
      Storage.getMonthlyChallenge(),
      Storage.getWeeklyActivity(),
      Storage.getDailyChallengeRecord(),
    ]);
    setStreak(s);
    setXP(x);
    setCoins(c);
    setDailyXP(dx.xp);
    setDailyGoal(dg);
    setCompletedMissions(cm);
    setWeeklyChallenge(wc);
    setMonthlyChallenge(mc);
    setWeeklyActivity(wa);
    setChallengeDone(dc.lastCompletedDate === new Date().toISOString().split('T')[0]);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const nextMission = missions.find((m) => !completedMissions.includes(m.id));
  const missionProgress = `${completedMissions.length}/${missions.length} missions`;
  const level = Storage.getLevel(xp);
  const dailyProgress = Math.min(dailyXP / dailyGoal, 1);

  // Weekly activity dots (Mon-Sun)
  const weekDays = useMemo((): boolean[] => {
    const days: boolean[] = [];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push((weeklyActivity[dateStr] || 0) > 0);
    }
    return days;
  }, [weeklyActivity]);
  const todayDotIndex = (new Date().getDay() + 6) % 7;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 120 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <Text style={styles.logo}>هلا</Text>
          <View style={styles.topBarRight}>
            <StatPill icon="flame" value={streak.currentStreak} color={Colors.fire} size="sm" />
            <StatPill icon="star" value={xp} color={Colors.xpGold} size="sm" />
            <StatPill icon="diamond" value={coins} color={Colors.coin} size="sm" />
          </View>
        </View>

        {/* ── Streak Hero Card ── */}
        {isLoading ? (
          <View style={{ marginBottom: Spacing.md, gap: Spacing.sm }}>
            <SkeletonLoader width="100%" height={140} borderRadius={BorderRadius.xl} />
            <SkeletonLoader width="100%" height={80} borderRadius={BorderRadius.xl} />
          </View>
        ) : (
          <>
            <View
              style={[
                styles.streakCard,
                { backgroundColor: streak.currentStreak > 0 ? Colors.primary : '#9CA3C4' },
              ]}
            >
              <View style={styles.streakTop}>
                <View>
                  <Text style={styles.greetingText}>{getGreeting()}!</Text>
                  <View style={styles.streakRow}>
                    <Text style={styles.streakFire}>🔥</Text>
                    <Text style={styles.streakNum}>{streak.currentStreak}</Text>
                    <Text style={styles.streakLabel}>day streak</Text>
                  </View>
                </View>
                <View style={styles.streakMeta}>
                  <Text style={styles.streakMetaText}>Best: {streak.longestStreak}</Text>
                  <Text style={styles.streakMetaText}>❄️ {streak.freezesAvailable} freezes</Text>
                </View>
              </View>
              <View style={styles.weekDotsWrap}>
                <WeekDots activeDays={weekDays} todayIndex={todayDotIndex} color="#FFF" labelColor="rgba(255,255,255,0.85)" size="sm" />
              </View>
            </View>

            {/* ── Daily Goal Progress ── */}
            <View style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Ionicons name="trophy" size={20} color={Colors.primary} />
                <Text style={styles.goalTitle}>Daily Goal</Text>
                <Text style={styles.goalXP}>{dailyXP}/{dailyGoal} XP</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.round(dailyProgress * 100)}%` },
                    dailyProgress >= 1 && { backgroundColor: Colors.success },
                  ]}
                />
              </View>
              {dailyProgress >= 1 && (
                <Text style={styles.goalComplete}>🎉 Goal reached! Keep going!</Text>
              )}
            </View>
          </>
        )}

        {/* ── Continue Mission Card ��─ */}
        {nextMission && (
          <>
            <SectionHeader title="Continue Learning" />
            <TouchableOpacity
              style={styles.continueCard}
              activeOpacity={0.8}
              onPress={() => router.push(`/mission/${nextMission.id}`)}
            >
              <View style={styles.continueLeft}>
                <Text style={styles.continueEmoji}>{nextMission.emoji}</Text>
              </View>
              <View style={styles.continueMiddle}>
                <Text style={styles.continueTitle}>{nextMission.title}</Text>
                <Text style={styles.continueSubtitle}>{nextMission.description}</Text>
                <Text style={styles.continueProgress}>{missionProgress}</Text>
              </View>
              <View style={styles.arrowCircle}>
                <Ionicons name="play" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* ── Phrase of the Day ── */}
        <SectionHeader title="Phrase of the Day" subtitle="Tap to reveal meaning" />
        <TouchableOpacity
          style={styles.phraseCard}
          activeOpacity={0.8}
          onPress={() => setPhraseRevealed(!phraseRevealed)}
        >
          <Text style={styles.phraseArabic}>{todayPhrase.arabic}</Text>
          <Text style={styles.phraseTranslit}>{todayPhrase.translit}</Text>
          {phraseRevealed ? (
            <Text style={styles.phraseEnglish}>{todayPhrase.english}</Text>
          ) : (
            <Text style={styles.phraseTapHint}>Tap to reveal 👆</Text>
          )}
          <TouchableOpacity
            style={styles.phraseAudioBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              speakArabic(todayPhrase.arabic);
            }}
          >
            <Ionicons name="volume-medium" size={18} color={Colors.primary} />
            <Text style={styles.phraseAudioText}>Listen</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* ── Stakes Section ── */}
        <SectionHeader title="Your Stakes" subtitle="Daily • Weekly • Monthly" />

        {/* Daily Challenge */}
        <TouchableOpacity
          style={[styles.stakeCard, challengeDone && styles.stakeCardDone]}
          onPress={() => !challengeDone && router.push('/challenge')}
          activeOpacity={0.8}
        >
          <View style={styles.stakeLeft}>
            <Text style={styles.stakeEmoji}>🔥</Text>
            <View>
              <Text style={styles.stakeTitle}>Daily Challenge</Text>
              <Text style={styles.stakeSubtitle}>
                {challengeDone ? 'Completed today ✓' : 'Ready to play!'}
              </Text>
            </View>
          </View>
          {challengeDone ? (
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          ) : (
            <View style={styles.stakeBadge}>
              <Text style={styles.stakeBadgeText}>GO</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Weekly Challenge */}
        {weeklyChallenge && (
          <View style={styles.stakeCard}>
            <View style={styles.stakeLeft}>
              <Text style={styles.stakeEmoji}>{weeklyChallenge.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stakeTitle}>Weekly: {weeklyChallenge.title}</Text>
                <View style={styles.stakeProgressWrap}>
                  <View style={styles.stakeProgressBg}>
                    <View
                      style={[
                        styles.stakeProgressFill,
                        { width: `${Math.round((weeklyChallenge.progress / weeklyChallenge.target) * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.stakeProgressText}>
                    {weeklyChallenge.progress}/{weeklyChallenge.target}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Monthly Challenge */}
        {monthlyChallenge && (
          <View style={styles.stakeCard}>
            <View style={styles.stakeLeft}>
              <Text style={styles.stakeEmoji}>{monthlyChallenge.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stakeTitle}>Monthly: {monthlyChallenge.title}</Text>
                <View style={styles.stakeProgressWrap}>
                  <View style={styles.stakeProgressBg}>
                    <View
                      style={[
                        styles.stakeProgressFill,
                        {
                          width: `${Math.round((monthlyChallenge.progress / monthlyChallenge.target) * 100)}%`,
                          backgroundColor:
                            monthlyChallenge.tier === 'gold' ? Colors.xpGold :
                            monthlyChallenge.tier === 'silver' ? '#C0C0C0' :
                            monthlyChallenge.tier === 'bronze' ? '#CD7F32' :
                            Colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.stakeProgressText}>
                    {monthlyChallenge.progress}/{monthlyChallenge.target}
                    {monthlyChallenge.tier !== 'none' && (
                      monthlyChallenge.tier === 'gold' ? ' 🥇' :
                      monthlyChallenge.tier === 'silver' ? ' 🥈' : ' 🥉'
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Level Card ── */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{level.level}</Text>
            </View>
            <View>
              <Text style={styles.levelTitle}>Level {level.level}</Text>
              <Text style={styles.levelSubtitle}>
                {level.currentXP}/{level.nextLevelXP} XP to next level
              </Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.round((level.currentXP / level.nextLevelXP) * 100)}%` },
              ]}
            />
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md, paddingHorizontal: Spacing.xs },
  logo: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.primary, fontFamily: FontFamily.black },
  topBarRight: { flexDirection: 'row', gap: Spacing.xs },
  streakCard: { borderRadius: BorderRadius.xxl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 2, borderTopColor: 'rgba(255,255,255,0.3)', borderLeftColor: 'rgba(255,255,255,0.15)', borderRightColor: 'rgba(0,0,0,0.06)', borderBottomColor: 'rgba(0,0,0,0.12)', ...Shadows.cardLifted },
  streakTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  greetingText: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeight.medium, fontFamily: FontFamily.medium },
  streakRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  streakFire: { fontSize: 28 },
  streakNum: { fontSize: FontSize.hero, fontWeight: FontWeight.black, color: '#FFF', fontFamily: FontFamily.black },
  streakLabel: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeight.medium },
  streakMeta: { alignItems: 'flex-end', gap: 4 },
  streakMetaText: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.medium },
  weekDotsWrap: { backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: BorderRadius.lg, padding: Spacing.sm },
  goalCard: { ...ClayStyle.card, padding: Spacing.md, marginBottom: Spacing.lg, ...Shadows.card },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  goalTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, flex: 1, fontFamily: FontFamily.semibold },
  goalXP: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary, fontFamily: FontFamily.bold },
  progressBarBg: { height: ComponentTokens.progressBar.height, backgroundColor: Colors.surface, borderRadius: ComponentTokens.progressBar.borderRadius, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: ComponentTokens.progressBar.borderRadius },
  goalComplete: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.semibold, marginTop: Spacing.xs, textAlign: 'center' },
  continueCard: { ...ClayStyle.card, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, marginBottom: Spacing.lg, ...Shadows.card },
  continueLeft: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  continueEmoji: { fontSize: 28 },
  continueMiddle: { flex: 1 },
  continueTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, fontFamily: FontFamily.bold },
  continueSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, fontFamily: FontFamily.regular },
  continueProgress: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold, marginTop: 4 },
  arrowCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm, backgroundColor: Colors.primary },
  phraseCard: { ...ClayStyle.card, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg, ...Shadows.card },
  phraseArabic: { fontSize: FontSize.arabicHero, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.xs },
  phraseTranslit: { fontSize: FontSize.md, fontStyle: 'italic', color: Colors.textSecondary, marginBottom: Spacing.md, fontFamily: FontFamily.regular },
  phraseEnglish: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.primary, marginBottom: Spacing.md, fontFamily: FontFamily.semibold },
  phraseTapHint: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.md },
  phraseAudioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryMuted, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  phraseAudioText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  stakeCard: { ...ClayStyle.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.soft },
  stakeCardDone: { borderColor: Colors.success + '40', backgroundColor: Colors.successLight },
  stakeLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  stakeEmoji: { fontSize: 28 },
  stakeTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, fontFamily: FontFamily.bold },
  stakeSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  stakeBadge: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  stakeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#FFF' },
  stakeProgressWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 6 },
  stakeProgressBg: { flex: 1, height: 6, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden' },
  stakeProgressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  stakeProgressText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, minWidth: 40 },
  levelCard: { ...ClayStyle.card, padding: Spacing.md, marginTop: Spacing.md, ...Shadows.card },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  levelBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  levelBadgeText: { fontSize: FontSize.lg, fontWeight: FontWeight.black, color: '#FFF' },
  levelTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, fontFamily: FontFamily.bold },
  levelSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary },
});
