/**
 * Vocabulary Browser — Searchable phrases with audio playback
 * Desert Gold themed with category filters, expandable cards
 */
import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  FontFamily,
  BorderRadius,
  Shadows,
  ComponentTokens,
  ClayStyle,
} from '@/constants/theme';
import { missions } from '@/data/missions';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { speakArabic, stopSpeaking } from '@/services/speechService';

// All phrases from all missions
// Map each mission to a theme for filtering
const MISSION_THEME_MAP: Record<string, string> = {
  'mission-1-greetings': 'Greetings',
  'mission-2-taxi': 'Taxi',
  'mission-3-restaurant': 'Food',
  'mission-4-shopping': 'Shopping',
  'mission-5-phone': 'Phone',
};

const allPhrases = missions.flatMap((m) =>
  m.phrases.map((p) => ({
    ...p,
    missionTitle: m.title,
    missionEmoji: m.emoji,
    theme: MISSION_THEME_MAP[m.id] || m.title,
  }))
);

// Category color map — keyed by theme
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Greetings: { bg: Colors.primaryMuted, text: Colors.primary },
  Taxi: { bg: Colors.secondaryMuted, text: Colors.secondary },
  Food: { bg: Colors.accentMuted, text: Colors.accent },
  Shopping: { bg: Colors.xpPurple + '12', text: Colors.xpPurple },
  Phone: { bg: Colors.info + '12', text: Colors.info },
  // Fallback for phrase categories
  greeting: { bg: Colors.primaryMuted, text: Colors.primary },
  question: { bg: Colors.info + '12', text: Colors.info },
  response: { bg: Colors.secondaryMuted, text: Colors.secondary },
  expression: { bg: Colors.accentMuted, text: Colors.accent },
  vocab: { bg: Colors.primaryMuted, text: Colors.primary },
  default: { bg: Colors.surface, text: Colors.textSecondary },
};

const FILTER_TABS = ['All', 'Greetings', 'Taxi', 'Food', 'Shopping', 'Phone'];

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
}

export default function VocabularyScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [searchQuery, setSearchQuery] = useState(q ?? '');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Stop speech when leaving screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopSpeaking();
      };
    }, [])
  );

  // Improved search: splits multi-word queries and matches ANY word
  const filteredPhrases = useMemo(() => {
    let results = allPhrases;

    // Apply theme filter (based on mission, not phrase category)
    if (activeFilter !== 'All') {
      results = results.filter((p) => p.theme === activeFilter);
    }

    // Apply search
    const rawQuery = searchQuery.toLowerCase().trim();
    if (!rawQuery) return results;

    const terms = rawQuery.split(/\s+/).filter(Boolean);

    return results.filter((p) => {
      const searchFields = [
        p.english.toLowerCase(),
        p.transliteration.toLowerCase(),
        p.arabic,
        p.category.toLowerCase(),
        p.theme.toLowerCase(),
        p.missionTitle.toLowerCase(),
      ].join(' ');

      return terms.some((term) => searchFields.includes(term));
    });
  }, [searchQuery, activeFilter]);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
        <Ionicons
          name="search"
          size={18}
          color={isSearchFocused ? Colors.primary : Colors.textMuted}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search phrases..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Tabs */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterTab,
                  isActive && styles.filterTabActive,
                ]}
                onPress={() => setActiveFilter(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isActive && styles.filterTabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Count */}
      <Text style={styles.resultCount}>
        {filteredPhrases.length} phrase{filteredPhrases.length !== 1 ? 's' : ''}
        {searchQuery ? ` matching "${searchQuery}"` : ''}
        {activeFilter !== 'All' ? ` in ${activeFilter}` : ' total'}
      </Text>

      {/* Phrase List */}
      <FlatList
        data={filteredPhrases}
        keyExtractor={(item, index) => `${item.arabic}-${index}`}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        renderItem={({ item }) => {
          const isExpanded = expandedId === `${item.arabic}-${item.english}`;
          const catColor = getCategoryColor(item.theme);

          return (
            <TouchableOpacity
              style={[styles.phraseCard, isExpanded && styles.phraseCardExpanded]}
              activeOpacity={0.8}
              onPress={() =>
                setExpandedId(isExpanded ? null : `${item.arabic}-${item.english}`)
              }
            >
              <View style={styles.phraseHeader}>
                <View style={styles.phraseMain}>
                  <Text style={styles.phraseArabic}>{item.arabic}</Text>
                  <Text style={styles.phraseEnglish}>{item.english}</Text>
                </View>

                {/* Category badge */}
                <View style={[styles.categoryPill, { backgroundColor: catColor.bg }]}>
                  <Text style={[styles.categoryPillText, { color: catColor.text }]}>
                    {item.theme}
                  </Text>
                </View>

                {/* Speaker button */}
                <TouchableOpacity
                  style={styles.phraseSpeaker}
                  onPress={() => speakArabic(item.arabic)}
                  activeOpacity={0.7}
                >
                  <View style={styles.phraseSpeakerCircle}>
                    <Ionicons name="volume-medium" size={16} color="#FFF" />
                  </View>
                </TouchableOpacity>

                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textMuted}
                />
              </View>

              {isExpanded && (
                <View style={styles.phraseDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transliteration</Text>
                    <Text style={styles.detailValue}>{item.transliteration}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>English</Text>
                    <Text style={styles.detailValue}>{item.english}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>From</Text>
                    <Text style={styles.detailValue}>
                      {item.missionEmoji} {item.missionTitle}
                    </Text>
                  </View>

                  {/* Listen Slowly button */}
                  <TouchableOpacity
                    style={styles.speakSlowBtn}
                    onPress={() => speakArabic(item.arabic, 0.5)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="volume-low" size={16} color={Colors.primary} />
                    <Text style={styles.speakSlowText}>Listen Slowly</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyText}>No phrases found</Text>
            <Text style={styles.emptyHint}>
              Try searching by English meaning or pick a different category
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },

  // ── Search Bar ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.md,
    gap: Spacing.sm,
    ...ClayStyle.card,
    borderRadius: BorderRadius.lg,
    ...Shadows.clay,
  },
  searchBarFocused: {
    borderColor: Colors.primary,
    ...Shadows.glow,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    paddingVertical: 4,
  },

  // ── Filter Tabs ──
  filterRow: {
    marginTop: Spacing.md,
  },
  filterContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  filterTabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    fontFamily: FontFamily.medium,
  },
  filterTabTextActive: {
    color: '#FFF',
    fontWeight: FontWeight.bold,
  },

  // ── Results Count ──
  resultCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    fontWeight: FontWeight.medium,
    fontFamily: FontFamily.medium,
  },

  // ── Phrase Card ──
  phraseCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...ClayStyle.card,
    borderRadius: BorderRadius.lg,
    ...Shadows.clay,
  },
  phraseCardExpanded: {
    borderColor: Colors.cardBorder,
    ...Shadows.card,
  },
  phraseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  phraseMain: {
    flex: 1,
  },
  phraseArabic: {
    color: Colors.text,
    fontSize: FontSize.arabic,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    lineHeight: 38,
  },
  phraseEnglish: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },

  // ── Category pill ──
  categoryPill: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  categoryPillText: {
    fontSize: FontSize['2xs'],
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Speaker Button ──
  phraseSpeaker: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  phraseSpeakerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(0,0,0,0.06)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
  },

  // ── Details ──
  phraseDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  detailValue: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  speakSlowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.xs,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  speakSlowText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // ── Empty State ──
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
    borderLeftColor: 'rgba(255, 255, 255, 0.5)',
    borderRightColor: 'rgba(107, 113, 148, 0.08)',
    borderBottomColor: 'rgba(107, 113, 148, 0.12)',
    ...Shadows.clay,
  },
  emptyText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
  emptyHint: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
