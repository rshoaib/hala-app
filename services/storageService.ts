/**
 * Storage Service — v3.1 (phrase browser + daily practice)
 *
 * Persists four pieces of user state:
 *   - whether onboarding has run     (`@hala_onboarded`)
 *   - the user's chosen level        (`@hala_level`)
 *   - the SRS practice schedule      (`@hala_practice_v1`)
 *   - practice session counters      (`@hala_practice_stats_v1`)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Level } from '@/data/phrases';
import type { PracticeRecord, PracticeState } from '@/services/srsService';

const KEYS = {
  ONBOARDED: '@hala_onboarded',
  LEVEL: '@hala_level',
  PRACTICE: '@hala_practice_v1',
  PRACTICE_STATS: '@hala_practice_stats_v1',
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

// ─── Practice (SRS) state ────────────────────────

export async function getPracticeState(): Promise<PracticeState> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PRACTICE);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    // Keep only well-formed records so a corrupt entry can't crash the app.
    const state: PracticeState = {};
    for (const [id, value] of Object.entries(parsed)) {
      const record = value as Partial<PracticeRecord> | null;
      if (
        record !== null &&
        typeof record === 'object' &&
        typeof record.stage === 'number' &&
        typeof record.due === 'number'
      ) {
        state[id] = { stage: record.stage, due: record.due };
      }
    }
    return state;
  } catch {
    return {};
  }
}

export async function setPracticeState(state: PracticeState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PRACTICE, JSON.stringify(state));
  } catch {
    /* swallow — non-fatal */
  }
}

// ─── Practice session counters ───────────────────
// Success-metric instrumentation: completion rate = completed / started.

export interface PracticeStats {
  started: number;
  completed: number;
}

export async function getPracticeStats(): Promise<PracticeStats> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PRACTICE_STATS);
    if (!raw) return { started: 0, completed: 0 };
    const parsed: unknown = JSON.parse(raw);
    const stats = parsed as Partial<PracticeStats> | null;
    if (
      stats !== null &&
      typeof stats === 'object' &&
      typeof stats.started === 'number' &&
      typeof stats.completed === 'number'
    ) {
      return { started: stats.started, completed: stats.completed };
    }
    return { started: 0, completed: 0 };
  } catch {
    return { started: 0, completed: 0 };
  }
}

export async function setPracticeStats(stats: PracticeStats): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PRACTICE_STATS, JSON.stringify(stats));
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