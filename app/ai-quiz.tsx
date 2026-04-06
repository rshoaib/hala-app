/**
 * AI Quiz Screen — Gemini-generated adaptive questions
 * Desert Gold themed with QuizOption, AnimatedCounter, ConfettiOverlay
 */
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  FontFamily,
  BorderRadius,
  Shadows,
  ComponentTokens,
  ClayStyle,
} from '@/constants/theme';
import {
  generateQuiz,
  isAIConfigured,
  type AIQuizQuestion,
} from '@/services/aiService';
import { missions } from '@/data/missions';
import * as Storage from '@/services/storageService';
import QuizOption from '@/components/QuizOption';
import GoldButton from '@/components/GoldButton';
import AnimatedCounter from '@/components/AnimatedCounter';
import ConfettiOverlay from '@/components/ConfettiOverlay';

type Phase = 'loading' | 'playing' | 'result' | 'error';

export default function AIQuizScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<AIQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // All phrases from completed missions (fallback to all)
  const allPhrases = missions.flatMap((m) => m.phrases);

  useEffect(() => {
    loadQuiz();
  }, []);

  // Loading spinner animation
  useEffect(() => {
    if (phase === 'loading') {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [phase]);

  async function loadQuiz() {
    setPhase('loading');

    if (!isAIConfigured()) {
      setErrorMsg('Please set your Gemini API key in constants/aiConfig.ts');
      setPhase('error');
      return;
    }

    try {
      const generatedQuestions = await generateQuiz(allPhrases, 5);

      if (generatedQuestions.length === 0) {
        setErrorMsg("AI couldn't generate questions. Try again!");
        setPhase('error');
        return;
      }

      setQuestions(generatedQuestions);
      setPhase('playing');
      setCurrentIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } catch (error: any) {
      if (error?.message === 'GEMINI_API_KEY_NOT_SET') {
        setErrorMsg('Please set your Gemini API key in constants/aiConfig.ts');
      } else {
        setErrorMsg('Something went wrong. Check your internet connection.');
      }
      setPhase('error');
    }
  }

  function handleAnswer(answer: string) {
    if (selectedAnswer) return;

    setSelectedAnswer(answer);
    const correct = answer === questions[currentIndex].correctAnswer;

    if (correct) {
      setScore((prev) => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setShowExplanation(true);
  }

  async function handleNext() {
    setSelectedAnswer(null);
    setShowExplanation(false);

    if (currentIndex >= questions.length - 1) {
      setPhase('result');
      const xpEarned = score * 15;
      if (xpEarned > 0) {
        await Storage.addXP(xpEarned);
        await Storage.recordActivity();
      }
      // Show confetti for perfect score
      if (score === questions.length) {
        setTimeout(() => setShowConfetti(true), 300);
      }
      return;
    }

    // Slide animation
    slideAnim.setValue(20);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();

    setCurrentIndex((prev) => prev + 1);
  }

  function getOptionState(option: string): 'default' | 'correct' | 'wrong' | 'disabled' {
    if (!selectedAnswer) return 'default';
    if (option === questions[currentIndex].correctAnswer) return 'correct';
    if (option === selectedAnswer) return 'wrong';
    return 'disabled';
  }

  // ── LOADING ──
  if (phase === 'loading') {
    const spin = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: 'AI Quiz',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }}
        />
        <View style={styles.centerContainer}>
          <Animated.View style={[styles.loadingSpinner, { transform: [{ rotate: spin }] }]}>
            <View style={styles.loadingSpinnerInner}>
              <Ionicons name="sparkles" size={28} color="#FFF" />
            </View>
          </Animated.View>
          <Text style={styles.loadingTitle}>Generating Quiz...</Text>
          <Text style={styles.loadingSubtitle}>
            AI is creating personalized questions just for you
          </Text>
        </View>
      </>
    );
  }

  // ── ERROR ──
  if (phase === 'error') {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: 'AI Quiz',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }}
        />
        <View style={styles.centerContainer}>
          <View style={styles.errorIconCircle}>
            <Text style={styles.errorEmoji}>😅</Text>
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorDesc}>{errorMsg}</Text>
          <View style={{ width: '100%', marginTop: Spacing.xl }}>
            <GoldButton title="Try Again" onPress={loadQuiz} icon="refresh" />
          </View>
        </View>
      </>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const pct = questions.length > 0 ? score / questions.length : 0;
    const xpEarned = score * 15;
    const isPerfect = pct === 1;

    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: 'AI Quiz',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }}
        />
        <View style={styles.centerContainer}>
          <ConfettiOverlay visible={showConfetti} onDone={() => setShowConfetti(false)} />

          <View style={styles.resultCard}>
            <View
              style={[
                styles.resultGradientBg,
                { backgroundColor: isPerfect ? Colors.primary : pct >= 0.6 ? Colors.secondary : Colors.accent },
              ]}
            >
              <Text style={styles.resultEmoji}>
                {isPerfect ? '🌟' : pct >= 0.8 ? '🎉' : pct >= 0.5 ? '👍' : '💪'}
              </Text>
              <Text style={styles.resultTitle}>
                {isPerfect ? 'PERFECT!' : pct >= 0.8 ? 'Great Job!' : pct >= 0.5 ? 'Good Try!' : 'Keep Learning!'}
              </Text>
            </View>

            <View style={styles.resultBody}>
              <View style={styles.resultStats}>
                <View style={styles.resultStatItem}>
                  <AnimatedCounter
                    value={score}
                    suffix={`/${questions.length}`}
                    style={styles.resultStatNum}
                    duration={800}
                  />
                  <Text style={styles.resultStatLabel}>Correct</Text>
                </View>
                <View style={styles.resultStatDivider} />
                <View style={styles.resultStatItem}>
                  <AnimatedCounter
                    value={xpEarned}
                    prefix="+"
                    style={[styles.resultStatNum, { color: Colors.xpGold }]}
                    duration={800}
                    delay={300}
                  />
                  <Text style={styles.resultStatLabel}>XP Earned</Text>
                </View>
              </View>

              <View style={styles.resultAINote}>
                <Ionicons name="sparkles" size={14} color={Colors.xpPurple} />
                <Text style={styles.resultAINoteText}>
                  Questions generated by AI — every quiz is unique!
                </Text>
              </View>

              <View style={styles.resultActions}>
                <GoldButton title="New Quiz" onPress={loadQuiz} icon="refresh" />
                <GoldButton
                  title="Done"
                  onPress={() => router.back()}
                  variant="outline"
                  size="sm"
                  style={{ marginTop: Spacing.sm }}
                />
              </View>
            </View>
          </View>
        </View>
      </>
    );
  }

  // ── PLAYING ──
  const q = questions[currentIndex];
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: `Question ${currentIndex + 1}/${questions.length}`,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }}
      />
      <View style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        {/* AI Badge */}
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={14} color={Colors.xpPurple} />
          <Text style={styles.aiBadgeText}>AI Generated</Text>
        </View>

        {/* Question */}
        <Animated.View style={[styles.questionWrap, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.questionText}>{q.question}</Text>

          {q.options.map((option, i) => (
            <QuizOption
              key={i}
              text={option}
              index={i}
              state={getOptionState(option)}
              onPress={() => handleAnswer(option)}
            />
          ))}

          {/* AI Explanation */}
          {showExplanation && q.explanation && (
            <View style={styles.explanationBox}>
              <View style={styles.explanationHeader}>
                <Ionicons name="sparkles" size={16} color={Colors.xpPurple} />
                <Text style={styles.explanationLabel}>AI Explanation</Text>
              </View>
              <Text style={styles.explanationText}>{q.explanation}</Text>
            </View>
          )}

          {/* Next Button */}
          {showExplanation && (
            <View style={{ marginTop: Spacing.lg }}>
              <GoldButton
                title={currentIndex >= questions.length - 1 ? 'See Results' : 'Next Question'}
                onPress={handleNext}
                icon="chevron-forward"
              />
            </View>
          )}
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },

  // ── Loading ──
  loadingSpinner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: Spacing.lg,
  },
  loadingSpinnerInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(0,0,0,0.06)',
    ...Shadows.glow,
  },
  loadingTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
  loadingSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  // ── Error ──
  errorIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.warning + '40',
  },
  errorEmoji: { fontSize: 44 },
  errorTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
  },
  errorDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },

  // ── Progress ──
  progressBar: {
    height: ComponentTokens.progressBar.height,
    backgroundColor: Colors.surface,
    borderRadius: ComponentTokens.progressBar.borderRadius,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: ComponentTokens.progressBar.borderRadius,
    backgroundColor: Colors.primary,
  },

  // ── AI Badge ──
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 4,
    backgroundColor: Colors.xpPurple + '12',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.xpPurple + '20',
  },
  aiBadgeText: {
    color: Colors.xpPurple,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // ── Question ──
  questionWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  questionText: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 36,
  },

  // ── Explanation ──
  explanationBox: {
    backgroundColor: Colors.xpPurple + '08',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.xpPurple,
    ...Shadows.soft,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  explanationLabel: {
    color: Colors.xpPurple,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  explanationText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  // ── Result ──
  resultCard: {
    width: '100%',
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    ...Shadows.cardLifted,
  },
  resultGradientBg: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
  },
  resultEmoji: { fontSize: 56, marginBottom: Spacing.sm },
  resultTitle: {
    color: '#FFF',
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
  },
  resultBody: {
    padding: Spacing.lg,
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  resultStatItem: { alignItems: 'center' },
  resultStatNum: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
  },
  resultStatLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },
  resultStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  resultAINote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultAINoteText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  resultActions: {
    gap: Spacing.sm,
  },
});
