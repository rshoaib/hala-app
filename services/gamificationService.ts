/**
 * Gamification Service — daily streak, XP, levels, and streak freezes.
 *
 * Pure logic only; persistence lives in storageService. The model rewards
 * the existing SRS practice loop:
 *   - +XP for each correct answer, each newly-learned phrase, and for
 *     completing a session.
 *   - a daily streak that counts consecutive practice days.
 *   - one automatic "streak freeze" per week that bridges a single missed
 *     day so an honest learner doesn't lose a long streak to one slip.
 *   - milestone celebrations at 7 / 30 / 100 day streaks.
 *
 * Everything is deterministic given (state, now): no Date.now()/random
 * inside, so callers pass the clock and the results are reproducible.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface GamificationState {
  /** Lifetime experience points. */
  xp: number;
  /** Consecutive practice days (with at most one weekly freeze bridging). */
  currentStreak: number;
  /** Best streak ever reached. */
  longestStreak: number;
  /** Local day index of the last practice day, or null if never. */
  lastActiveDay: number | null;
  /** Week index in which a freeze was last spent, or null. */
  lastFreezeWeek: number | null;
  /** Streak milestones already celebrated (so we don't repeat them). */
  celebratedMilestones: number[];
}

export const DEFAULT_GAMIFICATION: GamificationState = {
  xp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDay: null,
  lastFreezeWeek: null,
  celebratedMilestones: [],
};

// ─── XP awards ───────────────────────────────────
export const XP_PER_CORRECT = 10;
export const XP_PER_NEW_PHRASE = 5;
export const XP_SESSION_COMPLETE = 25;

/** Streak lengths that trigger a confetti celebration. */
export const STREAK_MILESTONES = [7, 30, 100] as const;

// ─── Level tiers (title unlocks) ─────────────────
// Achievement tiers — distinct from the Beginner/Intermediate/Expert
// difficulty pills, so "Novice" (not "Beginner") leads to avoid conflating
// the two concepts (and colliding with the pill label on screen).
const LEVEL_TIERS: { minLevel: number; title: string }[] = [
  { minLevel: 1, title: 'Novice' },
  { minLevel: 5, title: 'Explorer' },
  { minLevel: 10, title: 'Conversationalist' },
  { minLevel: 20, title: 'Storyteller' },
  { minLevel: 35, title: 'Master' },
];

// ─── Day / week helpers ──────────────────────────

/** Local-midnight day index (whole days, respects the device timezone). */
export function dayIndex(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / DAY_MS);
}

/**
 * Week index for "once per week" freeze accounting. The +4 aligns the epoch
 * (Thursday 1 Jan 1970) so weeks roll over on Monday, matching ISO weeks.
 */
export function weekIndex(now: number): number {
  return Math.floor((dayIndex(now) + 4) / 7);
}

// ─── Levels ──────────────────────────────────────

/** Cumulative XP required to *reach* a given level (level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  const l = Math.max(1, level);
  return 25 * (l - 1) * l;
}

/** Current level for a given lifetime XP total (level ≥ 1). */
export function levelForXp(xp: number): number {
  const safe = Math.max(0, xp);
  // Invert xpForLevel: solve 25(L-1)L ≤ xp for the largest integer L.
  const level = Math.floor((1 + Math.sqrt(1 + (4 * safe) / 25)) / 2);
  return Math.max(1, level);
}

/** Title unlocked at a given level. */
export function titleForLevel(level: number): string {
  let title = LEVEL_TIERS[0].title;
  for (const tier of LEVEL_TIERS) {
    if (level >= tier.minLevel) title = tier.title;
  }
  return title;
}

export interface LevelProgress {
  level: number;
  title: string;
  /** XP needed to have reached the current level. */
  levelStartXp: number;
  /** XP needed to reach the next level. */
  nextLevelXp: number;
  /** XP earned within the current level. */
  intoLevel: number;
  /** XP span of the current level. */
  levelSpan: number;
  /** Fraction [0,1] of progress toward the next level. */
  ratio: number;
}

/** Full level breakdown for the progress UI. */
export function levelProgress(xp: number): LevelProgress {
  const safe = Math.max(0, xp);
  const level = levelForXp(safe);
  const levelStartXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const levelSpan = nextLevelXp - levelStartXp;
  const intoLevel = safe - levelStartXp;
  return {
    level,
    title: titleForLevel(level),
    levelStartXp,
    nextLevelXp,
    intoLevel,
    levelSpan,
    ratio: levelSpan > 0 ? Math.min(1, intoLevel / levelSpan) : 0,
  };
}

// ─── Streak freeze ───────────────────────────────

/** Whether a free streak freeze is available in the week containing `now`. */
export function freezeAvailable(state: GamificationState, now: number): boolean {
  return state.lastFreezeWeek !== weekIndex(now);
}

// ─── Session completion (the one entry point practice calls) ───

export interface SessionReward {
  correct: number;
  newPhrases: number;
}

export interface SessionOutcome {
  state: GamificationState;
  xpEarned: number;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  newTitle: string;
  streak: number;
  usedFreeze: boolean;
  /** A milestone just reached (7/30/100), or null. */
  milestone: number | null;
}

/**
 * Apply the rewards for a completed practice session: grant XP, advance the
 * daily streak (spending a weekly freeze to bridge a single missed day),
 * and flag any newly-reached milestone. Returns the next state plus a
 * summary the UI uses to celebrate. Pure — the caller persists `state`.
 */
export function completePracticeSession(
  prev: GamificationState,
  reward: SessionReward,
  now: number
): SessionOutcome {
  const previousLevel = levelForXp(prev.xp);

  // 1) XP
  const xpEarned =
    Math.max(0, reward.correct) * XP_PER_CORRECT +
    Math.max(0, reward.newPhrases) * XP_PER_NEW_PHRASE +
    XP_SESSION_COMPLETE;
  let xp = prev.xp + xpEarned;

  // 2) Streak
  const today = dayIndex(now);
  let currentStreak = prev.currentStreak;
  let lastFreezeWeek = prev.lastFreezeWeek;
  let usedFreeze = false;

  if (prev.lastActiveDay === null) {
    currentStreak = 1;
  } else {
    const gap = today - prev.lastActiveDay;
    if (gap <= 0) {
      // Already practiced today (or clock skew) — keep the streak.
      currentStreak = Math.max(1, prev.currentStreak);
    } else if (gap === 1) {
      currentStreak = prev.currentStreak + 1;
    } else if (gap === 2 && freezeAvailable(prev, now)) {
      // Missed exactly one day — spend this week's freeze to keep going.
      currentStreak = prev.currentStreak + 1;
      lastFreezeWeek = weekIndex(now);
      usedFreeze = true;
    } else {
      currentStreak = 1;
    }
  }

  const longestStreak = Math.max(prev.longestStreak, currentStreak);

  // 3) Milestone (only when freshly reached and not yet celebrated)
  let milestone: number | null = null;
  let celebratedMilestones = prev.celebratedMilestones;
  if (
    (STREAK_MILESTONES as readonly number[]).includes(currentStreak) &&
    !prev.celebratedMilestones.includes(currentStreak)
  ) {
    milestone = currentStreak;
    celebratedMilestones = [...prev.celebratedMilestones, currentStreak];
  }

  const state: GamificationState = {
    xp,
    currentStreak,
    longestStreak,
    lastActiveDay: today,
    lastFreezeWeek,
    celebratedMilestones,
  };

  const newLevel = levelForXp(xp);
  return {
    state,
    xpEarned,
    leveledUp: newLevel > previousLevel,
    previousLevel,
    newLevel,
    newTitle: titleForLevel(newLevel),
    streak: currentStreak,
    usedFreeze,
    milestone,
  };
}

/**
 * Whether today still counts toward the streak shown on Home — true once
 * the user has practiced today. Drives the "practice to keep your streak"
 * hint without mutating state.
 */
export function practicedToday(state: GamificationState, now: number): boolean {
  return state.lastActiveDay === dayIndex(now);
}
