/**
 * Alphabet Screen — Desert Gold redesign
 * 7-column grid, inline expanded detail view, gold checkmarks
 */
import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import {
  Colors,
  Gradients,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadows,
} from '@/constants/theme';
import { alphabet, type ArabicLetter } from '@/data/alphabet';
import * as Storage from '@/services/storageService';
import { speakArabic } from '@/services/speechService';
import GoldButton from '@/components/GoldButton';

const { width } = Dimensions.get('window');
const GRID_COLUMNS = 7;
const GRID_GAP = 6;
const CARD_SIZE =
  (width - Spacing.md * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

export default function AlphabetScreen() {
  const [learnedLetters, setLearnedLetters] = useState<number[]>([]);
  const [expandedLetter, setExpandedLetter] = useState<ArabicLetter | null>(
    null
  );
  const expandAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [])
  );

  async function loadProgress() {
    const progress = await Storage.getAlphabetProgress();
    setLearnedLetters(progress);
  }

  async function markLearned(letterId: number) {
    await Storage.markLetterLearned(letterId);
    await Storage.addXP(5);
    await Storage.recordActivity();
    const newLearned = learnedLetters.includes(letterId) ? learnedLetters : [...learnedLetters, letterId];
    setLearnedLetters(newLearned);
    await Storage.setMonthlyChallengeProgress('all_letters', newLearned.length);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function selectLetter(letter: ArabicLetter) {
    setExpandedLetter(letter);
    expandAnim.setValue(0);
    Animated.spring(expandAnim, {
      toValue: 1,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function closeLetter() {
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setExpandedLetter(null));
  }

  const progress = alphabet.length > 0 ? learnedLetters.length / alphabet.length : 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Progress Bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>
              {learnedLetters.length}/{alphabet.length} Letters
            </Text>
            <Text style={styles.progressPercent}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={Gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressBarFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Letter Grid - 7 columns */}
        <View style={styles.letterGrid}>
          {alphabet.map((letter) => {
            const isLearned = learnedLetters.includes(letter.id);
            const isExpanded = expandedLetter?.id === letter.id;

            return (
              <TouchableOpacity
                key={letter.id}
                style={[
                  styles.letterCard,
                  isLearned && styles.letterCardLearned,
                  isExpanded && styles.letterCardExpanded,
                ]}
                activeOpacity={0.7}
                onPress={() => selectLetter(letter)}
              >
                <Text
                  style={[
                    styles.letterCardChar,
                    isLearned && styles.letterCardCharLearned,
                  ]}
                >
                  {letter.letter}
                </Text>
                {isLearned && (
                  <View style={styles.learnedCheck}>
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Inline Expanded View */}
        {expandedLetter && (
          <Animated.View
            style={[
              styles.expandedCard,
              {
                opacity: expandAnim,
                transform: [
                  {
                    translateY: expandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={closeLetter}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>

            {/* Big Letter */}
            <Text style={styles.bigLetter}>{expandedLetter.letter}</Text>
            <Text style={styles.letterName}>
              {expandedLetter.name} -- {expandedLetter.nameAr}
            </Text>
            <Text style={styles.letterTranslit}>
              {expandedLetter.transliteration}
            </Text>

            {/* Audio Button */}
            <TouchableOpacity
              style={styles.audioBtn}
              onPress={() => speakArabic(expandedLetter.letter)}
            >
              <Ionicons name="volume-high" size={20} color={Colors.primary} />
              <Text style={styles.audioBtnText}>Listen</Text>
            </TouchableOpacity>

            {/* 4 Forms */}
            <Text style={styles.sectionTitle}>Letter Forms</Text>
            <View style={styles.formsRow}>
              {Object.entries(expandedLetter.forms).map(([form, char]) => (
                <View key={form} style={styles.formCard}>
                  <Text style={styles.formChar}>{char}</Text>
                  <Text style={styles.formLabel}>{form}</Text>
                </View>
              ))}
            </View>

            {/* Pronunciation Tip */}
            <View style={styles.tipCard}>
              <Ionicons name="mic-outline" size={18} color={Colors.primary} />
              <Text style={styles.tipText}>
                {expandedLetter.pronunciationTip}
              </Text>
            </View>

            {/* Emirati Example */}
            <View style={styles.exampleCard}>
              <Text style={styles.exampleLabel}>Emirati Example</Text>
              <Text style={styles.exampleArabic}>
                {expandedLetter.emiratiExample.word}
              </Text>
              <Text style={styles.exampleTranslit}>
                {expandedLetter.emiratiExample.transliteration}
              </Text>
              <Text style={styles.exampleMeaning}>
                {expandedLetter.emiratiExample.meaning}
              </Text>
            </View>

            {/* Mark Learned */}
            {!learnedLetters.includes(expandedLetter.id) ? (
              <GoldButton
                title="Mark as Learned (+5 XP)"
                icon="checkmark-circle"
                onPress={() => markLearned(expandedLetter.id)}
                style={{ marginTop: Spacing.md }}
              />
            ) : (
              <View style={styles.alreadyLearned}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={Colors.success}
                />
                <Text style={styles.alreadyLearnedText}>Learned!</Text>
              </View>
            )}
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },

  // ── Progress ──
  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.card,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  progressPercent: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: Colors.surface,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },

  // ── Grid ──
  letterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  letterCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  letterCardLearned: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  letterCardExpanded: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryMuted,
  },
  letterCardChar: {
    color: Colors.text,
    fontSize: 22,
  },
  letterCardCharLearned: {
    color: Colors.primaryDark,
    fontWeight: FontWeight.bold,
  },
  learnedCheck: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.xpGold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Expanded Detail ──
  expandedCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    ...Shadows.cardLifted,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigLetter: {
    color: Colors.primary,
    fontSize: 80,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.sm,
  },
  letterName: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.sm,
  },
  letterTranslit: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: 4,
    fontStyle: 'italic',
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  audioBtnText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  formsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.sm,
    width: '100%',
  },
  formCard: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  formChar: {
    color: Colors.text,
    fontSize: 28,
    marginBottom: 4,
    fontWeight: FontWeight.semibold,
  },
  formLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'capitalize',
    fontWeight: FontWeight.medium,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
    width: '100%',
  },
  tipText: {
    color: Colors.primaryDark,
    fontSize: FontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  exampleCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    width: '100%',
  },
  exampleLabel: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  exampleArabic: {
    color: Colors.text,
    fontSize: FontSize.arabicLarge,
    fontWeight: FontWeight.bold,
  },
  exampleTranslit: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
    fontStyle: 'italic',
    marginTop: 4,
  },
  exampleMeaning: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: 4,
  },
  alreadyLearned: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  alreadyLearnedText: {
    color: Colors.success,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
});
