/**
 * Storage Service — v3.0 (phrase-browser only)
 *
 * Persists exactly two pieces of user state:
 *   - whether onboarding has run (`@hala_onboarded`)
 *   - the user's chosen level    (`@hala_level`)
 *
 * Streak / XP / SRS / placement / weekly activity / freezes were all cut
 * in v3.0 along with the features that depended on them.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Level } from '@/data/phrases';

const KEYS = {
  ONBOARDED: '@hala_onboarded',
  LEVEL: '@hala_level',
} as const;

const VALID_LEVELS: readonly Level[] = ['beginner', 'intermediate', 'expert'];

// ─── Onboarding ──────────────────────────────────

export async function hasOnboarded(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEYS.ONBOARDED)) === 'true';
  } catch {
    return false;
  }
}

export async function setOnboarded(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
  } catch {
    /* swallow — non-fatal */
  }
}

// ─── Level ───────────────────────────────────────

export async function getLevel(): Promise<Level> {
  try {
    const stored = await AsyncStorage.getItem(KEYS.LEVEL);
    if (stored && (VALID_LEVELS as readonly string[]).includes(stored)) {
      return stored as Level;
    }
  } catch {
    /* fall through */
  }
  return 'beginner';
}

export async function setLevel(level: Level): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LEVEL, level);
  } catch {
    /* swallow — non-fatal */
  }
}

// ─── Reset (rarely used) ────────────────────────

export async function resetAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch {
    /* swallow */
  }
}