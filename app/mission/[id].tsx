/**
 * Mission Screen — Redesigned with Desert Gold design system
 * Phases: intro -> learn (with micro-quizzes) -> quiz -> result
 */
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
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
import { speakArabic, stopSpeaking } from '@/services/speechService';
import { explainAnswer, isAIConfigured } from '@/services/aiService';
import { missions, type Phrase, type QuizQuestion } from '@/data/missions';
import * as Storage from '@/services/storageService';
import GoldButton from '@/components/GoldButton';
import PhraseCard from '@/components/PhraseCard';
import QuizOption from '@/components/QuizOption';
import ConfettiOverlay from '@/components/ConfettiOverlay';
import AnimatedCounter from '@/components/AnimatedCounter';

type Phase = 'intro' | 'learn' | 'microQuiz' | 'quiz' | 'result';

export default function MissionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const missionData = missions.find((m) => m.id === id);
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showEnglish, setShowEnglish] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);

  // Micro-quiz state
  const [microQuizQuestion, setMicroQuizQuestion] = useState<{
    prompt: string;
    options: string[];
    correctAnswer: string;
  } | null>(null);
  const [microQuizAnswer, setMicroQuizAnswer] = useState<string | null>(null);

  // Intro animation
  const emojiScale = useRef(new Animated.Value(0)).current;
  const introFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase === 'intro') {
      Animated.sequence([
        Animated.spring(emojiScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(introFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase]);

  if (!missionData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Mission not found</Text>
      </View>
    );
  }

  const mission = missionData;
  const currentPhrase = mission.phrases[currentPhraseIndex];
  const currentQuestion = mission.quiz[currentQuizIndex];
  const totalPhrases = mission.phrases.length;
  const totalQuestions = mission.quiz.length;

  async function playPhraseAudio() {
    await speakArabic(currentPhrase.arabic, 0.85);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Auto-play audio when phrase changes
  useEffect(() => {
    if (phase === 'learn') {
      setShowEnglish(false);
      playPhraseAudio();
    }
  }, [currentPhraseIndex, phase]);

  function generateMicroQuiz(): {
    prompt: string;
    options: string[];
    correctAnswer: string;
  } {
    // Pick from recently learned phrases
    const learnedPhrases = mission.phrases.slice(
      Math.max(0, currentPhraseIndex - 2),
      currentPhraseIndex + 1
    );
    const target =
      learnedPhrases[Math.floor(Math.random() * learnedPhrases.length)];
    const otherPhrases = mission.phrases.filter(
      (p) => p.arabic !== target.arabic
    );

    // Guard against empty or insufficient otherPhrases
    if (otherPhrases.length === 0) {
      return {
        prompt: `What does "${target.arabic}" mean?`,
        options: [target.english],
        correctAnswer: target.english,
      };
    }

    // Generate up to 3 unique wrong options (for 4 total)
    const shuffledOthers = [...otherPhrases].sort(() => Math.random() - 0.5);
    const wrongOptions = shuffledOthers
      .slice(0, 3)
      .map((p) => p.english)
      .filter((eng) => eng !== target.english);

    const options = [target.english, ...wrongOptions].sort(
      () => Math.random() - 0.5
    );

    return {
      prompt: `What does "${target.arabic}" mean?`,
      options,
      correctAnswer: target.english,
    };
  }

  function handleNextPhrase() {
    // Check if we should show a micro-quiz (every 3 phrases, not on the first)
    if (
      (currentPhraseIndex + 1) % 3 === 0 &&
      currentPhraseIndex > 0 &&
      currentPhraseIndex < totalPhrases - 1
    ) {
      const quiz = generateMicroQuiz();
      setMicroQuizQuestion(quiz);
      setMicroQuizAnswer(null);
      setPhase('microQuiz');
      return;
    }

    if (currentPhraseIndex < totalPhrases - 1) {
      setCurrentPhraseIndex((prev) => prev + 1);
    } else {
      setPhase('quiz');
    }
  }

  function handleMicroQuizAnswer(answer: string) {
    setMicroQuizAnswer(answer);
    if (answer === microQuizQuestion?.correctAnswer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function handleMicroQuizContinue() {
    setPhase('learn');
    if (currentPhraseIndex < totalPhrases - 1) {
      setCurrentPhraseIndex((prev) => prev + 1);
    } else {
      setPhase('quiz');
    }
  }

  function handlePrevPhrase() {
    if (currentPhraseIndex > 0) {
      setCurrentPhraseIndex((prev) => prev - 1);
    }
  }

  async function handleAnswer(answer: string) {
    setSelectedAnswer(answer);
    setShowExplanation(true);
    setAiExplanation('');

    if (answer === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (isAIConfigured()) {
        setAiLoading(true);
        const explanation = await explainAnswer(
          currentQuestion.question,
          currentQuestion.correctAnswer,
          answer
        );
        setAiExplanation(explanation);
        setAiLoading(false);
      }
    }
  }

  async function handleNextQuestion() {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAiExplanation('');

    if (currentQuizIndex < totalQuestions - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      // score state may not reflect the current answer yet (setState is async)
      const finalScore = selectedAnswer === currentQuestion.correctAnswer ? score + 1 : score;
      const scorePercent = totalQuestions > 0 ? finalScore / totalQuestions : 0;

      setPhase('result');
      setShowConfetti(finalScore >= totalQuestions * 0.7);

      // Only mark mission as completed if score >= 50%
      if (scorePercent >= 0.5) {
        await Storage.completeMission(mission.id);
        await Storage.updateWeeklyChallenge('complete_missions', 1);
        await Storage.updateMonthlyChallenge('all_missions', 1);
      }
      // Track phrases learned
      if (finalScore > 0) {
        await Storage.updateWeeklyChallenge('learn_phrases', finalScore);
      }
      // Track perfect quiz
      if (finalScore === totalQuestions) {
        await Storage.updateWeeklyChallenge('perfect_quizzes', 1);
      }

      // Award full XP if score >= 70%, otherwise award partial XP proportional to score
      const xpEarned = scorePercent >= 0.7
        ? mission.xpReward
        : Math.floor(mission.xpReward * scorePercent);
      const coinsEarned = Math.floor(xpEarned / 5);
      setEarnedXP(xpEarned);
      setEarnedCoins(coinsEarned);

      if (xpEarned > 0) {
        await Storage.addXP(xpEarned);
      }
      if (coinsEarned > 0) {
        await Storage.addCoins(coinsEarned);
      }
      await Storage.recordActivity();
    }
  }

  function getQuizOptionState(
    option: string
  ): 'default' | 'correct' | 'wrong' | 'disabled' {
    if (!showExplanation) return 'default';
    if (option === currentQuestion.correctAnswer) return 'correct';
    if (option === selectedAnswer) return 'wrong';
    return 'disabled';
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: mission.title,
          headerStyle: { backgroundColor: Colors.card },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
        }}
      />
      <View style={styles.container}>
        {/* INTRO PHASE */}
        {phase === 'intro' && (
          <View style={styles.introContainer}>
            <View
              style={styles.introGradient}
            >
              <Animated.Text
                style={[
                  styles.introEmoji,
                  { transform: [{ scale: emojiScale }] },
                ]}
              >
                {mission.emoji}
              </Animated.Text>
              <Animated.View style={{ opacity: introFade, width: '100%', alignItems: 'center' }}>
                <Text style={styles.introTitle}>{mission.title}</Text>
                <View style={styles.introScenarioCard}>
                  <Text style={styles.introScenarioText}>
                    {mission.scenario}
                  </Text>
                </View>
                <View style={styles.introStatsRow}>
                  <View style={styles.introStat}>
                    <Ionicons name="book-outline" size={18} color={Colors.primary} />
                    <Text style={styles.introStatText}>
                      {totalPhrases} phrases
                    </Text>
                  </View>
                  <View style={styles.introStat}>
                    <Ionicons name="help-circle-outline" size={18} color={Colors.primary} />
                    <Text style={styles.introStatText}>
                      {totalQuestions} quiz questions
                    </Text>
                  </View>
                  <View style={styles.introStat}>
                    <Ionicons name="star-outline" size={18} color={Colors.xpGold} />
                    <Text style={styles.introStatText}>
                      {mission.xpReward} XP
                    </Text>
                  </View>
                </View>
                <GoldButton
                  title="Let's Go!"
                  icon="arrow-forward"
                  onPress={() => setPhase('learn')}
                  style={{ marginTop: Spacing.xl }}
                />
              </Animated.View>
            </View>
          </View>
        )}

        {/* LEARN PHASE */}
        {phase === 'learn' && (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Progress Bar */}
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {currentPhraseIndex + 1} / {totalPhrases}
              </Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${((currentPhraseIndex + 1) / totalPhrases) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Phrase Card */}
            <View style={styles.phraseCardWrapper}>
              <PhraseCard
                arabic={currentPhrase.arabic}
                transliteration={currentPhrase.transliteration}
                english={currentPhrase.english}
                category={currentPhrase.category}
                showEnglish={showEnglish}
                onTap={() => setShowEnglish(!showEnglish)}
                size="lg"
              />
              {!showEnglish && (
                <TouchableOpacity
                  style={styles.revealHint}
                  onPress={() => setShowEnglish(true)}
                >
                  <Ionicons name="eye-outline" size={16} color={Colors.primary} />
                  <Text style={styles.revealHintText}>
                    Tap to reveal English
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Navigation */}
            <View style={styles.navRow}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  currentPhraseIndex === 0 && styles.navButtonDisabled,
                ]}
                onPress={handlePrevPhrase}
                disabled={currentPhraseIndex === 0}
              >
                <Ionicons name="chevron-back" size={20} color={Colors.text} />
                <Text style={styles.navButtonText}>Previous</Text>
              </TouchableOpacity>

              <GoldButton
                title={
                  currentPhraseIndex === totalPhrases - 1
                    ? 'Start Quiz'
                    : 'Next'
                }
                icon={
                  currentPhraseIndex === totalPhrases - 1
                    ? 'checkmark-circle'
                    : 'chevron-forward'
                }
                onPress={handleNextPhrase}
                fullWidth={false}
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        )}

        {/* MICRO QUIZ PHASE */}
        {phase === 'microQuiz' && microQuizQuestion && (
          <View style={styles.microQuizContainer}>
            <View style={styles.microQuizBadge}>
              <Ionicons name="flash" size={16} color={Colors.xpGold} />
              <Text style={styles.microQuizBadgeText}>Quick Check!</Text>
            </View>

            <Text style={styles.microQuizPrompt}>
              {microQuizQuestion.prompt}
            </Text>

            {microQuizQuestion.options.map((option, i) => {
              let state: 'default' | 'correct' | 'wrong' | 'disabled' =
                'default';
              if (microQuizAnswer) {
                if (option === microQuizQuestion.correctAnswer)
                  state = 'correct';
                else if (option === microQuizAnswer) state = 'wrong';
                else state = 'disabled';
              }
              return (
                <QuizOption
                  key={i}
                  text={option}
                  state={state}
                  index={i}
                  onPress={() => handleMicroQuizAnswer(option)}
                />
              );
            })}

            {microQuizAnswer && (
              <GoldButton
                title="Continue"
                icon="arrow-forward"
                onPress={handleMicroQuizContinue}
                style={{ marginTop: Spacing.lg }}
              />
            )}
          </View>
        )}

        {/* QUIZ PHASE */}
        {phase === 'quiz' && currentQuestion && (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.progressRow}>
              <View style={styles.quizBadge}>
                <Ionicons name="help-circle" size={14} color={Colors.primary} />
                <Text style={styles.quizBadgeText}>
                  Quiz {currentQuizIndex + 1}/{totalQuestions}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${((currentQuizIndex + 1) / totalQuestions) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.quizCard}>
              <Text style={styles.quizQuestion}>
                {currentQuestion.question}
              </Text>

              {currentQuestion.options ? (
                currentQuestion.options.map((option, i) => (
                  <QuizOption
                    key={i}
                    text={option}
                    state={getQuizOptionState(option)}
                    index={i}
                    onPress={() => handleAnswer(option)}
                  />
                ))
              ) : (
                <View>
                  <Text style={styles.freeAnswerHint}>
                    Answer: {currentQuestion.correctAnswer}
                  </Text>
                  {!showExplanation && (
                    <GoldButton
                      title="I Got It!"
                      icon="checkmark-circle"
                      variant="secondary"
                      onPress={() => {
                        setSelectedAnswer(currentQuestion.correctAnswer);
                        setShowExplanation(true);
                        setScore((prev) => prev + 1);
                        Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success
                        );
                      }}
                      style={{ marginTop: Spacing.md }}
                    />
                  )}
                </View>
              )}

              {showExplanation && currentQuestion.explanation && (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationText}>
                    {currentQuestion.explanation}
                  </Text>
                </View>
              )}

              {aiLoading && (
                <View style={styles.aiBox}>
                  <Text style={styles.aiText}>
                    Getting AI insight...
                  </Text>
                </View>
              )}
              {aiExplanation.length > 0 && (
                <View style={styles.aiBox}>
                  <Text style={[styles.aiText, { color: Colors.text }]}>
                    {aiExplanation}
                  </Text>
                </View>
              )}

              {showExplanation && (
                <GoldButton
                  title={
                    currentQuizIndex === totalQuestions - 1
                      ? 'See Results'
                      : 'Next Question'
                  }
                  icon="arrow-forward"
                  onPress={handleNextQuestion}
                  style={{ marginTop: Spacing.lg }}
                />
              )}
            </View>
          </ScrollView>
        )}

        {/* RESULT PHASE */}
        {phase === 'result' && (
          <View style={styles.resultContainer}>
            <View
              style={[
                styles.resultGradient,
                score >= totalQuestions * 0.7
                  ? styles.resultSuccess
                  : styles.resultDefault,
              ]}
            >
              <ConfettiOverlay
                visible={showConfetti}
                onDone={() => setShowConfetti(false)}
              />

              <Text style={styles.resultEmoji}>
                {score === totalQuestions
                  ? '🌟'
                  : score >= totalQuestions * 0.7
                  ? '🎉'
                  : score >= totalQuestions * 0.5
                  ? '👍'
                  : '💪'}
              </Text>
              <Text style={styles.resultTitle}>
                {score === totalQuestions
                  ? 'Perfect!'
                  : score >= totalQuestions * 0.7
                  ? 'Great Job!'
                  : score >= totalQuestions * 0.5
                  ? 'Not Bad!'
                  : 'Try Again!'}
              </Text>
              <Text style={styles.resultScore}>
                {score} / {totalQuestions} correct
              </Text>

              <View style={styles.resultRewards}>
                <View style={styles.rewardCard}>
                  <Text style={styles.rewardLabel}>XP Earned</Text>
                  <AnimatedCounter
                    value={earnedXP}
                    prefix="+"
                    delay={400}
                    style={styles.rewardValue}
                  />
                </View>
                <View style={styles.rewardCard}>
                  <Text style={styles.rewardLabel}>Coins</Text>
                  <AnimatedCounter
                    value={earnedCoins}
                    prefix="+"
                    delay={700}
                    style={styles.rewardValue}
                  />
                </View>
              </View>

              <GoldButton
                title="Done"
                icon="checkmark"
                variant="outline"
                onPress={() => router.back()}
                style={{ marginTop: Spacing.xl }}
                textStyle={{ color: '#FFF' }}
              />
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginTop: 100,
  },

  // ── Intro ──
  introContainer: {
    flex: 1,
  },
  introGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  introEmoji: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  introTitle: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.black,
    fontWeight: FontWeight.black,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  introScenarioCard: {
    ...ClayStyle.card,
    padding: Spacing.lg,
    width: '100%',
    ...Shadows.clay,
  },
  introScenarioText: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  introStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  introStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  introStatText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    fontWeight: FontWeight.semibold,
  },

  // ── Progress ──
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    minWidth: 50,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  // ── Phrase Card ──
  phraseCardWrapper: {
    alignItems: 'center',
  },
  revealHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  revealHintText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // ── Nav ──
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 4,
    ...ClayStyle.card,
    borderRadius: BorderRadius.lg,
    ...Shadows.soft,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    fontWeight: FontWeight.semibold,
  },

  // ── Micro Quiz ──
  microQuizContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  microQuizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  microQuizBadgeText: {
    color: Colors.xpGold,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  microQuizPrompt: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 36,
  },

  // ── Quiz ──
  quizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  quizBadgeText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  quizCard: {
    ...ClayStyle.card,
    padding: Spacing.lg,
    ...Shadows.clay,
  },
  quizQuestion: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
    lineHeight: 30,
  },
  freeAnswerHint: {
    color: Colors.primaryLight,
    fontSize: FontSize.lg,
    fontStyle: 'italic',
    marginTop: Spacing.md,
  },
  explanationBox: {
    ...ClayStyle.card,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  explanationText: {
    color: Colors.primaryDark,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  aiBox: {
    ...ClayStyle.card,
    backgroundColor: 'rgba(155, 89, 182, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  aiText: {
    color: Colors.xpPurple,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  // ── Result ──
  resultContainer: {
    flex: 1,
  },
  resultGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  resultSuccess: {
    ...ClayStyle.cardSolid('#1B9B6E'),
    borderRadius: 0,
  },
  resultDefault: {
    ...ClayStyle.cardSolid('#1E2340'),
    borderRadius: 0,
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  resultTitle: {
    color: '#FFF',
    fontSize: FontSize.hero,
    fontFamily: FontFamily.black,
    fontWeight: FontWeight.black,
  },
  resultScore: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.xl,
    marginTop: Spacing.sm,
  },
  resultRewards: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
  rewardCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
    borderRightColor: 'rgba(0, 0, 0, 0.06)',
    borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  },
  rewardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  rewardValue: {
    color: Colors.xpGold,
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.black,
    fontWeight: FontWeight.black,
  },
});
