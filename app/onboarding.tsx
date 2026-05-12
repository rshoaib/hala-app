/**
 * Onboarding — one screen, one decision.
 * The user picks Beginner / Intermediate / Expert. We persist it and
 * route to home. No commitment screens, no notification scheduling,
 * no goals. Level is editable later via the home-screen toggle.
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Colors, FontSize, FontWeight, FontFamily, Spacing,
  BorderRadius, Shadows,
} from '@/constants/theme';
import { LEVELS, type Level } from '@/data/phrases';
import * as Storage from '@/services/storageService';
import GoldButton from '@/components/GoldButton';

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState<Level>('beginner');
  const [busy, setBusy] = useState(false);

  async function handleStart() {
    if (busy) return;
    setBusy(true);
    try {
      await Storage.setLevel(picked);
      await Storage.setOnboarded();
      router.replace('/today');
    } catch {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.lg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Hala — مرحبا</Text>
          <Text style={styles.title}>Learn Emirati Arabic</Text>
          <Text style={styles.subtitle}>
            Pick a level to get started. You can switch any time.
          </Text>
        </View>

        <View style={styles.options}>
          {LEVELS.map((lvl) => {
            const selected = lvl.id === picked;
            return (
              <Pressable
                key={lvl.id}
                onPress={() => setPicked(lvl.id)}
                style={[
                  styles.option,
                  selected && styles.optionSelected,
                ]}
              >
                <View style={styles.optionHead}>
                  <Text style={[
                    styles.optionTitle,
                    selected && styles.optionTitleSelected,
                  ]}>
                    {lvl.title}
                  </Text>
                  <View style={[
                    styles.radio,
                    selected && styles.radioSelected,
                  ]}>
                    {selected && <View style={styles.radioDot} />}
                  </View>
                </View>
                <Text style={styles.optionDesc}>{lvl.description}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.cta}>
          {busy ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <GoldButton title="Start learning" onPress={handleStart} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  eyebrow: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.primaryDark,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.hero,
    fontFamily: FontFamily.black,
    fontWeight: FontWeight.black,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 48,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  options: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  option: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
    ...Shadows.card,
  },
  optionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  optionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  optionTitleSelected: {
    color: Colors.primaryDark,
  },
  optionDesc: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  cta: {
    paddingTop: Spacing.md,
  },
});