/**
 * Home — the Emirati Arabic phrase browser.
 *
 * Single screen. Three level pills at the top (Beginner / Intermediate /
 * Expert). A search box. A scrollable list of phrases grouped by theme.
 * Tap any phrase to hear it spoken via the device's Arabic TTS voice.
 *
 * On level change, we also reschedule the daily-phrase notification so
 * tomorrow's reminder uses the new level's pool.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Colors, FontSize, FontWeight, FontFamily, Spacing,
  BorderRadius, Shadows,
} from '@/constants/theme';
import {
  LEVELS,
  themesForLevel,
  type Level,
  type Phrase,
  type PhraseTheme,
} from '@/data/phrases';
import * as Storage from '@/services/storageService';
import { speakArabic } from '@/services/speechService';
import { scheduleDailyPhrase } from '@/services/notificationService';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [level, setLevelState] = useState<Level | null>(null);
  const [query, setQuery] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Gate onboarding + load saved level on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const onboarded = await Storage.hasOnboarded();
      if (!onboarded) {
        router.replace('/onboarding');
        return;
      }
      const stored = await Storage.getLevel();
      if (!cancelled) setLevelState(stored);
    })();
    return () => { cancelled = true; };
  }, [router]);

  // Keep level in sync if changed in another screen.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Storage.getLevel().then((lvl) => {
        if (!cancelled) setLevelState((prev) => prev ?? lvl);
      });
      return () => { cancelled = true; };
    }, [])
  );

  const themes: PhraseTheme[] = useMemo(
    () => (level ? themesForLevel(level) : []),
    [level]
  );

  const filteredThemes: PhraseTheme[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return themes;
    return themes
      .map((t) => ({
        ...t,
        phrases: t.phrases.filter((p) =>
          p.english.toLowerCase().includes(q) ||
          p.transliteration.toLowerCase().includes(q) ||
          p.arabic.includes(query.trim())
        ),
      }))
      .filter((t) => t.phrases.length > 0);
  }, [themes, query]);

  async function handleLevelChange(next: Level) {
    if (next === level) return;
    setLevelState(next);
    setQuery('');
    await Storage.setLevel(next);
    // Reschedule the daily notification to use the new level's pool.
    scheduleDailyPhrase();
  }

  async function handleSpeak(phrase: Phrase) {
    if (speakingId) return;
    setSpeakingId(phrase.id);
    try {
      await speakArabic(phrase.arabic, 0.7);
    } finally {
      setSpeakingId(null);
    }
  }

  if (!level) {
    return (
      <View style={[styles.root, styles.loading]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const totalPhrases = filteredThemes.reduce((n, t) => n + t.phrases.length, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Hala</Text>
        <Text style={styles.title}>Emirati Arabic</Text>
      </View>

      <View style={styles.pillRow}>
        {LEVELS.map((l) => {
          const active = l.id === level;
          return (
            <Pressable
              key={l.id}
              onPress={() => handleLevelChange(l.id)}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {l.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.searchRow}>
        <Ionicons
          name="search"
          size={18}
          color={Colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search English, transliteration, or Arabic"
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => setQuery('')}
            hitSlop={8}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filteredThemes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyBody}>
              Try a different search or switch level.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.count}>
              {totalPhrases} phrase{totalPhrases === 1 ? '' : 's'}
            </Text>
            {filteredThemes.map((theme) => (
              <View key={theme.id} style={styles.themeBlock}>
                <Text style={styles.themeTitle}>
                  <Text style={styles.themeEmoji}>{theme.emoji}  </Text>
                  {theme.title}
                </Text>
                {theme.phrases.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => handleSpeak(p)}
                    style={({ pressed }) => [
                      styles.phraseRow,
                      pressed && styles.phraseRowPressed,
                    ]}
                  >
                    <View style={styles.phraseMain}>
                      <Text style={styles.arabic}>{p.arabic}</Text>
                      <Text style={styles.transliteration}>
                        {p.transliteration}
                      </Text>
                      <Text style={styles.english}>{p.english}</Text>
                    </View>
                    <View style={styles.speakBtn}>
                      {speakingId === p.id ? (
                        <ActivityIndicator
                          size="small"
                          color={Colors.primaryDark}
                        />
                      ) : (
                        <Ionicons
                          name="volume-high"
                          size={20}
                          color={Colors.primaryDark}
                        />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loading: { alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: Colors.primaryDark,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.black,
    fontWeight: FontWeight.black,
    color: Colors.text,
  },
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  pill: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
    ...Shadows.soft,
  },
  pillText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  pillTextActive: { color: Colors.textOnPrimary },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearBtn: { padding: Spacing.xs },
  list: { paddingHorizontal: Spacing.lg },
  count: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  themeBlock: { marginBottom: Spacing.lg },
  themeTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  themeEmoji: { fontSize: FontSize.md },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  phraseRowPressed: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryMuted,
  },
  phraseMain: { flex: 1, marginRight: Spacing.sm },
  arabic: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 2,
    writingDirection: 'rtl',
  },
  transliteration: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  english: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  speakBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyBody: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
});
