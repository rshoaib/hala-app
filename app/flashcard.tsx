/**
 * Flashcard Screen — Spaced repetition with 3D flip + swipe-to-rate
 * Desert Gold redesign with confidence tracking
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
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
import { missions } from '@/data/missions';
import { speakArabic, stopSpeaking } from '@/services/speechService';
import * as Storage from '@/services/storageService';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

const allPhrases = missions.flatMap((m) => m.phrases);

export default function FlashcardScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [known, setKnown] = useState(0);
  const [learning, setLearning] = useState(0);

  const flipProgress = useSharedValue(0);
  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      setCurrentIndex(0);
      setReviewed(0);
      setKnown(0);
      setLearning(0);
      setIsFlipped(false);
      flipProgress.value = 0;
      translateX.value = 0;
      cardOpacity.value = 1;
      return () => {
        stopSpeaking();
      };
    }, [])
  );

  if (allPhrases.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📚</Text>
        <Text style={{ color: Colors.text, fontSize: 18, fontWeight: '700' }}>No phrases yet</Text>
        <Text style={{ color: Colors.textSecondary, marginTop: 8 }}>Complete a mission first!</Text>
      </View>
    );
  }

  const deckComplete = reviewed >= allPhrases.length;
  const currentPhrase = allPhrases[currentIndex % allPhrases.length];

  function flipCard() {
    setIsFlipped(!isFlipped);
    flipProgress.value = withTiming(isFlipped ? 0 : 1, { duration: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleRate(rating: 'known' | 'learning') {
    stopSpeaking();
    if (rating === 'known') {
      setKnown((prev) => prev + 1);
      Storage.updatePhraseConfidence(currentPhrase.arabic, true);
    } else {
      setLearning((prev) => prev + 1);
      Storage.updatePhraseConfidence(currentPhrase.arabic, false);
    }
    setReviewed((prev) => prev + 1);
    setIsFlipped(false);
    flipProgress.value = withTiming(0, { duration: 200 });
    setCurrentIndex((prev) => (prev + 1) % allPhrases.length);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right = I know this
        translateX.value = withTiming(width, { duration: 200 });
        cardOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(handleRate)('known');
          translateX.value = 0;
          cardOpacity.value = 1;
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left = Still learning
        translateX.value = withTiming(-width, { duration: 200 });
        cardOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(handleRate)('learning');
          translateX.value = 0;
          cardOpacity.value = 1;
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardSwipeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-width, 0, width],
          [-15, 0, 15]
        )}deg`,
      },
    ],
    opacity: cardOpacity.value,
  }));

  const knownOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const learningOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, 180])}deg` },
    ],
    backfaceVisibility: 'hidden' as const,
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(flipProgress.value, [0, 1], [180, 360])}deg` },
    ],
    backfaceVisibility: 'hidden' as const,
  }));

  if (deckComplete) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl }}>
          <Text style={{ fontSize: 64, marginBottom: Spacing.md }}>🎉</Text>
          <Text style={{ fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm }}>
            Deck Complete!
          </Text>
          <Text style={{ fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl }}>
            You reviewed all {allPhrases.length} cards. {known} known, {learning} still learning.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg }}
            onPress={() => {
              setCurrentIndex(0);
              setReviewed(0);
              setKnown(0);
              setLearning(0);
              setIsFlipped(false);
              flipProgress.value = 0;
              translateX.value = 0;
              cardOpacity.value = 1;
            }}
          >
            <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFF' }}>Review Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Session Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Ionicons name="layers-outline" size={14} color={Colors.primary} />
          <Text style={styles.statText}>{reviewed} reviewed</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: Colors.successLight }]}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={[styles.statText, { color: Colors.success }]}>
            {known} known
          </Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: Colors.errorLight }]}>
          <Ionicons name="refresh" size={14} color={Colors.error} />
          <Text style={[styles.statText, { color: Colors.error }]}>
            {learning} learning
          </Text>
        </View>
      </View>

      {/* Card Counter */}
      <Text style={styles.counter}>
        {currentIndex + 1} / {allPhrases.length}
      </Text>

      {/* Flashcard with swipe */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardWrapper, cardSwipeStyle]}>
          {/* Swipe overlays */}
          <Animated.View style={[styles.swipeOverlay, styles.knownOverlay, knownOverlayStyle]}>
            <Text style={styles.swipeLabel}>I KNOW THIS</Text>
          </Animated.View>
          <Animated.View style={[styles.swipeOverlay, styles.learningOverlay, learningOverlayStyle]}>
            <Text style={[styles.swipeLabel, { color: Colors.error }]}>
              STILL LEARNING
            </Text>
          </Animated.View>

          <TouchableOpacity
            activeOpacity={0.95}
            onPress={flipCard}
            style={styles.cardTouchable}
          >
            {/* Front -- Arabic */}
            <Animated.View
              style={[styles.card, styles.cardFront, frontAnimatedStyle]}
            >
              <Text style={styles.cardLabel}>TAP TO FLIP</Text>

              <Text style={styles.cardArabic}>{currentPhrase.arabic}</Text>
              <Text style={styles.cardTranslit}>
                {currentPhrase.transliteration}
              </Text>

              <View style={styles.tapHint}>
                <Ionicons
                  name="swap-horizontal"
                  size={16}
                  color={Colors.textMuted}
                />
                <Text style={styles.tapHintText}>Tap to see answer</Text>
              </View>
            </Animated.View>

            {/* Back -- English */}
            <Animated.View
              style={[styles.card, styles.cardBack, backAnimatedStyle]}
            >
              <Text style={styles.cardLabel}>ANSWER</Text>

              <Text style={styles.cardEnglish}>{currentPhrase.english}</Text>
              <View style={styles.cardDivider} />
              <Text style={styles.cardArabicSmall}>
                {currentPhrase.arabic}
              </Text>
              <Text style={styles.cardTranslitSmall}>
                {currentPhrase.transliteration}
              </Text>
            </Animated.View>
          </TouchableOpacity>
          {/* Speaker button outside flip touchable */}
          <View style={styles.speakerBtnWrap}>
            <TouchableOpacity
              style={styles.speakerBtn}
              onPress={() => speakArabic(currentPhrase.arabic)}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-high" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Swipe hints */}
      <View style={styles.swipeHintRow}>
        <View style={styles.swipeHintItem}>
          <Ionicons name="arrow-back" size={16} color={Colors.error} />
          <Text style={[styles.swipeHintText, { color: Colors.error }]}>
            Still Learning
          </Text>
        </View>
        <View style={styles.swipeHintItem}>
          <Text style={[styles.swipeHintText, { color: Colors.success }]}>
            I Know This
          </Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.success} />
        </View>
      </View>

      {/* Rate Buttons */}
      <View style={styles.rateRow}>
        <TouchableOpacity
          style={[styles.rateButton, styles.rateLearning]}
          onPress={() => handleRate('learning')}
        >
          <Ionicons name="close" size={24} color={Colors.error} />
          <Text style={[styles.rateText, { color: Colors.error }]}>
            Still Learning
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rateButton, styles.rateKnown]}
          onPress={() => handleRate('known')}
        >
          <Ionicons name="checkmark" size={24} color={Colors.success} />
          <Text style={[styles.rateText, { color: Colors.success }]}>
            I Know This
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  statText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  counter: {
    color: '#9CA3C4',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  // ── Card ──
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTouchable: {
    width: width - Spacing.md * 4,
    height: height * 0.42,
  },
  card: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    position: 'absolute',
    ...Shadows.cardLifted,
    ...ClayStyle.card,
    borderRadius: BorderRadius.xxl,
  },
  cardFront: {
  },
  cardBack: {
  },
  cardLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.semibold,
    letterSpacing: 2,
    position: 'absolute',
    top: Spacing.lg,
  },
  speakerBtnWrap: {
    position: 'absolute',
    top: Spacing.lg + 44,
    right: Spacing.lg,
    zIndex: 20,
  },
  speakerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardArabic: {
    color: Colors.text,
    fontSize: FontSize.arabicHero,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  cardTranslit: {
    color: Colors.primaryLight,
    fontSize: FontSize.xl,
    fontStyle: 'italic',
    marginTop: Spacing.md,
  },
  tapHint: {
    position: 'absolute',
    bottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tapHintText: {
    color: '#9CA3C4',
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
  },
  cardEnglish: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  cardDivider: {
    width: 60,
    height: 2,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
    borderRadius: 1,
  },
  cardArabicSmall: {
    color: Colors.textSecondary,
    fontSize: FontSize.arabicLarge,
  },
  cardTranslitSmall: {
    color: '#9CA3C4',
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // ── Swipe Overlays ──
  swipeOverlay: {
    position: 'absolute',
    top: 20,
    zIndex: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  knownOverlay: {
    right: 20,
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  learningOverlay: {
    left: 20,
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  swipeLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
    letterSpacing: 1,
    color: Colors.success,
  },

  // ── Swipe Hints ──
  swipeHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  swipeHintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  swipeHintText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // ── Rate Buttons ──
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  rateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  rateLearning: {
    borderColor: Colors.error + '40',
    backgroundColor: Colors.errorLight,
  },
  rateKnown: {
    borderColor: Colors.success + '40',
    backgroundColor: Colors.successLight,
  },
  rateText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
});
