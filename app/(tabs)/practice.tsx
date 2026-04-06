/**
 * Practice Tab — Flashcards, Daily Challenge, Vocabulary, Voice
 * Research-based: spaced repetition + variety + daily hooks = retention
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import * as Storage from '@/services/storageService';
import { speakArabic } from '@/services/speechService';

const { width } = Dimensions.get('window');

// Word of the Day pool — rotate daily
const DAILY_WORDS = [
  { arabic: 'وايد', translit: 'wāyid', meaning: 'Very / A lot', example: '"هالأكل لذيذ وايد" — This food is very delicious' },
  { arabic: 'يلا', translit: 'yalla', meaning: 'Let\'s go / Come on', example: '"يلا نروح" — Let\'s go' },
  { arabic: 'زين', translit: 'zēn', meaning: 'Good / Okay', example: '"زين الحمد لله" — Good, thank God' },
  { arabic: 'شخبارك', translit: 'shakhbārak', meaning: 'How are you?', example: '"هلا، شخبارك؟" — Hi, how are you?' },
  { arabic: 'مشكور', translit: 'mashkūr', meaning: 'Thank you (Emirati)', example: '"مشكور يا أخوي" — Thank you brother' },
  { arabic: 'إن شاء الله', translit: 'in shāʾ allāh', meaning: 'God willing', example: '"باجر إن شاء الله" — Tomorrow, God willing' },
  { arabic: 'ما شاء الله', translit: 'mā shāʾ allāh', meaning: 'God has willed it', example: '"ما شاء الله عليك" — Well done (praise)' },
];

export default function PracticeScreen() {
  const router = useRouter();
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(false);
  const [totalPhrases, setTotalPhrases] = useState(0);

  // Rotate word of the day based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const todayWord = DAILY_WORDS[dayOfYear % DAILY_WORDS.length];

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const today = new Date().toISOString().split('T')[0];
    const record = await Storage.getDailyChallengeRecord();
    setDailyChallengeCompleted(record.lastCompletedDate === today);

    const completed = await Storage.getCompletedMissions();
    setTotalPhrases(completed.length * 10);
  }

  const practiceModules = [
    {
      id: 'flashcards',
      title: 'Flashcards',
      titleAr: 'بطاقات',
      description: 'Spaced repetition for maximum retention',
      emoji: '🃏',
      gradient: ['#7C3AED', '#5B21B6'] as const,
      icon: 'albums' as const,
      onPress: () => router.push('/flashcard'),
    },
    {
      id: 'daily-challenge',
      title: dailyChallengeCompleted ? 'Challenge Done ✓' : 'Daily Challenge',
      titleAr: 'التحدي اليومي',
      description: dailyChallengeCompleted
        ? 'Great job! Come back tomorrow'
        : '60 seconds to test your skills',
      emoji: '⚡',
      gradient: dailyChallengeCompleted
        ? (['#059669', '#047857'] as const)
        : (['#EF4444', '#DC2626'] as const),
      icon: 'timer' as const,
      onPress: () => !dailyChallengeCompleted && router.push('/challenge'),
      disabled: dailyChallengeCompleted,
    },
    {
      id: 'arcade',
      title: 'Arcade Mode',
      titleAr: 'أركيد',
      description: 'Catch the falling words before time runs out!',
      emoji: '🕹️',
      gradient: ['#ec4899', '#be185d'] as const,
      icon: 'game-controller' as const,
      onPress: () => router.push('/arcade'),
    },
  ];

  // ★ Fixed: search terms now match actual phrase content in missions
  const quickPractice = [
    { id: 'greetings', title: 'Greetings', emoji: '👋', count: 10, search: 'hello greeting peace هلا' },
    { id: 'directions', title: 'Directions', emoji: '🧭', count: 7, search: 'taxi go straight turn stop' },
    { id: 'food', title: 'Food & Drink', emoji: '🍽️', count: 10, search: 'order menu food tea water delicious' },
    { id: 'shopping', title: 'Shopping', emoji: '🛍️', count: 10, search: 'price money discount want shop' },
    { id: 'expressions', title: 'Expressions', emoji: '💬', count: 8, search: 'sorry thank god willing wait' },
    { id: 'phone', title: 'Phone', emoji: '📞', count: 10, search: 'phone call book appointment when' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Word of the Day — with Audio */}
      <View style={styles.wordOfDay}>
        <LinearGradient
          colors={[Colors.card, Colors.cardElevated]}
          style={styles.wordOfDayGradient}
        >
          <View style={styles.wordOfDayHeader}>
            <Text style={styles.wordOfDayLabel}>📌 Word of the Day</Text>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speakArabic(todayWord.arabic)}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-high" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.wordOfDayArabic}>{todayWord.arabic}</Text>
          <Text style={styles.wordOfDayTranslit}>{todayWord.translit}</Text>
          <Text style={styles.wordOfDayMeaning}>{todayWord.meaning}</Text>
          <Text style={styles.wordOfDayExample}>{todayWord.example}</Text>
        </LinearGradient>
      </View>

      {/* Practice Modules */}
      <Text style={styles.sectionTitle}>Practice Modes</Text>
      {practiceModules.map((module) => (
        <TouchableOpacity
          key={module.id}
          style={[styles.moduleCard, module.disabled && styles.moduleDisabled]}
          activeOpacity={module.disabled ? 1 : 0.8}
          onPress={module.onPress}
        >
          <LinearGradient
            colors={[...module.gradient]}
            style={styles.moduleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.moduleContent}>
              <Text style={styles.moduleEmoji}>{module.emoji}</Text>
              <View style={styles.moduleText}>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleDescription}>{module.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}

      {/* Quick Practice — Category Grid */}
      <Text style={styles.sectionTitle}>Quick Practice</Text>
      <Text style={styles.sectionSubtitle}>Tap a category to review vocabulary</Text>
      <View style={styles.categoryGrid}>
        {quickPractice.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryCard}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/vocabulary', params: { q: cat.search } })}
          >
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={styles.categoryTitle}>{cat.title}</Text>
            <Text style={styles.categoryCount}>{cat.count} words</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📊 Your Vocabulary</Text>
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{totalPhrases}</Text>
            <Text style={styles.statsLabel}>Words Learned</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{Math.floor(totalPhrases * 0.7)}</Text>
            <Text style={styles.statsLabel}>Mastered</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{Math.ceil(totalPhrases * 0.3)}</Text>
            <Text style={styles.statsLabel}>Reviewing</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },
  wordOfDay: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    ...Shadows.card,
  },
  wordOfDayGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  wordOfDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    width: '100%',
  },
  wordOfDayLabel: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  speakButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
  },
  wordOfDayArabic: {
    color: Colors.text,
    fontSize: FontSize.arabicHero,
    fontWeight: '700',
  },
  wordOfDayTranslit: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
    marginTop: 4,
    fontStyle: 'italic',
  },
  wordOfDayMeaning: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  wordOfDayExample: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
    marginTop: -4,
  },
  moduleCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  moduleDisabled: {
    opacity: 0.7,
  },
  moduleGradient: {
    padding: Spacing.lg,
  },
  moduleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleEmoji: {
    fontSize: 36,
    marginRight: Spacing.md,
  },
  moduleText: {
    flex: 1,
  },
  moduleTitle: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  moduleDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryCard: {
    width: (width - Spacing.md * 2 - Spacing.sm * 2) / 3,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  categoryTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  statsTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsItem: {
    alignItems: 'center',
  },
  statsNumber: {
    color: Colors.primary,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  statsLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  statsDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
});
