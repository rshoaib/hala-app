/**
 * Practice — the daily spaced-recall session.
 *
 * Up to eight questions. Each shows a phrase in Arabic with its
 * transliteration; the learner picks the English meaning from four
 * options. Answers update the SRS schedule immediately (a killed app
 * loses nothing), and the session ends on a one-screen summary that
 * recaps the score, the phrases missed, and the XP / streak earned.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Colors, FontSize, FontWeight, FontFamily, Spacing,
  BorderRadius, Shadows, TextStyles, ComponentTokens, Surfaces, fontStyle,
} from '@/constants/theme';
import { type Level, type Phrase } from '@/data/phrases';
import * as Storage from '@/services/storageService';
import * as SRS from '@/services/srsService';
import { speakArabic } from '@/services/speechService';
import {
  completePracticeSession,
  DEFAULT_GAMIFICATION,
  type GamificationState,
  type SessionOutcome,
} from '@/services/gamificationService';
import GoldButton from '@/components/GoldButton';
import Confetti from '@/components/Confetti';

type Phase = 'loading' | 'empty' | 'question' | 'summary';

export default function Practice() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState<Level | null>(null);
  const [queue, setQueue] = useState<Phrase[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  // Phrases answered incorrectly this session — recapped on the summary.
  const [wrongPhrases, setWrongPhrases] = useState<Phrase[]>([]);
  // Sessions-completed total, captured at finish for the summary screen.
  const [completedTotal, setCompletedTotal] = useState(0);
  // Days until the next review — backs the "all caught up" copy.
  const [nextDueDays, setNextDueDays] = useState<number | null>(null);
  // Gamification result captured at finish (XP earned, streak, level-up…).
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Single-writer refs for persisted state; React state would lag behind
  // the async writes and risk dropping an answer on fast taps.
  const srsRef = useRef<SRS.PracticeState>({});
  const statsRef = useRef<Storage.PracticeStats>({ started: 0, completed: 0 });
  // Gamification snapshot loaded on mount; mutated once at finish.
  const gamRef = useRef<GamificationState>(DEFAULT_GAMIFICATION);
  // Count of phrases first encountered this session (award fresh-learn XP).
  const newPhrasesRef = useRef(0);
  // Drives the cross-fade between questions.
  const fade = useRef(new Animated.Value(1)).current;
  // Tap-race guards. Two touches can land in the same frame (or the same
  // JS task), before React re-renders — state alone can't block the
  // second one. pickedRef blocks double-grading a question; advancingRef
  // blocks double-advancing past it (it re-arms on the next pick, not at
  // the end of handleNext, because both taps of a double-tap run
  // sequentially in one task).
  const pickedRef = useRef<number | null>(null);
  const advancingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [onboarded, lvl, srsState, stats, gam] = await Promise.all([
        Storage.hasOnboarded(),
        Storage.getLevel(),
        Storage.getPracticeState(),
        Storage.getPracticeStats(),
        Storage.getGamificationState(),
      ]);
      if (cancelled) return;
      // Deep links (hala://practice) can reach this screen before
      // onboarding — keep the same gate the home screen enforces.
      if (!onboarded) {
        router.replace('/onboarding');
        return;
      }
      srsRef.current = srsState;
      statsRef.current = stats;
      gamRef.current = gam;
      const now = Date.now();
      const session = SRS.buildSessionQueue(lvl, srsState, now);
      setLevel(lvl);
      setQueue(session);
      if (session.length === 0) {
        const due = SRS.nextDueAt(lvl, srsState);
        setNextDueDays(due === null ? null : SRS.daysUntil(due, now));
        setPhase('empty');
      } else {
        statsRef.current = { ...stats, started: stats.started + 1 };
        Storage.setPracticeStats(statsRef.current);
        setPhase('question');
      }
    })();
    return () => { cancelled = true; };
    // Init-only: `router` is stable and not a re-run trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phrase: Phrase | undefined = queue[index];
  const question = useMemo(
    () => (phrase && level ? SRS.buildOptions(phrase, level) : null),
    [phrase, level]
  );

  function handlePick(optionIndex: number) {
    if (pickedRef.current !== null || !phrase || !question) return;
    pickedRef.current = optionIndex;
    advancingRef.current = false; // re-arm Next for this question
    const isCorrect = optionIndex === question.correctIndex;
    const isNew = srsRef.current[phrase.id] === undefined;
    setPicked(optionIndex);
    // Physical feedback to match the visual reveal.
    Haptics.notificationAsync(
      isCorrect
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    ).catch(() => {});
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrongPhrases((w) => [...w, phrase]);
    }
    if (isNew) newPhrasesRef.current += 1;
    const next: SRS.PracticeState = {
      ...srsRef.current,
      [phrase.id]: SRS.gradeAnswer(srsRef.current[phrase.id], isCorrect, Date.now()),
    };
    srsRef.current = next;
    Storage.setPracticeState(next);
  }

  function finishSession() {
    const nextStats = {
      ...statsRef.current,
      completed: statsRef.current.completed + 1,
    };
    statsRef.current = nextStats;
    Storage.setPracticeStats(nextStats);
    setCompletedTotal(nextStats.completed);

    // Award XP + advance the daily streak from this session's results.
    const result = completePracticeSession(
      gamRef.current,
      { correct: correctCount, newPhrases: newPhrasesRef.current },
      Date.now()
    );
    gamRef.current = result.state;
    Storage.setGamificationState(result.state);
    setOutcome(result);
    if (result.milestone) setShowConfetti(true);
    setPhase('summary');
  }

  function handleNext() {
    if (advancingRef.current) return;
    advancingRef.current = true;
    if (index + 1 >= queue.length) {
      finishSession();
    } else {
      // Cross-fade so the swap reads as "advanced" rather than a flicker.
      Animated.timing(fade, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setIndex((i) => i + 1);
        setPicked(null);
        pickedRef.current = null;
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start();
      });
    }
  }

  function handleClose() {
    // Deep-linked entries may have no back stack — fall back to home.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/today');
    }
  }

  async function handleSpeak() {
    if (speaking || !phrase) return;
    setSpeaking(true);
    try {
      await speakArabic(phrase.arabic, 0.7);
    } finally {
      setSpeaking(false);
    }
  }

  if (phase === 'loading') {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (phase === 'empty') {
    const when =
      nextDueDays === null
        ? null
        : nextDueDays <= 1
          ? 'tomorrow'
          : `in ${nextDueDays} days`;
    return (
      <View
        style={[
          styles.root,
          styles.center,
          { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <Text style={styles.emptyTitle}>All caught up</Text>
        <Text style={styles.emptyBody}>
          {when
            ? `Nothing to review right now. Your next review is ${when}.`
            : 'Nothing to review right now.'}
        </Text>
        <View style={styles.emptyCta}>
          <GoldButton title="Done" onPress={handleClose} fullWidth={false} />
        </View>
      </View>
    );
  }

  if (phase === 'summary') {
    const tracked = level ? SRS.countTracked(level, srsRef.current) : 0;
    const inMemory = level ? SRS.countInMemory(level, srsRef.current) : 0;
    return (
      <View style={[styles.root, { paddingTop: insets.top + Spacing.md }]}>
        <ScrollView
          contentContainerStyle={[
            styles.summaryScroll,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryBody}>
            <Text style={styles.eyebrow}>Practice</Text>
            <Text style={styles.summaryTitle}>Session complete</Text>
            <Text style={styles.summaryScore}>
              {correctCount} / {queue.length}
            </Text>
            <Text style={styles.summaryScoreLabel}>answered correctly</Text>

            {outcome && (
              <View style={styles.rewardRow}>
                <View style={styles.rewardPill}>
                  <Ionicons name="star" size={16} color={Colors.primaryDark} />
                  <Text style={styles.rewardPillText}>+{outcome.xpEarned} XP</Text>
                </View>
                <View style={styles.rewardPill}>
                  <Ionicons name="flame" size={16} color={Colors.accent} />
                  <Text style={styles.rewardPillText}>
                    {outcome.streak} day{outcome.streak === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>
            )}

            {outcome?.usedFreeze && (
              <Text style={styles.freezeNote}>
                ❄️ Streak freeze used — your streak is safe.
              </Text>
            )}

            {outcome?.leveledUp && (
              <View style={styles.levelUp}>
                <Text style={styles.levelUpText}>
                  Level up! You&apos;re now Level {outcome.newLevel} ·{' '}
                  {outcome.newTitle}
                </Text>
              </View>
            )}

            <View style={styles.summaryCard}>
              <Text style={styles.summaryMemory}>
                {tracked} phrase{tracked === 1 ? '' : 's'} in rotation
              </Text>
              {inMemory > 0 && (
                <Text style={styles.summaryMemorySub}>
                  {inMemory} in long-term memory
                </Text>
              )}
              <Text style={styles.summaryHint}>
                Correct answers space a phrase further out — miss it and it
                comes back tomorrow.
              </Text>
            </View>

            {wrongPhrases.length > 0 && (
              <View style={styles.missedBlock}>
                <Text style={styles.missedTitle}>Review these</Text>
                {wrongPhrases.map((p) => (
                  <View key={p.id} style={styles.missedItem}>
                    <Text style={styles.missedArabic}>{p.arabic}</Text>
                    <View style={styles.missedMeaning}>
                      <Text style={styles.missedTranslit}>
                        {p.transliteration}
                      </Text>
                      <Text style={styles.missedEnglish}>{p.english}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.summarySessions}>
              Sessions completed: {completedTotal}
            </Text>
          </View>
          <GoldButton title="Done" onPress={handleClose} />
        </ScrollView>
        <Confetti visible={showConfetti} onDone={() => setShowConfetti(false)} />
      </View>
    );
  }

  // phase === 'question'
  if (!phrase || !question) return null;
  const progress = (index + 1) / queue.length;
  const isLast = index + 1 >= queue.length;
  const isCorrectPick = picked !== null && picked === question.correctIndex;

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.header}>
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close practice"
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.progressText}>
          {index + 1} / {queue.length}
        </Text>
        {/* Spacer balances the close button so the count sits centered. */}
        <View style={styles.closeBtn} />
      </View>

      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: queue.length, now: index + 1 }}
      >
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fade }}>
          <View style={styles.promptCard}>
            <Text style={styles.arabic}>{phrase.arabic}</Text>
            <Text style={styles.transliteration}>{phrase.transliteration}</Text>
            <Pressable
              onPress={handleSpeak}
              accessibilityRole="button"
              accessibilityLabel="Play pronunciation"
              style={styles.speakBtn}
            >
              {speaking ? (
                <ActivityIndicator size="small" color={Colors.primaryDark} />
              ) : (
                <Ionicons name="volume-high" size={20} color={Colors.primaryDark} />
              )}
            </Pressable>
          </View>

          <Text style={styles.optionsLabel}>Choose the meaning</Text>

          {question.options.map((option, i) => {
            const isPicked = picked === i;
            const isAnswer = i === question.correctIndex;
            const revealed = picked !== null;
            return (
              <Pressable
                key={option}
                onPress={() => handlePick(i)}
                disabled={revealed}
                accessibilityRole="button"
                accessibilityState={{ disabled: revealed, selected: isPicked }}
                style={[
                  styles.option,
                  revealed && isAnswer && styles.optionCorrect,
                  revealed && isPicked && !isAnswer && styles.optionWrong,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    revealed && (isAnswer || isPicked) && styles.optionTextRevealed,
                    revealed && !isAnswer && !isPicked && styles.optionTextDimmed,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}

          {/* Feedback sits right under the options — close to where the eye
              is — while the button stays pinned in the thumb zone. The
              placeholder is a zero-width space (silent to screen readers)
              so the reserved line never announces "space". */}
          <Text
            accessibilityLiveRegion="polite"
            style={[
              styles.feedback,
              isCorrectPick ? styles.feedbackCorrect : styles.feedbackWrong,
            ]}
          >
            {picked === null
              ? '​'
              : isCorrectPick
                ? 'Correct!'
                : `Not quite — it means “${phrase.english}”`}
          </Text>
        </Animated.View>

        <View style={styles.footer}>
          {picked !== null && (
            <GoldButton
              title={isLast ? 'Finish' : 'Next'}
              onPress={handleNext}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  closeBtn: {
    width: ComponentTokens.iconButton.size,
    height: ComponentTokens.iconButton.size,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    ...TextStyles.label,
  },
  progressTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },

  // ── Question ──
  scroll: { paddingHorizontal: Spacing.lg, flexGrow: 1 },
  promptCard: {
    ...Surfaces.outlinedCard,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  arabic: {
    fontSize: FontSize.arabicLarge,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: Spacing.xs,
  },
  transliteration: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  speakBtn: {
    width: ComponentTokens.iconButton.size,
    height: ComponentTokens.iconButton.size,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsLabel: {
    ...TextStyles.label,
    marginBottom: Spacing.sm,
  },
  option: {
    // Deliberate variant of Surfaces.outlinedCard: a selectable surface
    // gets the heavier 1.5px border.
    minHeight: ComponentTokens.button.height,
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  optionCorrect: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  optionWrong: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accentDark,
  },
  optionText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: Colors.text,
  },
  optionTextRevealed: {
    color: Colors.textOnPrimary,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
  },
  optionTextDimmed: {
    color: Colors.textMuted,
  },

  // ── Feedback / footer ──
  footer: {
    marginTop: 'auto',
    paddingTop: Spacing.md,
    // Reserve the button's space so options don't jump on answer.
    minHeight: ComponentTokens.button.height + Spacing.md,
    justifyContent: 'flex-end',
  },
  feedback: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginTop: Spacing.xs,
    // Reserve one line so the reveal doesn't shift the layout.
    minHeight: FontSize.md + Spacing.sm,
  },
  feedbackCorrect: { color: Colors.primaryDark },
  // The terracotta option carries the error signal; the text stays in the
  // AA-safe body color (accentDark on this background is only 3.8:1).
  feedbackWrong: { color: Colors.text },

  // ── Empty ──
  emptyTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyBody: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  emptyCta: { alignSelf: 'stretch', alignItems: 'center' },

  // ── Summary ──
  summaryScroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  // Center the stats between the top edge and the pinned Done button so
  // tall screens don't leave a dead zone under the card.
  summaryBody: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  eyebrow: {
    ...TextStyles.eyebrow,
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.black,
    fontWeight: FontWeight.black,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  summaryScore: {
    fontSize: FontSize.hero,
    fontFamily: FontFamily.black,
    fontWeight: FontWeight.black,
    color: Colors.primaryDark,
  },
  summaryScoreLabel: {
    ...TextStyles.label,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rewardPillText: {
    ...fontStyle('bold'),
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  freezeNote: {
    ...fontStyle('semibold'),
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  levelUp: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  levelUpText: {
    ...fontStyle('bold'),
    fontSize: FontSize.sm,
    color: Colors.textOnPrimary,
    textAlign: 'center',
  },
  summaryCard: {
    ...Surfaces.outlinedCard,
    alignSelf: 'stretch',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  summaryMemory: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  summaryMemorySub: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.primaryDark,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  summaryHint: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  missedBlock: {
    ...Surfaces.outlinedCard,
    alignSelf: 'stretch',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  missedTitle: {
    ...TextStyles.label,
    marginBottom: Spacing.sm,
  },
  missedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.md,
  },
  missedArabic: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  missedMeaning: {
    flex: 1,
    alignItems: 'flex-end',
  },
  missedTranslit: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  missedEnglish: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.text,
  },
  summarySessions: {
    ...TextStyles.label,
  },
});
