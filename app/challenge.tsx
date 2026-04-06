/**
 * Daily Challenge Screen — Desert Gold redesign
 * Circular countdown timer, score multiplier, QuizOption component
 */
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  FontFamily,
  BorderRadius,
  Shadows,
  ClayStyle,
} from '@/constants/theme';
import { dailyChallenges, type ChallengeQuestion } from '@/data/dailyChallenges';
import * as Storage from '@/services/storageService';
import GoldButton from '@/components/GoldButton';
import QuizOption from '@/components/QuizOption';
import AnimatedCounter from '@/components/AnimatedCounter';
import ConfettiOverlay from '@/components/ConfettiOverlay';
import { speakArabic, stopSpeaking } from '@/services/speechService';

type Phase = 'ready' | 'playing' | 'result';

// Extract Arabic text from prompt strings like 'Translate: "هلا"' or '"I want a ___" (تاكسي)'
function extractArabic(text: string): string | null {
  // Match Arabic Unicode range sequences
  const match = text.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\s]+/g);
  if (match) {
    const cleaned = match.join(' ').trim();
    return cleaned.length > 0 ? cleaned : null;
  }
  return null;
}

export default function ChallengeScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('ready');
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFinishedRef = useRef(false);
  const scoreRef = useRef(0);
  const xpEarnedRef = useRef(0);
  const questionSlide = useRef(new Animated.Value(0)).current;
  const multiplierScale = useRef(new Animated.Value(1)).current;

  const dayOfWeek = new Date().getDay();
  const todayChallenge =
    dailyChallenges.find((c) => c.dayOfWeek === dayOfWeek) ||
    dailyChallenges[0];
  const questions = todayChallenge.questions;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeaking();
    };
  }, []);

  // Multiplier pulse animation
  useEffect(() => {
    if (multiplier > 1) {
      Animated.sequence([
        Animated.timing(multiplierScale, {
          toValue: 1.4,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(multiplierScale, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [multiplier]);

  function startChallenge() {
    setPhase('playing');
    setTimeLeft(60);
    setCurrentQuestion(0);
    setScore(0);
    setXpEarned(0);
    setSelectedAnswer(null);
    setStreak(0);
    setMultiplier(1);
    scoreRef.current = 0;
    xpEarnedRef.current = 0;
    isFinishedRef.current = false;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          finishChallenge();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleAnswer(answer: string) {
    setSelectedAnswer(answer);
    const question = questions[currentQuestion];
    const isCorrect = answer === question.correctAnswer;

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const newMultiplier = newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : 1;
      setMultiplier(newMultiplier);
      const pointsEarned = question.xpReward * newMultiplier;
      scoreRef.current += 1;
      xpEarnedRef.current += pointsEarned;
      setScore((prev) => prev + 1);
      setXpEarned((prev) => prev + pointsEarned);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setStreak(0);
      setMultiplier(1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      setSelectedAnswer(null);
      if (currentQuestion < questions.length - 1) {
        questionSlide.setValue(30);
        Animated.timing(questionSlide, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
        setCurrentQuestion((prev) => prev + 1);
      } else {
        finishChallenge();
      }
    }, 600);
  }

  async function finishChallenge() {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const finalScore = scoreRef.current;
    const finalXP = xpEarnedRef.current;

    setPhase('result');
    const pct = questions.length > 0 ? finalScore / questions.length : 0;
    if (pct >= 0.7) setShowConfetti(true);

    // Only mark complete and award XP if at least 1 correct answer
    if (finalScore > 0) {
      await Storage.completeDailyChallenge();
      await Storage.addXP(finalXP);
      await Storage.recordActivity();
    }
  }

  function getOptionState(
    option: string
  ): 'default' | 'correct' | 'wrong' | 'disabled' {
    if (!selectedAnswer) return 'default';
    const question = questions[currentQuestion];
    if (option === question.correctAnswer) return 'correct';
    if (option === selectedAnswer) return 'wrong';
    return 'disabled';
  }

  // ── READY ──
  if (phase === 'ready') {
    return (
      <View style={styles.container}>
        <View style={styles.readyContent}>
          <Text style={styles.readyEmoji}>{todayChallenge.emoji}</Text>
          <Text style={styles.readyTitle}>{todayChallenge.title}</Text>
          <Text style={styles.readyDesc}>
            Answer {questions.length} questions in 60 seconds!
          </Text>

          <View style={styles.readyRules}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconBg}>
                <Ionicons name="timer-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.ruleText}>60 seconds total</Text>
            </View>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconBg}>
                <Ionicons name="help-circle-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.ruleText}>{questions.length} questions</Text>
            </View>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIconBg}>
                <Ionicons name="flash-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.ruleText}>
                Combo multiplier for streaks
              </Text>
            </View>
          </View>

          <GoldButton
            title="START CHALLENGE"
            icon="flash"
            variant="accent"
            onPress={startChallenge}
            style={{ marginTop: Spacing.xxl }}
          />
        </View>
      </View>
    );
  }

  // ── PLAYING ──
  if (phase === 'playing') {
    const question = questions[currentQuestion];
    const timerProgress = timeLeft / 60;
    const timerColor = timeLeft <= 10 ? Colors.error : Colors.primary;

    return (
      <View style={styles.container}>
        {/* Timer Bar */}
        <View style={styles.timerBar}>
          <View style={styles.timerBarBg}>
            <View
              style={[
                styles.timerBarFill,
                {
                  width: `${timerProgress * 100}%`,
                  backgroundColor: timerColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.playHeader}>
          <View style={styles.timerDisplay}>
            <Ionicons
              name="timer-outline"
              size={20}
              color={timeLeft <= 10 ? Colors.error : Colors.primary}
            />
            <Text
              style={[
                styles.timerText,
                timeLeft <= 10 && { color: Colors.error },
              ]}
            >
              {timeLeft}s
            </Text>
          </View>

          {/* Progress dots */}
          <View style={styles.progressDots}>
            {questions.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < currentQuestion && styles.dotCompleted,
                  i === currentQuestion && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.liveStats}>
            {multiplier > 1 && (
              <Animated.View
                style={[
                  styles.multiplierBadge,
                  { transform: [{ scale: multiplierScale }] },
                ]}
              >
                <Text style={styles.multiplierText}>{multiplier}x</Text>
              </Animated.View>
            )}
            <Text style={styles.liveScore}>{score}/{questions.length}</Text>
          </View>
        </View>

        {/* Question */}
        <Animated.View
          style={[
            styles.questionArea,
            { transform: [{ translateY: questionSlide }] },
          ]}
        >
          <Text style={styles.questionText}>{question.prompt}</Text>

          {/* Speak Arabic from prompt */}
          {(() => {
            const arabic = question.promptAr || extractArabic(question.prompt);
            return arabic ? (
              <TouchableOpacity
                style={styles.questionSpeaker}
                onPress={() => speakArabic(arabic)}
                activeOpacity={0.7}
              >
                <View style={styles.questionSpeakerCircle}>
                  <Ionicons name="volume-medium" size={18} color="#FFF" />
                </View>
                <Text style={styles.questionSpeakerText}>Listen</Text>
              </TouchableOpacity>
            ) : null;
          })()}

          {question.options ? (
            question.options.map((option, i) => (
              <QuizOption
                key={i}
                text={option}
                state={getOptionState(option)}
                index={i}
                onPress={() => handleAnswer(option)}
              />
            ))
          ) : (
            <QuizOption
              text="Show Answer"
              state="default"
              onPress={() => handleAnswer(question.correctAnswer)}
            />
          )}
        </Animated.View>

        {/* Live XP */}
        <View style={styles.liveXPRow}>
          <Ionicons name="star" size={16} color={Colors.xpGold} />
          <Text style={styles.liveXP}>+{xpEarned} XP</Text>
          {streak >= 2 && (
            <View style={styles.streakPill}>
              <Ionicons name="flame" size={14} color={Colors.fire} />
              <Text style={styles.streakText}>{streak} streak</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  // ── RESULT ──
  const pct = questions.length > 0 ? score / questions.length : 0;
  const isGreat = pct >= 0.7;
  const isPerfect = score === questions.length;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.resultGradient,
          isGreat
            ? ClayStyle.cardSolid(Colors.secondary)
            : ClayStyle.cardSolid('#1E2340'),
        ]}
      >
        <ConfettiOverlay
          visible={showConfetti}
          onDone={() => setShowConfetti(false)}
        />

        <Text style={styles.resultEmoji}>
          {isPerfect ? '🌟' : isGreat ? '🎉' : score > 0 ? '💪' : '⏰'}
        </Text>
        <Text style={styles.resultTitle}>
          {isPerfect ? 'PERFECT!' : isGreat ? 'Great Job!' : score > 0 ? 'Keep Trying!' : 'Time\'s Up!'}
        </Text>
        <Text style={styles.resultSubtitle}>
          {isGreat ? 'Challenge saved! +' + xpEarned + ' XP' :
           score > 0 ? 'Progress saved. Try again for a better score!' :
           'No points earned. Give it another shot!'}
        </Text>

        <View style={styles.resultStatsRow}>
          <View style={styles.resultStatItem}>
            <AnimatedCounter
              value={score}
              suffix={`/${questions.length}`}
              delay={200}
              style={styles.resultStatValue}
            />
            <Text style={styles.resultStatLabel}>Correct</Text>
          </View>
          <View style={styles.resultStatDivider} />
          <View style={styles.resultStatItem}>
            <AnimatedCounter
              value={xpEarned}
              prefix="+"
              delay={500}
              style={styles.resultStatValue}
            />
            <Text style={styles.resultStatLabel}>XP Earned</Text>
          </View>
          <View style={styles.resultStatDivider} />
          <View style={styles.resultStatItem}>
            <Text style={styles.resultStatValue}>{timeLeft}s</Text>
            <Text style={styles.resultStatLabel}>Remaining</Text>
          </View>
        </View>

        <View style={{ gap: Spacing.md, marginTop: Spacing.lg, width: '100%', paddingHorizontal: Spacing.lg }}>
          {!isGreat && (
            <GoldButton
              title="TRY AGAIN"
              icon="refresh"
              onPress={() => {
                setPhase('ready');
                setScore(0);
                setXpEarned(0);
                setTimeLeft(60);
                setCurrentQuestion(0);
                setSelectedAnswer(null);
                setStreak(0);
                setMultiplier(1);
                scoreRef.current = 0;
                xpEarnedRef.current = 0;
                isFinishedRef.current = false;
                setShowConfetti(false);
              }}
              style={{ width: '100%' }}
            />
          )}
          <GoldButton
            title="Done"
            icon="checkmark"
            variant="outline"
            onPress={() => router.back()}
            style={{ width: '100%' }}
            textStyle={{ color: '#FFF' }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Ready ──
  readyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.background,
  },
  readyEmoji: {
    fontSize: 72,
    marginBottom: Spacing.md,
  },
  readyTitle: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
  },
  readyDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
  },
  readyRules: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
    width: '100%',
    paddingHorizontal: Spacing.lg,
    padding: Spacing.lg,
    ...ClayStyle.card,
    ...Shadows.clay,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ruleIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.5)',
    borderBottomColor: 'rgba(0,0,0,0.06)',
    borderLeftColor: 'rgba(255,255,255,0.25)',
    borderRightColor: 'rgba(0,0,0,0.03)',
  },
  ruleText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    fontFamily: FontFamily.medium,
  },

  // ── Playing ──
  timerBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  timerBarBg: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  playHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  timerText: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
  },
  multiplierBadge: {
    backgroundColor: Colors.xpGold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: 2,
  },
  multiplierText: {
    color: '#FFF',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
  },
  liveStats: {
    alignItems: 'center',
    gap: 2,
  },
  liveScore: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface,
  },
  dotCompleted: {
    backgroundColor: Colors.success,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 16,
  },
  questionArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  questionText: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 36,
  },
  questionSpeaker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  questionSpeakerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(0,0,0,0.06)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },
  questionSpeakerText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.semibold,
  },
  liveXPRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  liveXP: {
    color: Colors.xpGold,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  streakText: {
    color: Colors.fire,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // ── Result ──
  resultGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: 0,
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  resultTitle: {
    color: '#FFF',
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
  },
  resultSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  resultStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderBottomColor: 'rgba(0,0,0,0.1)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(0,0,0,0.06)',
  },
  resultStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultStatValue: {
    color: '#FFF',
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
  },
  resultStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },
  resultStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
