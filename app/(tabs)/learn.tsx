/**
 * Learn Tab — Structured curriculum path
 * Duolingo-style mission path, alphabet preview, vocabulary, cultural tips
 */
import { useState, useCallback } from 'react';
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
  Colors, FontSize, FontWeight, FontFamily, Spacing,
  BorderRadius, Shadows, ComponentTokens, ClayStyle,
} from '@/constants/theme';
import MissionNode from '@/components/MissionNode';
import SectionHeader from '@/components/SectionHeader';
import * as Storage from '@/services/storageService';
import { missions } from '@/data/missions';
import { alphabet } from '@/data/alphabet';

// Cultural tips
const CULTURAL_TIPS = [
  { emoji: '🇦🇪', tip: 'Emiratis often greet with "As-salamu alaykum" and respond with "Wa alaykum as-salam".' },
  { emoji: '☕', tip: 'Offering coffee (gahwa) to guests is a deeply rooted Emirati tradition of hospitality.' },
  { emoji: '👋', tip: 'Use your right hand for greetings and eating — it\'s considered polite in UAE culture.' },
  { emoji: '🕌', tip: 'Friday is the holy day in the UAE. Most people attend Friday prayers at the mosque.' },
  { emoji: '🌴', tip: 'The date palm is a symbol of the UAE. Dates are offered as a sign of welcome.' },
  { emoji: '🎉', tip: 'National Day (Dec 2) is the biggest celebration, marking the federation of the Emirates.' },
  { emoji: '👔', tip: 'The white robe (kandura) and headscarf (ghutra) are traditional Emirati men\'s attire.' },
];

export default function LearnScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [alphabetProgress, setAlphabetProgress] = useState<number[]>([]);
  const [xp, setXP] = useState(0);

  const tipIndex = new Date().getDate() % CULTURAL_TIPS.length;
  const tip = CULTURAL_TIPS[tipIndex];

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [cm, ap, x] = await Promise.all([
          Storage.getCompletedMissions(),
          Storage.getAlphabetProgress(),
          Storage.getXP(),
        ]);
        setCompletedMissions(cm);
        setAlphabetProgress(ap);
        setXP(x);
      })();
    }, [])
  );

  const level = Storage.getLevel(xp);
  const totalPhrases = missions.reduce((acc, m) => acc + m.phrases.length, 0);

  function getMissionStatus(mission: typeof missions[0], index: number): 'completed' | 'current' | 'locked' {
    if (completedMissions.includes(mission.id)) return 'completed';
    if (index === 0 || completedMissions.includes(missions[index - 1].id)) return 'current';
    return 'locked';
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Level Header ── */}
      <View
        style={styles.levelHeader}
      >
        <View>
          <Text style={styles.levelTitle}>Level {level.level}: Survival Emirati</Text>
          <Text style={styles.levelSubtitle}>
            {completedMissions.length}/{missions.length} missions complete
          </Text>
        </View>
        <View style={styles.levelProgress}>
          <View style={styles.levelProgressBg}>
            <View
              style={[
                styles.levelProgressFill,
                { width: `${Math.round((completedMissions.length / missions.length) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.levelPercent}>
            {Math.round((completedMissions.length / missions.length) * 100)}%
          </Text>
        </View>
      </View>

      {/* ── Mission Path ── */}
      <SectionHeader title="Mission Path" style={{ marginTop: Spacing.lg }} />
      <View style={styles.missionPath}>
        {missions.map((mission, index) => (
          <MissionNode
            key={mission.id}
            emoji={mission.emoji}
            title={mission.title}
            status={getMissionStatus(mission, index)}
            onPress={() => router.push(`/mission/${mission.id}`)}
            showConnector={index > 0}
            isLeft={index % 2 === 0}
            xpReward={mission.xpReward}
          />
        ))}

        {/* Boss Battle Node */}
        <MissionNode
          emoji="⚔️"
          title="Boss Battle"
          status={completedMissions.length >= missions.length ? 'current' : 'locked'}
          onPress={() => router.push('/boss-battle')}
          showConnector={true}
          isLeft={missions.length % 2 === 0}
          xpReward={100}
        />
      </View>

      {/* ── Alphabet Section ── */}
      <SectionHeader
        title="Arabic Alphabet"
        subtitle={`${alphabetProgress.length}/${alphabet.length} letters learned`}
        actionLabel="View All"
        onAction={() => router.push('/alphabet')}
      />
      <View style={styles.alphabetPreview}>
        {alphabet.slice(0, 7).map((letter) => {
          const isLearned = alphabetProgress.includes(letter.id);
          return (
            <TouchableOpacity
              key={letter.id}
              style={[styles.letterCard, isLearned && styles.letterCardLearned]}
              onPress={() => router.push('/alphabet')}
              activeOpacity={0.7}
            >
              <Text style={[styles.letterText, isLearned && styles.letterTextLearned]}>
                {letter.letter}
              </Text>
              {isLearned && (
                <View style={styles.letterCheck}>
                  <Ionicons name="checkmark" size={10} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.letterCard, styles.letterCardMore]}
          onPress={() => router.push('/alphabet')}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Alphabet Progress Bar ── */}
      <View style={styles.alphabetBar}>
        <View style={styles.alphabetBarBg}>
          <View
            style={[
              styles.alphabetBarFill,
              { width: `${Math.round((alphabetProgress.length / alphabet.length) * 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* ── Vocabulary Section ── */}
      <SectionHeader
        title="Vocabulary"
        subtitle={`${totalPhrases} phrases across ${missions.length} missions`}
        actionLabel="Browse"
        onAction={() => router.push('/vocabulary')}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.vocabCategories}
      >
        {['Greetings', 'Taxi', 'Food', 'Shopping', 'Phone'].map((cat, i) => (
          <TouchableOpacity
            key={cat}
            style={styles.vocabPill}
            onPress={() => router.push({ pathname: '/vocabulary', params: { q: cat } })}
            activeOpacity={0.7}
          >
            <Text style={styles.vocabPillEmoji}>
              {['👋', '🚕', '🍽️', '🛍️', '📞'][i]}
            </Text>
            <Text style={styles.vocabPillText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Cultural Corner ── */}
      <SectionHeader title="Cultural Corner" subtitle="Did you know?" />
      <View style={styles.tipCard}>
        <Text style={styles.tipEmoji}>{tip.emoji}</Text>
        <Text style={styles.tipText}>{tip.tip}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.md },

  levelHeader: {
    ...ClayStyle.cardSolid('#1E2340'),
    padding: Spacing.lg,
    ...Shadows.cardLifted,
  },
  levelTitle: { fontSize: FontSize.xl, fontFamily: FontFamily.bold, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  levelSubtitle: { fontSize: FontSize.sm, fontFamily: FontFamily.regular, color: 'rgba(245,240,232,0.7)', marginTop: 4 },
  levelProgress: { marginTop: Spacing.md },
  levelProgressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' },
  levelProgressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  levelPercent: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'right' },

  missionPath: { marginBottom: Spacing.lg },

  alphabetPreview: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  letterCard: {
    width: 44,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...ClayStyle.card,
    ...Shadows.clay,
    borderRadius: BorderRadius.lg,
  },
  letterCardLearned: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  letterCardMore: {
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    flex: 1,
  },
  letterText: { fontSize: FontSize.xl, color: Colors.text },
  letterTextLearned: { color: Colors.primary, fontFamily: FontFamily.bold, fontWeight: FontWeight.bold },
  letterCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alphabetBar: { marginBottom: Spacing.lg },
  alphabetBarBg: { height: 4, backgroundColor: Colors.surface, borderRadius: 2, overflow: 'hidden' },
  alphabetBarFill: { height: '100%', backgroundColor: Colors.secondary, borderRadius: 2 },

  vocabCategories: { gap: Spacing.sm, paddingBottom: Spacing.lg },
  vocabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...ClayStyle.card,
    ...Shadows.soft,
    borderRadius: BorderRadius.full,
  },
  vocabPillEmoji: { fontSize: 16 },
  vocabPillText: { fontSize: FontSize.sm, fontFamily: FontFamily.semibold, fontWeight: FontWeight.semibold, color: Colors.text },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    ...ClayStyle.card,
    ...Shadows.clay,
  },
  tipEmoji: { fontSize: 28 },
  tipText: { flex: 1, fontSize: FontSize.sm, fontFamily: FontFamily.regular, color: Colors.textSecondary, lineHeight: 20 },
});
