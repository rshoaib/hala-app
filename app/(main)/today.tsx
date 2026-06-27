/**
 * Home — the Emirati Arabic phrase browser.
 *
 * A streak/XP bar, three level pills (Beginner / Intermediate / Expert), a
 * "Daily practice" card that opens the SRS session at /practice, a search
 * box, and a virtualized list of phrases grouped by theme. Tap any phrase
 * to hear it spoken via the device's Arabic TTS voice.
 *
 * The practice card's count is per-level, so it refreshes on focus
 * (returning from a session), on app re-foreground (a day boundary may
 * have passed), on level change, and on pull-to-refresh. Level changes also
 * reschedule the daily-phrase notification to use the new level's pool.
 */
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  TextInput,
  RefreshControl,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Colors, FontSize, FontWeight, FontFamily, Spacing,
  BorderRadius, Shadows, TextStyles, ComponentTokens, Surfaces,
} from '@/constants/theme';
import {
  LEVELS,
  themesForLevel,
  type Level,
  type Phrase,
  type PhraseTheme,
} from '@/data/phrases';
import * as Storage from '@/services/storageService';
import * as SRS from '@/services/srsService';
import {
  practicedToday,
  DEFAULT_GAMIFICATION,
  type GamificationState,
} from '@/services/gamificationService';
import { speakArabic } from '@/services/speechService';
import { scheduleDailyPhrase } from '@/services/notificationService';
import GoldButton from '@/components/GoldButton';
import StreakXpBar from '@/components/StreakXpBar';

interface PhraseSection {
  id: string;
  title: string;
  emoji: string;
  data: Phrase[];
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [level, setLevelState] = useState<Level | null>(null);
  const [query, setQuery] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [gam, setGam] = useState<GamificationState>(DEFAULT_GAMIFICATION);
  const [refreshing, setRefreshing] = useState(false);
  // Size of the next practice session (null until first computed) and,
  // when it's zero, how many days until the next review comes due.
  const [practiceReady, setPracticeReady] = useState<number | null>(null);
  const [nextDueDays, setNextDueDays] = useState<number | null>(null);
  // Blocks a double-tap on Start from pushing /practice twice; re-armed
  // by the focus effect when the user returns.
  const navigatingRef = useRef(false);

  // Derive the practice-card state from a level + schedule snapshot.
  function applyPracticeCounts(lvl: Level, srsState: SRS.PracticeState) {
    const now = Date.now();
    const ready = SRS.buildSessionQueue(lvl, srsState, now).length;
    setPracticeReady(ready);
    if (ready === 0) {
      const due = SRS.nextDueAt(lvl, srsState);
      setNextDueDays(due === null ? null : SRS.daysUntil(due, now));
    } else {
      setNextDueDays(null);
    }
  }

  // Gate onboarding + load saved level / gamification on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const onboarded = await Storage.hasOnboarded();
      if (!onboarded) {
        router.replace('/onboarding');
        return;
      }
      const [stored, g] = await Promise.all([
        Storage.getLevel(),
        Storage.getGamificationState(),
      ]);
      if (!cancelled) {
        setLevelState(stored);
        setGam(g);
      }
    })();
    return () => { cancelled = true; };
    // Init-only: `router` is stable and not a re-run trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On focus: sync the level (it may have been a cold start) and refresh
  // the practice card + streak — answering a session reschedules phrases
  // and grants XP, so both change when the user returns from /practice.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [lvl, srsState, g] = await Promise.all([
          Storage.getLevel(),
          Storage.getPracticeState(),
          Storage.getGamificationState(),
        ]);
        if (cancelled) return;
        setLevelState((prev) => prev ?? lvl);
        setGam(g);
        applyPracticeCounts(lvl, srsState);
        navigatingRef.current = false;
      })();
      return () => { cancelled = true; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Re-foreground: focus effects don't fire when the app returns from
  // the background, but a day boundary may have passed and made phrases
  // due (e.g. opening via the 7pm daily notification).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      if (status !== 'active') return;
      (async () => {
        const [lvl, srsState, g] = await Promise.all([
          Storage.getLevel(),
          Storage.getPracticeState(),
          Storage.getGamificationState(),
        ]);
        setGam(g);
        applyPracticeCounts(lvl, srsState);
      })();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [lvl, srsState, g] = await Promise.all([
        Storage.getLevel(),
        Storage.getPracticeState(),
        Storage.getGamificationState(),
      ]);
      setGam(g);
      applyPracticeCounts(lvl, srsState);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const themes: PhraseTheme[] = useMemo(
    () => (level ? themesForLevel(level) : []),
    [level]
  );

  const sections: PhraseSection[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = !q
      ? themes
      : themes
          .map((t) => ({
            ...t,
            phrases: t.phrases.filter((p) =>
              p.english.toLowerCase().includes(q) ||
              p.transliteration.toLowerCase().includes(q) ||
              p.arabic.includes(query.trim())
            ),
          }))
          .filter((t) => t.phrases.length > 0);
    return matched.map((t) => ({
      id: t.id,
      title: t.title,
      emoji: t.emoji,
      data: t.phrases,
    }));
  }, [themes, query]);

  async function handleLevelChange(next: Level) {
    if (next === level) return;
    setLevelState(next);
    setQuery('');
    await Storage.setLevel(next);
    // Reschedule the daily notification to use the new level's pool.
    scheduleDailyPhrase();
    // The practice queue is per-level, so the card count changes too.
    const srsState = await Storage.getPracticeState();
    applyPracticeCounts(next, srsState);
  }

  function handleStartPractice() {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push('/practice');
  }

  async function handleSpeak(phrase: Phrase) {
    if (speakingId) return;
    setSpeakingId(phrase.id);
    try {
      await speakArabic(phrase.arabic, 0.7);
    } finally {
      setSpeakingId(null);
    }
  }

  if (!level) {
    return <HomeSkeleton topInset={insets.top} />;
  }

  const totalPhrases = sections.reduce((n, s) => n + s.data.length, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Hala</Text>
        <Text style={styles.title}>Emirati Arabic</Text>
      </View>

      <StreakXpBar state={gam} active={practicedToday(gam, Date.now())} />

      <View
        style={styles.pillRow}
        accessibilityRole="tablist"
      >
        {LEVELS.map((l) => {
          const active = l.id === level;
          return (
            <Pressable
              key={l.id}
              onPress={() => handleLevelChange(l.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {l.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.practiceCard}>
        <View style={styles.practiceIcon}>
          <Ionicons name="flash" size={20} color={Colors.primaryDark} />
        </View>
        <View style={styles.practiceInfo}>
          <Text style={styles.practiceTitle}>Daily practice</Text>
          <Text style={styles.practiceCaption}>
            {practiceReady === null
              ? '​'
              : practiceReady > 0
                ? `${practiceReady} phrase${practiceReady === 1 ? '' : 's'} ready`
                : nextDueDays !== null && nextDueDays > 1
                  ? `All caught up — next review in ${nextDueDays} days`
                  : 'All caught up — back tomorrow'}
          </Text>
        </View>
        {practiceReady !== null && practiceReady > 0 && (
          <GoldButton
            title="Start"
            size="sm"
            fullWidth={false}
            onPress={handleStartPractice}
          />
        )}
      </View>

      <View style={styles.searchRow}>
        <Ionicons
          name="search"
          size={18}
          color={Colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search English, transliteration, or Arabic"
          placeholderTextColor={Colors.textSecondary}
          accessibilityLabel="Search phrases"
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => setQuery('')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          totalPhrases > 0 ? (
            <Text style={styles.count}>
              {totalPhrases} phrase{totalPhrases === 1 ? '' : 's'}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search" size={28} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No matching phrases</Text>
            <Text style={styles.emptyBody}>
              Try a different search or switch levels.
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.themeHeader}>
            <View style={styles.themeEmojiBox}>
              <Text style={styles.themeEmoji}>{section.emoji}</Text>
            </View>
            <Text style={styles.themeTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item: p }) => (
          <Pressable
            onPress={() => handleSpeak(p)}
            accessibilityRole="button"
            accessibilityHint="Plays the Arabic pronunciation"
            style={({ pressed }) => [
              styles.phraseRow,
              pressed && styles.phraseRowPressed,
            ]}
          >
            <View style={styles.phraseMain}>
              <Text style={styles.arabic}>{p.arabic}</Text>
              <Text style={styles.transliteration}>{p.transliteration}</Text>
              <Text style={styles.english}>{p.english}</Text>
            </View>
            <View style={styles.speakBtn}>
              {speakingId === p.id ? (
                <Ionicons name="volume-high" size={20} color={Colors.primary} />
              ) : (
                <Ionicons
                  name="volume-high"
                  size={20}
                  color={Colors.primaryDark}
                />
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

/** Gray-block placeholder mimicking the home layout while state loads. */
function HomeSkeleton({ topInset }: { topInset: number }) {
  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View style={[styles.skel, { width: 48, height: 12, marginBottom: Spacing.xs }]} />
        <View style={[styles.skel, { width: 200, height: 30 }]} />
      </View>
      <View style={styles.skelRow}>
        <View style={[styles.skel, styles.skelStreak]} />
        <View style={[styles.skel, styles.skelXp]} />
      </View>
      <View style={styles.pillRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.skel, styles.skelPill]} />
        ))}
      </View>
      <View style={[styles.skel, styles.skelCard]} />
      <View style={[styles.skel, styles.skelSearch]} />
      <View style={styles.list}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.skel, styles.skelPhrase]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  eyebrow: {
    ...TextStyles.eyebrow,
    marginBottom: Spacing.xxs,
  },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.black,
    fontWeight: FontWeight.black,
    color: Colors.text,
  },
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  pill: {
    flex: 1,
    height: ComponentTokens.pill.height,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
    ...Shadows.soft,
  },
  pillText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  pillTextActive: { color: Colors.textOnPrimary },
  practiceCard: {
    ...Surfaces.outlinedCard,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  practiceIcon: {
    width: ComponentTokens.iconBadge.size,
    height: ComponentTokens.iconBadge.size,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  practiceInfo: { flex: 1, marginRight: Spacing.sm },
  practiceTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  practiceCaption: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  searchRow: {
    ...Surfaces.outlinedCard,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: ComponentTokens.input.height,
    borderRadius: ComponentTokens.input.borderRadius,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearBtn: { padding: Spacing.xs },
  list: { paddingHorizontal: Spacing.lg },
  count: {
    ...TextStyles.label,
    marginBottom: Spacing.sm,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  themeEmojiBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  themeEmoji: { fontSize: FontSize.md },
  themeTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  phraseRow: {
    ...Surfaces.outlinedCard,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  phraseRowPressed: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryMuted,
  },
  phraseMain: { flex: 1, marginRight: Spacing.sm },
  arabic: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: Spacing.xxs,
    writingDirection: 'rtl',
  },
  transliteration: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  english: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  speakBtn: {
    width: ComponentTokens.iconBadge.size,
    height: ComponentTokens.iconBadge.size,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyBody: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },

  // ── Skeleton ──
  skel: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  skelRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  skelStreak: { width: 96, height: 56, borderRadius: BorderRadius.lg },
  skelXp: { flex: 1, height: 56, borderRadius: BorderRadius.lg },
  skelPill: { flex: 1, height: ComponentTokens.pill.height, borderRadius: BorderRadius.full },
  skelCard: {
    height: 72,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  skelSearch: {
    height: ComponentTokens.input.height,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  skelPhrase: {
    height: 88,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
});
