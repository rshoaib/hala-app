/**
 * Onboarding Flow — First-launch experience
 * 3 screens: Welcome, Features, Daily Goal selector
 */
import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Colors, FontSize, FontWeight, FontFamily, Spacing,
  BorderRadius, Shadows, ClayStyle,
} from '@/constants/theme';
import GoldButton from '@/components/GoldButton';
import * as Storage from '@/services/storageService';

const { width, height } = Dimensions.get('window');

const PAGES = [
  {
    emoji: '🇦🇪',
    title: 'Learn Emirati Arabic',
    subtitle: 'Master the everyday language of the UAE with fun, bite-sized lessons.',
    color: Colors.primary,
  },
  {
    emoji: '🎮',
    title: 'Play & Learn',
    subtitle: 'Missions, quizzes, arcade games, and AI tutoring — learning has never been this fun.',
    color: Colors.secondary,
  },
  {
    emoji: '🎯',
    title: 'Set Your Goal',
    subtitle: 'How much do you want to learn each day?',
    color: Colors.accent,
    isGoalPage: true,
  },
];

const GOAL_OPTIONS = [
  { xp: 30, label: 'Casual', emoji: '☕', desc: '5 min/day' },
  { xp: 50, label: 'Regular', emoji: '📚', desc: '10 min/day' },
  { xp: 100, label: 'Serious', emoji: '🔥', desc: '20 min/day' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(50);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goToPage = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentPage(index);
  };

  const handleComplete = async () => {
    await Storage.setDailyGoal(selectedGoal);
    await Storage.setOnboarded();
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (currentPage < PAGES.length - 1) {
      goToPage(currentPage + 1);
    } else {
      handleComplete();
    }
  };

  const handleScroll = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {PAGES.map((page, index) => (
          <View key={index} style={[styles.page, { width }]}>
            <View
              style={[
                styles.emojiCircle,
                ClayStyle.cardSolid(page.color),
              ]}
            >
              <Text style={styles.emoji}>{page.emoji}</Text>
            </View>

            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.subtitle}>{page.subtitle}</Text>

            {/* Goal selector on last page */}
            {page.isGoalPage && (
              <View style={styles.goalOptions}>
                {GOAL_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.xp}
                    style={[
                      styles.goalOption,
                      selectedGoal === option.xp && styles.goalOptionSelected,
                    ]}
                    onPress={() => setSelectedGoal(option.xp)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.goalEmoji}>{option.emoji}</Text>
                    <View style={styles.goalTextWrap}>
                      <Text style={[
                        styles.goalLabel,
                        selectedGoal === option.xp && styles.goalLabelSelected,
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={styles.goalDesc}>{option.desc}</Text>
                    </View>
                    <Text style={[
                      styles.goalXP,
                      selectedGoal === option.xp && styles.goalXPSelected,
                    ]}>
                      {option.xp} XP
                    </Text>
                    {selectedGoal === option.xp && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Floating Arabic letters decoration */}
            {index === 0 && (
              <View style={styles.floatingLetters}>
                {['أ', 'ب', 'ت', 'ث', 'ج'].map((letter, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.floatingLetter,
                      {
                        left: (i * width) / 5 + 20,
                        top: 50 + (i % 3) * 40,
                        opacity: 0.1,
                        fontSize: 20 + (i % 3) * 8,
                      },
                    ]}
                  >
                    {letter}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Bottom section: dots + button */}
      <View style={styles.bottom}>
        {/* Page dots */}
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentPage && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Action button */}
        <View style={styles.buttonWrap}>
          <GoldButton
            title={currentPage === PAGES.length - 1 ? "Let's Go! 🎉" : 'Next'}
            onPress={handleNext}
            icon={currentPage < PAGES.length - 1 ? 'arrow-forward' : undefined}
          />
        </View>

        {/* Skip button (not on last page) */}
        {currentPage < PAGES.length - 1 && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleComplete}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 180,
  },
  emojiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.glow,
  } as any,
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  goalOptions: {
    width: '100%',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    ...ClayStyle.card,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.clay,
  },
  goalOptionSelected: {
    borderColor: Colors.primary,
    borderTopColor: Colors.primaryLight,
    borderBottomColor: Colors.primaryDark,
    backgroundColor: Colors.primarySoft,
    ...Shadows.glow,
  },
  goalEmoji: { fontSize: 28 },
  goalTextWrap: { flex: 1 },
  goalLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  goalLabelSelected: {
    color: Colors.primary,
  },
  goalDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  goalXP: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  goalXPSelected: {
    color: Colors.primary,
  },
  floatingLetters: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  floatingLetter: {
    position: 'absolute',
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    backgroundColor: Colors.background,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surface,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  buttonWrap: {
    marginBottom: Spacing.md,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    fontFamily: FontFamily.medium,
    color: Colors.textMuted,
  },
});
