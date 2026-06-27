/**
 * Storage Service — v3.1 (phrase browser + daily practice)
 *
 * Persists four pieces of user state:
 *   - whether onboarding has run     (`@hala_onboarded`)
 *   - the user's chosen level        (`@hala_level`)
 *   - the SRS practice schedule      (`@hala_practice_v1`)
 *   - practice session counters      (`@hala_practice_stats_v1`)
 *
 * Installs upgraded from v2 may still carry orphaned legacy keys
 * (streak/XP/flashcard-schedule etc., cut in v3.0); `resetAllData`
 * only clears the keys listed here.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Level } from '@/data/phrases';
import {
  INTERVAL_DAYS,
  type PracticeRecord,
  type PracticeState,
} from '@/services/srsService';
import {
  DEFAULT_GAMIFICATION,
  type GamificationState,
} from '@/services/gamificationService';

const KEYS = {
  ONBOARDED: '@hala_onboarded',
  LEVEL: '@hala_level',
  PRACTICE: '@hala_practice_v1',
  PRACTICE_STATS: '@hala_practice_stats_v1',
  GAMIFICATION: '@hala_gamification_v1',
} as const;

/** Parse a stored JSON blob; null when missing, unreadable, or invalid. */
async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

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
  const parsed = await readJson(KEYS.PRACTICE);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {};
  }
  // Keep only well-formed records — stage must index INTERVAL_DAYS and
  // due must be a real timestamp — so a corrupt entry can't poison the
  // SRS math (e.g. INTERVAL_DAYS[-2] → due: NaN → phrase never due).
  const state: PracticeState = {};
  for (const [id, value] of Object.entries(parsed)) {
    const record = value as Partial<PracticeRecord> | null;
    if (
      record !== null &&
      typeof record === 'object' &&
      typeof record.stage === 'number' &&
      Number.isInteger(record.stage) &&
      record.stage >= 0 &&
      record.stage < INTERVAL_DAYS.length &&
      typeof record.due === 'number' &&
      Number.isFinite(record.due)
    ) {
      state[id] = { stage: record.stage, due: record.due };
    }
  }
  return state;
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

const DEFAULT_STATS: PracticeStats = { started: 0, completed: 0 };

export async function getPracticeStats(): Promise<PracticeStats> {
  const parsed = await readJson(KEYS.PRACTICE_STATS);
  const stats = parsed as Partial<PracticeStats> | null;
  if (
    stats !== null &&
    typeof stats === 'object' &&
    !Array.isArray(stats) &&
    typeof stats.started === 'number' &&
    typeof stats.completed === 'number'
  ) {
    return { started: stats.started, completed: stats.completed };
  }
  return DEFAULT_STATS;
}

export async function setPracticeStats(stats: PracticeStats): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PRACTICE_STATS, JSON.stringify(stats));
  } catch {
    /* swallow — non-fatal */
  }
}

// ─── Gamification (streak / XP / level) ──────────

export async function getGamificationState(): Promise<GamificationState> {
  const parsed = await readJson(KEYS.GAMIFICATION);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ...DEFAULT_GAMIFICATION };
  }
  const g = parsed as Partial<GamificationState>;
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return {
    xp: Math.max(0, num(g.xp, 0)),
    currentStreak: Math.max(0, num(g.currentStreak, 0)),
    longestStreak: Math.max(0, num(g.longestStreak, 0)),
    lastActiveDay:
      typeof g.lastActiveDay === 'number' && Number.isFinite(g.lastActiveDay)
        ? g.lastActiveDay
        : null,
    lastFreezeWeek:
      typeof g.lastFreezeWeek === 'number' && Number.isFinite(g.lastFreezeWeek)
        ? g.lastFreezeWeek
        : null,
    celebratedMilestones: Array.isArray(g.celebratedMilestones)
      ? g.celebratedMilestones.filter(
          (m): m is number => typeof m === 'number' && Number.isFinite(m)
        )
      : [],
  };
}

export async function setGamificationState(
  state: GamificationState
): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.GAMIFICATION, JSON.stringify(state));
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