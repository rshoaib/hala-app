/**
 * Arcade Mode — Desert Gold redesign
 * Falling words with gold-themed cards, combo system, heart lives
 */
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  FontFamily,
  BorderRadius,
  Shadows,
} from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Storage from '@/services/storageService';
import GoldButton from '@/components/GoldButton';
import AnimatedCounter from '@/components/AnimatedCounter';
import ConfettiOverlay from '@/components/ConfettiOverlay';

const { height, width } = Dimensions.get('window');
const FALL_DISTANCE = height * 0.5;
const ARCADE_HIGH_SCORE_KEY = '@hala_arcade_high_score';

const ARCADE_WORDS = [
  { arabic: 'مرحبا', eng: 'Hello / Welcome' },
  { arabic: 'شخبارك', eng: 'How are you?' },
  { arabic: 'مشكور', eng: 'Thank you' },
  { arabic: 'زين', eng: 'Good / Okay' },
  { arabic: 'وايد', eng: 'A lot / Very' },
  { arabic: 'سامحني', eng: 'Sorry' },
  { arabic: 'باجر', eng: 'Tomorrow' },
  { arabic: 'فلوس', eng: 'Money' },
  { arabic: 'ليش', eng: 'Why' },
  { arabic: 'أبا', eng: 'I want' },
  { arabic: 'السموحة', eng: 'Excuse me' },
  { arabic: 'ريوق', eng: 'Breakfast' },
  { arabic: 'غدا', eng: 'Lunch' },
  { arabic: 'عشا', eng: 'Dinner' },
  { arabic: 'سيارة', eng: 'Car' },
  { arabic: 'سيدة', eng: 'Straight ahead' },
];

export default function ArcadeScreen() {
  const router = useRouter();
  const dropAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const comboScale = useRef(new Animated.Value(1)).current;
  const wrongShake = useRef(new Animated.Value(0)).current;

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentWord, setCurrentWord] = useState<typeof ARCADE_WORDS[0] | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const isPlayingRef = useRef(false);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Load persisted high score on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(ARCADE_HIGH_SCORE_KEY);
        if (stored != null) {
          setHighScore(JSON.parse(stored));
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    return () => {
      dropAnim.stopAnimation();
    };
  }, []);

  // Combo pulse
  useEffect(() => {
    if (combo >= 2) {
      Animated.sequence([
        Animated.timing(comboScale, {
          toValue: 1.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(comboScale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [combo]);

  function startGame() {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setIsPlaying(true);
    setCombo(0);
    setBestCombo(0);
    setLastResult(null);
    setShowConfetti(false);
    isPlayingRef.current = true;
    livesRef.current = 3;
    scoreRef.current = 0;
    spawnWord(0);
  }

  function spawnWord(currentScore: number) {
    const targetIndex = Math.floor(Math.random() * ARCADE_WORDS.length);
    const target = ARCADE_WORDS[targetIndex];

    const wrongOptions = ARCADE_WORDS.filter((_, idx) => idx !== targetIndex)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((w) => w.eng);

    const shuffledOptions = [target.eng, ...wrongOptions].sort(
      () => 0.5 - Math.random()
    );

    setCurrentWord(target);
    setOptions(shuffledOptions);
    setLastResult(null);

    const duration = Math.max(1800, 4500 - currentScore * 40);

    dropAnim.setValue(0);
    Animated.timing(dropAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && isPlayingRef.current) {
        handleMiss();
      }
    });
  }

  function handleMiss() {
    setCombo(0);
    loseLife();
  }

  function handleTap(selectedOpt: string) {
    dropAnim.stopAnimation();

    if (currentWord && selectedOpt === currentWord.eng) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastResult('correct');
      setCombo((prevCombo) => {
        const newCombo = prevCombo + 1;
        setBestCombo((prev) => Math.max(prev, newCombo));
        const comboMultiplier = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1;
        const points = 10 * comboMultiplier;
        setScore((prevScore) => {
          const newScore = prevScore + points;
          scoreRef.current = newScore;
          setTimeout(() => spawnWord(newScore), 200);
          return newScore;
        });
        return newCombo;
      });

      // Green flash
      flashAnim.setValue(1);
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      setLastResult('wrong');
      setCombo(0);

      // Shake wrong options
      Animated.sequence([
        Animated.timing(wrongShake, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(wrongShake, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(wrongShake, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(wrongShake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      loseLife();
    }
  }

  async function loseLife() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    const currentLives = livesRef.current;
    const currentScore = scoreRef.current;

    if (currentLives <= 1) {
      livesRef.current = 0;
      setLives(0);
      setGameOver(true);
      setIsPlaying(false);
      if (currentScore > 0) {
        const xpEarned = Math.floor(currentScore / 2);
        await Storage.addXP(xpEarned);
        await Storage.recordActivity();
        if (currentScore >= 50) {
          await Storage.updateWeeklyChallenge('arcade_score', 1);
        }
      }
      // Read persisted high score to compare (another session may have set it)
      let persistedHigh = 0;
      try {
        const stored = await AsyncStorage.getItem(ARCADE_HIGH_SCORE_KEY);
        if (stored != null) persistedHigh = JSON.parse(stored);
      } catch {}
      if (currentScore > persistedHigh) {
        setHighScore(currentScore);
        setShowConfetti(true);
        try {
          await AsyncStorage.setItem(ARCADE_HIGH_SCORE_KEY, JSON.stringify(currentScore));
        } catch {}
      } else {
        setHighScore(persistedHigh);
      }
    } else {
      livesRef.current = currentLives - 1;
      setLives((l) => l - 1);
      setTimeout(() => spawnWord(currentScore), 300);
    }
  }

  const dropY = dropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FALL_DISTANCE],
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: 'Arcade Mode',
          headerStyle: { backgroundColor: Colors.text },
          headerTintColor: Colors.textOnDark,
          headerShadowVisible: false,
        }}
      />
      <View style={styles.container}>
        {/* Green flash overlay */}
        <Animated.View
          style={[styles.flashOverlay, { opacity: flashAnim }]}
          pointerEvents="none"
        />

        {/* Start / Game Over */}
        {!isPlaying && (
          <View style={styles.overlay}>
            <View style={styles.startCard}>
              <Text style={styles.titleEmoji}>
                {gameOver ? '💥' : '🏜️'}
              </Text>
              <Text style={styles.titleText}>
                {gameOver ? 'GAME OVER' : 'DESERT RUSH'}
              </Text>

              {gameOver ? (
                <>
                  <ConfettiOverlay
                    visible={showConfetti}
                    onDone={() => setShowConfetti(false)}
                  />

                  <View style={styles.gameOverStatsRow}>
                    <View style={styles.goStatCard}>
                      <Text style={styles.goStatLabel}>Score</Text>
                      <AnimatedCounter
                        value={score}
                        delay={200}
                        style={styles.goStatValue}
                      />
                    </View>
                    <View style={styles.goStatCard}>
                      <Text style={styles.goStatLabel}>Best Combo</Text>
                      <AnimatedCounter
                        value={bestCombo}
                        suffix="x"
                        delay={400}
                        style={styles.goStatValue}
                      />
                    </View>
                    <View style={styles.goStatCard}>
                      <Text style={styles.goStatLabel}>XP Earned</Text>
                      <AnimatedCounter
                        value={Math.floor(score / 2)}
                        prefix="+"
                        delay={600}
                        style={[styles.goStatValue, { color: Colors.xpGold }]}
                      />
                    </View>
                  </View>

                  {showConfetti && (
                    <View style={styles.highScoreBadge}>
                      <Ionicons name="trophy" size={16} color={Colors.xpGold} />
                      <Text style={styles.highScoreText}>NEW HIGH SCORE!</Text>
                    </View>
                  )}

                  <GoldButton
                    title="Play Again"
                    icon="refresh"
                    onPress={startGame}
                    style={{ marginTop: Spacing.lg }}
                  />
                  <TouchableOpacity
                    style={styles.quitBtn}
                    onPress={() => router.back()}
                  >
                    <Text style={styles.quitBtnText}>Quit</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.instructions}>
                    Tap the correct English meaning before the Arabic word hits
                    the floor!
                  </Text>
                  <View style={styles.rulesRow}>
                    <View style={styles.ruleChip}>
                      <Ionicons name="heart" size={14} color={Colors.xpGold} />
                      <Text style={styles.ruleChipText}>3 Lives</Text>
                    </View>
                    <View style={styles.ruleChip}>
                      <Ionicons name="flame" size={14} color={Colors.fire} />
                      <Text style={styles.ruleChipText}>Combo Bonus</Text>
                    </View>
                    <View style={styles.ruleChip}>
                      <Ionicons name="flash" size={14} color={Colors.accent} />
                      <Text style={styles.ruleChipText}>Gets Faster</Text>
                    </View>
                  </View>
                  <GoldButton
                    title="START GAME"
                    icon="play"
                    onPress={startGame}
                    style={{ marginTop: Spacing.xl }}
                  />
                </>
              )}
            </View>
          </View>
        )}

        {/* Gameplay HUD */}
        {isPlaying && (
          <>
            <View style={styles.hudRow}>
              {/* Lives as gold hearts */}
              <View style={styles.livesRow}>
                {[...Array(3)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < lives ? 'heart' : 'heart-outline'}
                    size={28}
                    color={Colors.xpGold}
                  />
                ))}
              </View>

              {/* Combo multiplier */}
              {combo >= 2 && (
                <Animated.View
                  style={[
                    styles.comboBadge,
                    { transform: [{ scale: comboScale }] },
                  ]}
                >
                  <Text style={styles.comboText}>{combo}x COMBO!</Text>
                </Animated.View>
              )}

              <Text style={styles.scoreDisplay}>{score}</Text>
            </View>

            {/* Falling Word */}
            <View style={styles.playArea}>
              {currentWord && (
                <Animated.View
                  style={[
                    styles.fallingWordCard,
                    { transform: [{ translateY: dropY }] },
                  ]}
                >
                  <View style={styles.fallingWordInner}>
                    <Text style={styles.fallingWordText}>
                      {currentWord.arabic}
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Danger zone */}
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(231, 76, 60, 0.1)',
                  'rgba(231, 76, 60, 0.25)',
                ]}
                style={styles.dangerZone}
              />
            </View>

            {/* Answer Options */}
            <Animated.View
              style={[
                styles.optionsWrap,
                lastResult === 'wrong'
                  ? { transform: [{ translateX: wrongShake }] }
                  : undefined,
              ]}
            >
              <View style={styles.optionsGrid}>
                {options.map((opt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.optionBtn,
                      lastResult === 'correct' &&
                        currentWord?.eng === opt &&
                        styles.optionCorrect,
                      lastResult === 'wrong' &&
                        currentWord?.eng !== opt &&
                        styles.optionWrongFaded,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleTap(opt)}
                  >
                    <Text style={styles.optionBtnText} numberOfLines={2}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.text,
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(0,0,0,0.06)',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    zIndex: 100,
  },

  // ── Overlay ──
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    zIndex: 10,
  },
  startCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
  },
  titleEmoji: {
    fontSize: 72,
    marginBottom: Spacing.sm,
  },
  titleText: {
    color: Colors.xpGold,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
    marginBottom: Spacing.md,
    letterSpacing: 3,
  },
  instructions: {
    color: Colors.textOnDark,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    lineHeight: 22,
    opacity: 0.8,
  },
  rulesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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

  // ── Game Over ──
  gameOverStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  goStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  goStatLabel: {
    color: '#9CA3C4',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  goStatValue: {
    color: '#FFF',
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
  },
  highScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.xpGold,
    marginBottom: Spacing.md,
  },
  highScoreText: {
    color: Colors.xpGold,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
    letterSpacing: 1,
  },
  quitBtn: {
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  quitBtnText: {
    color: Colors.textOnDark,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    opacity: 0.7,
  },

  // ── HUD ──
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  livesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  comboBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.xpGold,
    ...Shadows.glow,
  },
  comboText: {
    color: Colors.xpGold,
    fontSize: FontSize.md,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
    letterSpacing: 1,
  },
  scoreDisplay: {
    color: Colors.xpGold,
    fontSize: 36,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
  },

  // ── Play Area ──
  playArea: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
  },
  fallingWordCard: {
    position: 'absolute',
    top: 0,
    zIndex: 2,
    borderRadius: BorderRadius.lg,
    ...Shadows.cardLifted,
  },
  fallingWordInner: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.xpGold,
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(0,0,0,0.06)',
  },
  fallingWordText: {
    color: '#FFF',
    fontSize: 44,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
  },
  dangerZone: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 50,
  },

  // ── Options ──
  optionsWrap: {
    padding: Spacing.md,
    paddingBottom: 36,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionBtn: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    minHeight: 64,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  optionCorrect: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderColor: Colors.success,
  },
  optionWrongFaded: {
    opacity: 0.4,
  },
  optionBtnText: {
    color: Colors.textOnDark,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
});
