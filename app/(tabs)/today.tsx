/**
 * Home — the Emirati Arabic phrase browser.
 *
 * Three level pills at the top (Beginner / Intermediate / Expert), a
 * "Daily practice" card that opens the SRS session at /practice, a search
 * box, and a scrollable list of phrases grouped by theme. Tap any phrase
 * to hear it spoken via the device's Arabic TTS voice.
 *
 * The practice card's count is per-level, so it refreshes on focus
 * (returning from a session), on app re-foreground (a day boundary may
 * have passed), and on level change. Level changes also reschedule the
 * daily-phrase notification to use the new level's pool.
 */
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Colors, FontSize, FontWeight, FontFamily, Spacing,
  BorderRadius, Shadows, TextStyles, ComponentTokens,
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
import { speakArabic } from '@/services/speechService';
import { scheduleDailyPhrase } from '@/services/notificationService';
import GoldButton from '@/components/GoldButton';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [level, setLevelState] = useState<Level | null>(null);
  const [query, setQuery] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
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

  // Gate onboarding + load saved level on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const onboarded = await Storage.hasOnboarded();
      if (!onboarded) {
        router.replace('/onboarding');
        return;
      }
      const stored = await Storage.getLevel();
      if (!cancelled) setLevelState(stored);
    })();
    return () => { cancelled = true; };
  }, [router]);

  // On focus: sync the level (it may have been a cold start) and refresh
  // the practice card — answering a session reschedules phrases, so the
  // count changes when the user comes back from /practice.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [lvl, srsState] = await Promise.all([
          Storage.getLevel(),
          Storage.getPracticeState(),
        ]);
        if (cancelled) return;
        setLevelState((prev) => prev ?? lvl);
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
        const [lvl, srsState] = await Promise.all([
          Storage.getLevel(),
          Storage.getPracticeState(),
        ]);
        applyPracticeCounts(lvl, srsState);
      })();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const themes: PhraseTheme[] = useMemo(
    () => (level ? themesForLevel(level) : []),
    [level]
  );

  const filteredThemes: PhraseTheme[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return themes;
    return themes
      .map((t) => ({
        ...t,
        phrases: t.phrases.filter((p) =>
          p.english.toLowerCase().includes(q) ||
          p.transliteration.toLowerCase().includes(q) ||
          p.arabic.includes(query.trim())
        ),
      }))
      .filter((t) => t.phrases.length > 0);
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
    return (
      <View style={[styles.root, styles.loading]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const totalPhrases = filteredThemes.reduce((n, t) => n + t.phrases.length, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Hala</Text>
        <Text style={styles.title}>Emirati Arabic</Text>
      </View>

      <View style={styles.pillRow}>
        {LEVELS.map((l) => {
          const active = l.id === level;
          return (
            <Pressable
              key={l.id}
              onPress={() => handleLevelChange(l.id)}
              accessibilityRole="button"
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
              ? ' '
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

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredThemes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No matching phrases</Text>
            <Text style={styles.emptyBody}>
              Try a different search or switch levels.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.count}>
              {totalPhrases} phrase{totalPhrases === 1 ? '' : 's'}
            </Text>
            {filteredThemes.map((theme) => (
              <View key={theme.id} style={styles.themeBlock}>
                <Text style={styles.themeTitle}>
                  <Text style={styles.themeEmoji}>{theme.emoji}  </Text>
                  {theme.title}
                </Text>
                {theme.phrases.map((p) => (
                  <Pressable
                    key={p.id}
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
                      <Text style={styles.transliteration}>
                        {p.transliteration}
                      </Text>
                      <Text style={styles.english}>{p.english}</Text>
                    </View>
                    <View style={styles.speakBtn}>
                      {speakingId === p.id ? (
                        <ActivityIndicator
                          size="small"
                          color={Colors.primaryDark}
                        />
                      ) : (
                        <Ionicons
                          name="volume-high"
                          size={20}
                          color={Colors.primaryDark}
                        />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loading: { alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  eyebrow: {
    ...TextStyles.eyebrow,
    marginBottom: Spacing['2xs'],
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
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  practiceIcon: {
    width: 40,
    height: 40,
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
    marginTop: Spacing['2xs'],
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: ComponentTokens.input.height,
    borderRadius: ComponentTokens.input.borderRadius,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
  themeBlock: { marginBottom: Spacing.lg },
  themeTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  themeEmoji: { fontSize: FontSize.md },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    marginBottom: 2,
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
    marginTop: 2,
  },
  speakBtn: {
    width: 40,
    height: 40,
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
});
