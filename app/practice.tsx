/**
 * Practice — the daily spaced-recall session.
 *
 * Up to eight questions. Each shows a phrase in Arabic with its
 * transliteration; the learner picks the English meaning from four
 * options. Answers update the SRS schedule immediately (a killed app
 * loses nothing), and the session ends on a one-screen summary.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, FontSize, FontWeight, FontFamily, Spacing,
  BorderRadius, Shadows, TextStyles, ComponentTokens,
} from '@/constants/theme';
import { type Level, type Phrase } from '@/data/phrases';
import * as Storage from '@/services/storageService';
import * as SRS from '@/services/srsService';
import { speakArabic } from '@/services/speechService';
import GoldButton from '@/components/GoldButton';

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

  // Single-writer refs for persisted state; React state would lag behind
  // the async writes and risk dropping an answer on fast taps.
  const srsRef = useRef<SRS.PracticeState>({});
  const statsRef = useRef<Storage.PracticeStats>({ started: 0, completed: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [lvl, srsState, stats] = await Promise.all([
        Storage.getLevel(),
        Storage.getPracticeState(),
        Storage.getPracticeStats(),
      ]);
      if (cancelled) return;
      srsRef.current = srsState;
      statsRef.current = stats;
      const session = SRS.buildSessionQueue(lvl, srsState, Date.now());
      setLevel(lvl);
      setQueue(session);
      if (session.length === 0) {
        setPhase('empty');
      } else {
        statsRef.current = { ...stats, started: stats.started + 1 };
        Storage.setPracticeStats(statsRef.current);
        setPhase('question');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const phrase: Phrase | undefined = queue[index];
  const question = useMemo(
    () => (phrase && level ? SRS.buildOptions(phrase, level) : null),
    [phrase, level]
  );

  function handlePick(optionIndex: number) {
    if (picked !== null || !phrase || !question) return;
    const isCorrect = optionIndex === question.correctIndex;
    setPicked(optionIndex);
    if (isCorrect) setCorrectCount((c) => c + 1);
    const next: SRS.PracticeState = {
      ...srsRef.current,
      [phrase.id]: SRS.gradeAnswer(srsRef.current[phrase.id], isCorrect, Date.now()),
    };
    srsRef.current = next;
    Storage.setPracticeState(next);
  }

  function handleNext() {
    if (index + 1 >= queue.length) {
      statsRef.current = {
        ...statsRef.current,
        completed: statsRef.current.completed + 1,
      };
      Storage.setPracticeStats(statsRef.current);
      setPhase('summary');
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
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
          Every phrase is scheduled for later. Come back tomorrow.
        </Text>
        <View style={styles.emptyCta}>
          <GoldButton title="Done" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  if (phase === 'summary') {
    const tracked = level ? SRS.countTracked(level, srsRef.current) : 0;
    const inMemory = level ? SRS.countInMemory(level, srsRef.current) : 0;
    return (
      <View
        style={[
          styles.root,
          { paddingTop: insets.top + Spacing.md },
        ]}
      >
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
            <Text style={styles.summarySessions}>
              Sessions completed: {statsRef.current.completed}
            </Text>
          </View>
          <GoldButton title="Done" onPress={() => router.back()} />
        </ScrollView>
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
          onPress={() => router.back()}
          hitSlop={8}
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

        <View style={styles.footer}>
          {picked !== null && (
            <>
              <Text
                accessibilityLiveRegion="polite"
                style={[
                  styles.feedback,
                  isCorrectPick ? styles.feedbackCorrect : styles.feedbackWrong,
                ]}
              >
                {isCorrectPick
                  ? 'Correct!'
                  : `Not quite — it means “${phrase.english}”`}
              </Text>
              <GoldButton
                title={isLast ? 'Finish' : 'Next'}
                onPress={handleNext}
              />
            </>
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
    width: 44,
    height: 44,
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
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    width: 44,
    height: 44,
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
    // Reserve space for feedback + button so options don't jump on answer.
    minHeight: ComponentTokens.button.height + Spacing.xl + Spacing.lg,
    justifyContent: 'flex-end',
  },
  feedback: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  feedbackCorrect: { color: Colors.primaryDark },
  feedbackWrong: { color: Colors.accentDark },

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
  emptyCta: { alignSelf: 'stretch' },

  // ── Summary ──
  summaryScroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
  },
  summaryBody: { alignItems: 'center', paddingTop: Spacing.xl },
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
  summaryCard: {
    alignSelf: 'stretch',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
  summarySessions: {
    ...TextStyles.label,
  },
});
