/**
 * Play Tab — The fun zone
 * Game grid, daily challenge, arcade, boss battle, AI quiz/tutor
 */
import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Colors, Gradients, FontSize, FontWeight, FontFamily, Spacing,
  BorderRadius, Shadows, ClayStyle,
} from '@/constants/theme';
import GameCard from '@/components/GameCard';
import SectionHeader from '@/components/SectionHeader';
import * as Storage from '@/services/storageService';
import { missions } from '@/data/missions';

// Quick word quiz pool
const QUICK_QUIZ = [
  { arabic: 'وايد', options: ['A lot', 'Never', 'Small', 'Fast'], correct: 'A lot' },
  { arabic: 'زين', options: ['Bad', 'Good', 'Big', 'Cold'], correct: 'Good' },
  { arabic: 'فلوس', options: ['Food', 'Money', 'Water', 'House'], correct: 'Money' },
  { arabic: 'باجر', options: ['Yesterday', 'Today', 'Tomorrow', 'Never'], correct: 'Tomorrow' },
  { arabic: 'ليش', options: ['Where', 'Why', 'When', 'How'], correct: 'Why' },
];

export default function PlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [challengeDone, setChallengeDone] = useState(false);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const lastQuizDate = useRef<string | null>(null);

  const quizIndex = new Date().getDate() % QUICK_QUIZ.length;
  const quiz = QUICK_QUIZ[quizIndex];
  const bossUnlocked = completedMissions.length >= missions.length;

  useFocusEffect(
    useCallback(() => {
      const today = new Date().toISOString().split('T')[0];
      if (lastQuizDate.current !== null && lastQuizDate.current !== today) {
        setQuizAnswer(null);
      }
      lastQuizDate.current = today;

      (async () => {
        const [dc, cm] = await Promise.all([
          Storage.getDailyChallengeRecord(),
          Storage.getCompletedMissions(),
        ]);
        setChallengeDone(dc.lastCompletedDate === today);
        setCompletedMissions(cm);
      })();
    }, [])
  );

  const handleQuizAnswer = async (answer: string) => {
    setQuizAnswer(answer);
    if (answer === quiz.correct) {
      await Storage.addXP(5);
      await Storage.recordActivity();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Featured Banner ── */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/challenge')}
      >
        <View
          style={[
            styles.featuredBanner,
            { backgroundColor: challengeDone ? Colors.secondary : Colors.accent },
          ]}
        >
          <Text style={styles.featuredEmoji}>
            {challengeDone ? '✅' : '⚡'}
          </Text>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>
              {challengeDone ? 'Challenge Complete!' : "Today's Challenge"}
            </Text>
            <Text style={styles.featuredSubtitle}>
              {challengeDone
                ? 'Great job! Come back tomorrow.'
                : '60 seconds. Quick thinking. Big rewards!'}
            </Text>
          </View>
          {!challengeDone && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>PLAY</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.body}>
        {/* ── Game Grid ── */}
        <SectionHeader title="Games & Practice" subtitle="Pick your challenge" />
        <View style={styles.gameGrid}>
          <View style={styles.gameRow}>
            <GameCard
              title="Flashcards"
              emoji="🃏"
              tagline="Swipe to learn"
              gradient={Gradients.purple}
              onPress={() => router.push('/flashcard')}
              badge="Review"
            />
            <GameCard
              title="Daily Challenge"
              emoji="⚡"
              tagline="60-second quiz"
              gradient={challengeDone ? Gradients.emerald : Gradients.sunset}
              onPress={() => router.push('/challenge')}
              statusBadge={challengeDone ? 'DONE' : undefined}
              statusColor={Colors.success}
              badge="+50 XP"
            />
          </View>
          <View style={styles.gameRow}>
            <GameCard
              title="Arcade Mode"
              emoji="🕹️"
              tagline="Catch falling words"
              gradient={Gradients.arcade}
              onPress={() => router.push('/arcade')}
              badge="High Score"
            />
            <GameCard
              title="Boss Battle"
              emoji="⚔️"
              tagline="Ultimate test"
              gradient={Gradients.boss}
              onPress={() => router.push('/boss-battle')}
              locked={!bossUnlocked}
              badge="+100 XP"
            />
          </View>
          <View style={styles.gameRow}>
            <GameCard
              title="AI Quiz"
              emoji="🤖"
              tagline="Adaptive questions"
              gradient={Gradients.gold}
              onPress={() => router.push('/ai-quiz')}
              badge="Unique"
            />
            <GameCard
              title="AI Tutor"
              emoji="💬"
              tagline="Chat & practice"
              gradient={Gradients.emerald}
              onPress={() => router.push('/ai-tutor')}
              badge="Free"
            />
          </View>
        </View>

        {/* ── Quick Word Quiz ── */}
        <SectionHeader title="Quick Quiz" subtitle="What does this mean?" />
        <View style={styles.quickQuiz}>
          <Text style={styles.quizArabic}>{quiz.arabic}</Text>
          <View style={styles.quizOptions}>
            {quiz.options.map((option) => {
              const isSelected = quizAnswer === option;
              const isCorrect = option === quiz.correct;
              const showResult = quizAnswer !== null;

              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.quizOption,
                    showResult && isCorrect && styles.quizOptionCorrect,
                    showResult && isSelected && !isCorrect && styles.quizOptionWrong,
                  ]}
                  onPress={() => !quizAnswer && handleQuizAnswer(option)}
                  activeOpacity={quizAnswer ? 1 : 0.7}
                  disabled={quizAnswer !== null}
                >
                  <Text
                    style={[
                      styles.quizOptionText,
                      showResult && isCorrect && { color: Colors.success },
                      showResult && isSelected && !isCorrect && { color: Colors.error },
                    ]}
                  >
                    {option}
                  </Text>
                  {showResult && isCorrect && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {quizAnswer && (
            <Text style={styles.quizResult}>
              {quizAnswer === quiz.correct ? '🎉 Correct! +5 XP' : `❌ It means "${quiz.correct}"`}
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  body: { paddingHorizontal: Spacing.md },

  featuredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    ...Shadows.cardLifted,
  },
  featuredEmoji: { fontSize: 40 },
  featuredContent: { flex: 1 },
  featuredTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, fontFamily: FontFamily.bold, color: '#FFF' },
  featuredSubtitle: { fontSize: FontSize.sm, fontFamily: FontFamily.regular, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  featuredBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  featuredBadgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, fontFamily: FontFamily.bold, color: '#FFF', letterSpacing: 1 },

  gameGrid: { gap: Spacing.md, marginBottom: Spacing.lg },
  gameRow: { flexDirection: 'row', gap: Spacing.md },

  quickQuiz: {
    ...ClayStyle.card,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.card,
  },
  quizArabic: {
    fontSize: FontSize.arabicLarge,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  quizOptions: {
    width: '100%',
    gap: Spacing.sm,
  },
  quizOption: {
    ...ClayStyle.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  quizOptionCorrect: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  quizOptionWrong: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  quizOptionText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.semibold,
    color: Colors.text,
  },
  quizResult: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
    marginTop: Spacing.md,
  },
});
