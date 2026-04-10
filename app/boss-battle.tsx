/**
 * Boss Battle Screen — Desert Gold redesign
 * Dark desert theme, animated HP bar, QuizOption, victory/defeat
 */
import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Dimensions,
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
} from '@/constants/theme';
import { missions } from '@/data/missions';
import {
  generateBossQuestions,
  isAIConfigured,
  type AIQuizQuestion,
} from '@/services/aiService';
import * as Storage from '@/services/storageService';
import GoldButton from '@/components/GoldButton';
import QuizOption from '@/components/QuizOption';
import AnimatedCounter from '@/components/AnimatedCounter';
import ConfettiOverlay from '@/components/ConfettiOverlay';

const { width } = Dimensions.get('window');

// Static fallback questions from Level 1 missions
const staticBossQuestions = missions
  .filter((m) => m.level === 1)
  .flatMap((m) => m.quiz);

// All phrases for AI generation
const allPhrases = missions.flatMap((m) => m.phrases);

type Phase = 'intro' | 'loading' | 'battle' | 'victory' | 'defeat' | 'error';

export default function BossBattleScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [bossHP, setBossHP] = useState(100);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bossQuestions, setBossQuestions] = useState<AIQuizQuestion[]>([]);
  const [isAIGenerated, setIsAIGenerated] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bossScaleAnim = useRef(new Animated.Value(1)).current;
  const hpFlashAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Use refs for values accessed inside setTimeout to avoid stale closures
  const livesRef = useRef(lives);
  livesRef.current = lives;
  const bossHPRef = useRef(bossHP);
  bossHPRef.current = bossHP;
  const currentQRef = useRef(currentQ);
  currentQRef.current = currentQ;

  const totalQ = bossQuestions.length;
  const hpPerQuestion = totalQ > 0 ? 100 / totalQ : 0;

  async function startBattle() {
    setPhase('loading');
    setCurrentQ(0);
    setScore(0);
    setLives(3);
    setBossHP(100);
    setShowConfetti(false);

    // Spin animation for loading
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    // Try AI generation first, fall back to static
    if (isAIConfigured()) {
      try {
        const aiQuestions = await generateBossQuestions(allPhrases, 15);
        if (aiQuestions.length >= 5) {
          setBossQuestions(aiQuestions);
          setIsAIGenerated(true);
          setPhase('battle');
          return;
        }
      } catch {}
    }

    // Fallback: shuffle static questions
    const shuffled = [...staticBossQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, 15)
      .map((q) => ({
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
      }));
    setBossQuestions(shuffled);
    setIsAIGenerated(false);
    setPhase('battle');
  }

  function handleAnswer(answer: string) {
    setSelectedAnswer(answer);
    const isCorrect = answer === bossQuestions[currentQ].correctAnswer;

    if (isCorrect) {
      setScore((p) => p + 1);
      setBossHP((prev) => Math.max(0, prev - hpPerQuestion));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Boss hit animation
      Animated.sequence([
        Animated.timing(bossScaleAnim, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(bossScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // HP flash
      hpFlashAnim.setValue(1);
      Animated.timing(hpFlashAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      setLives((p) => p - 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Screen shake
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => {
      setSelectedAnswer(null);

      if (!isCorrect && livesRef.current <= 1) {
        setPhase('defeat');
        return;
      }

      const latestHP = isCorrect
        ? Math.max(0, bossHPRef.current)
        : bossHPRef.current;
      if (currentQRef.current >= totalQ - 1 || latestHP <= 0) {
        handleVictory();
        return;
      }

      setCurrentQ((p) => p + 1);
    }, 800);
  }

  async function handleVictory() {
    setPhase('victory');
    setShowConfetti(true);
    await Storage.addXP(200);
    await Storage.addCoins(50);
    await Storage.recordActivity();
    await Storage.updateMonthlyChallenge('boss_wins', 1);
  }

  function getOptionState(
    option: string
  ): 'default' | 'correct' | 'wrong' | 'disabled' {
    if (!selectedAnswer) return 'default';
    if (option === bossQuestions[currentQ].correctAnswer) return 'correct';
    if (option === selectedAnswer) return 'wrong';
    return 'disabled';
  }

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={[styles.container, styles.bossBg]}>
        <View style={styles.introContent}>
          <Animated.Text style={styles.bossEmoji}>🐉</Animated.Text>
          <Text style={styles.introTitle}>BOSS BATTLE</Text>
          <Text style={styles.introSubtitle}>
            Level 1: Survival Emirati
          </Text>

          <View style={styles.introCard}>
            <Text style={styles.introDesc}>
              Defeat the boss by answering 15 AI-generated questions.
              Every battle is unique! You have 3 lives -- don't lose them all!
            </Text>
          </View>

          <View style={styles.introRules}>
            <View style={styles.ruleChip}>
              <Ionicons name="heart" size={14} color={Colors.xpGold} />
              <Text style={styles.ruleChipText}>3 lives</Text>
            </View>
            <View style={styles.ruleChip}>
              <Ionicons name="sparkles" size={14} color={Colors.xpGold} />
              <Text style={styles.ruleChipText}>AI questions</Text>
            </View>
            <View style={styles.ruleChip}>
              <Ionicons name="star" size={14} color={Colors.xpGold} />
              <Text style={styles.ruleChipText}>200 XP</Text>
            </View>
          </View>

          <GoldButton
            title="FIGHT!"
            icon="flash"
            variant="accent"
            onPress={startBattle}
            style={{ marginTop: Spacing.xxl }}
          />
        </View>
      </View>
    );
  }

  // ── LOADING ──
  if (phase === 'loading') {
    const spin = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={[styles.container, styles.bossBg]}>
        <View style={styles.introContent}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Text style={{ fontSize: 64 }}>🐉</Text>
          </Animated.View>
          <Text style={[styles.introTitle, { marginTop: Spacing.lg }]}>
            PREPARING BATTLE
          </Text>
          <Text style={styles.introSubtitle}>
            AI is forging unique questions...
          </Text>
          <ActivityIndicator
            size="large"
            color={Colors.xpGold}
            style={{ marginTop: Spacing.xl }}
          />
        </View>
      </View>
    );
  }

  // ── BATTLE ──
  if (phase === 'battle') {
    const question = bossQuestions[currentQ];
    const hpColor =
      bossHP > 50 ? Colors.error : bossHP > 25 ? Colors.warning : Colors.fire;

    return (
      <Animated.View
        style={[{ flex: 1 }, { transform: [{ translateX: shakeAnim }] }]}
      >
        <View style={[styles.container, styles.bossBg]}>
          {/* Boss Section */}
          <View style={styles.bossSection}>
            <View style={styles.bossTopRow}>
              {/* Boss Emoji + HP */}
              <View style={styles.bossInfoLeft}>
                <Animated.Text
                  style={[
                    styles.battleBossEmoji,
                    { transform: [{ scale: bossScaleAnim }] },
                  ]}
                >
                  🐉
                </Animated.Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.bossNameRow}>
                    <Text style={styles.bossName}>Desert Dragon</Text>
                    <Text style={styles.bossHPText}>
                      {Math.round(bossHP)}%
                    </Text>
                  </View>
                  <View style={styles.hpBarBg}>
                    <Animated.View
                      style={[
                        styles.hpBarFill,
                        {
                          width: `${bossHP}%`,
                          backgroundColor: hpColor,
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.hpFlash,
                        { opacity: hpFlashAnim },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* Player Hearts */}
              <View style={styles.playerLives}>
                {[...Array(3)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < lives ? 'heart' : 'heart-outline'}
                    size={24}
                    color={Colors.xpGold}
                  />
                ))}
              </View>
            </View>

            {/* Question counter */}
            <View style={styles.questionCounterRow}>
              <Text style={styles.questionNum}>
                {currentQ + 1} / {totalQ}
              </Text>
              {isAIGenerated && (
                <View style={styles.aiBadge}>
                  <Ionicons name="sparkles" size={10} color={Colors.xpGold} />
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              )}
            </View>
          </View>

          {/* Question + Options */}
          <View style={styles.questionArea}>
            <Text style={styles.questionText}>{question.question}</Text>

            {question.options?.map((option, i) => (
              <QuizOption
                key={i}
                text={option}
                state={getOptionState(option)}
                index={i}
                onPress={() => handleAnswer(option)}
              />
            ))}
          </View>

          {/* Score */}
          <View style={styles.scoreRow}>
            <Ionicons name="star" size={16} color={Colors.xpGold} />
            <Text style={styles.liveScore}>Score: {score}</Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ── VICTORY ──
  if (phase === 'victory') {
    return (
      <View style={[styles.container, styles.victoryBg]}>
        <View style={styles.resultContent}>
          <ConfettiOverlay
            visible={showConfetti}
            onDone={() => setShowConfetti(false)}
          />

          <Text style={styles.resultEmoji}>🏆</Text>
          <Text style={styles.resultTitle}>VICTORY!</Text>
          <Text style={styles.resultSubtitle}>Boss Defeated!</Text>

          <View style={styles.resultStatsRow}>
            <View style={styles.resultStatCard}>
              <Text style={styles.resultStatLabel}>Score</Text>
              <AnimatedCounter
                value={score}
                suffix={`/${totalQ}`}
                delay={200}
                style={styles.resultStatValue}
              />
            </View>
            <View style={styles.resultStatCard}>
              <Text style={styles.resultStatLabel}>Lives Left</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {[...Array(lives)].map((_, i) => (
                  <Ionicons key={i} name="heart" size={20} color={Colors.xpGold} />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.rewardsRow}>
            <View style={styles.rewardChip}>
              <Ionicons name="star" size={16} color={Colors.xpGold} />
              <AnimatedCounter
                value={200}
                prefix="+"
                suffix=" XP"
                delay={500}
                style={styles.rewardChipText}
              />
            </View>
            <View style={styles.rewardChip}>
              <Ionicons name="logo-bitcoin" size={16} color={Colors.coin} />
              <AnimatedCounter
                value={50}
                prefix="+"
                suffix=" Coins"
                delay={700}
                style={styles.rewardChipText}
              />
            </View>
          </View>

          <GoldButton
            title="Done"
            icon="checkmark"
            onPress={() => router.back()}
            style={{ marginTop: Spacing.xl }}
          />
        </View>
      </View>
    );
  }

  // ── DEFEAT ──
  return (
    <View style={[styles.container, styles.defeatBg]}>
      <View style={styles.resultContent}>
        <Text style={styles.resultEmoji}>💀</Text>
        <Text style={styles.resultTitle}>DEFEATED</Text>
        <Text style={styles.defeatSubtitle}>
          Review your missions and try again!
        </Text>
        <Text style={styles.defeatScore}>
          {score} / {totalQ} correct
        </Text>

        <View style={styles.encourageCard}>
          <Text style={styles.encourageText}>
            You got this! Practice the phrases you missed and come back stronger.
          </Text>
        </View>

        <GoldButton
          title="Try Again"
          icon="refresh"
          variant="accent"
          onPress={startBattle}
          style={{ marginTop: Spacing.xl }}
        />
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(0,0,0,0.06)',
  },
  bossBg: {
    backgroundColor: '#2D1A1A',
  },
  victoryBg: {
    backgroundColor: '#1A3D2D',
  },
  defeatBg: {
    backgroundColor: '#3A1515',
  },

  // ── Intro ──
  introContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  bossEmoji: {
    fontSize: 96,
    marginBottom: Spacing.md,
  },
  introTitle: {
    color: Colors.xpGold,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
    letterSpacing: 3,
  },
  introSubtitle: {
    color: Colors.textOnDark,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.regular,
    marginTop: Spacing.sm,
    opacity: 0.7,
  },
  introCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(200, 150, 62, 0.2)',
  },
  introDesc: {
    color: Colors.textOnDark,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  introRules: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  ruleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(200, 150, 62, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  ruleChipText: {
    color: Colors.textOnDark,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.semibold,
  },

  // ── Battle ──
  bossSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  bossTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  bossInfoLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  battleBossEmoji: {
    fontSize: 44,
  },
  bossNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bossName: {
    color: Colors.textOnDark,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
  bossHPText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  hpBarBg: {
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 7,
    overflow: 'hidden',
    position: 'relative',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  hpFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 7,
  },
  playerLives: {
    flexDirection: 'row',
    gap: 4,
  },
  questionCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  questionNum: {
    color: '#9CA3C4',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    opacity: 0.5,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(200, 150, 62, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  aiBadgeText: {
    color: Colors.xpGold,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },

  // ── Question ──
  questionArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  questionText: {
    color: Colors.textOnDark,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 36,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingBottom: Spacing.xl,
  },
  liveScore: {
    color: Colors.xpGold,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },

  // ── Results ──
  resultContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  resultEmoji: {
    fontSize: 96,
    marginBottom: Spacing.md,
  },
  resultTitle: {
    color: '#FFF',
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
    letterSpacing: 3,
  },
  resultSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.lg,
    marginTop: Spacing.sm,
  },
  resultStatsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  resultStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  resultStatLabel: {
    color: '#9CA3C4',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  resultStatValue: {
    color: '#FFF',
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  rewardChipText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },

  // ── Defeat ──
  defeatSubtitle: {
    color: '#9CA3C4',
    fontSize: FontSize.lg,
    fontFamily: FontFamily.regular,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  defeatScore: {
    color: '#9CA3C4',
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    marginTop: Spacing.sm,
  },
  encourageCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  encourageText: {
    color: Colors.textOnDark,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  backBtn: {
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  backBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
