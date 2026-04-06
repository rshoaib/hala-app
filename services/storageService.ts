/**
 * Storage Service — AsyncStorage persistence for all user data
 * Streaks, XP, progress, stakes challenges, flashcard confidence
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  STREAK: '@hala_streak',
  XP: '@hala_xp',
  COINS: '@hala_coins',
  COMPLETED_MISSIONS: '@hala_completed_missions',
  ALPHABET_PROGRESS: '@hala_alphabet_progress',
  FLASHCARD_SCHEDULE: '@hala_flashcard_schedule',
  LISTENING_STATS: '@hala_listening_stats',
  DAILY_CHALLENGE: '@hala_daily_challenge',
  SETTINGS: '@hala_settings',
  // New: Stakes system
  WEEKLY_CHALLENGE: '@hala_weekly_challenge',
  MONTHLY_CHALLENGE: '@hala_monthly_challenge',
  MONTHLY_BADGES: '@hala_monthly_badges',
  WEEKLY_ACTIVITY: '@hala_weekly_activity',
  DAILY_XP: '@hala_daily_xp',
  DAILY_GOAL: '@hala_daily_goal',
  // New: Spaced repetition
  PHRASE_CONFIDENCE: '@hala_phrase_confidence',
  // New: Onboarding
  ONBOARDED: '@hala_onboarded',
};

// Types
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  freezesAvailable: number;
  totalDaysActive: number;
}

export interface ListeningStats {
  totalMinutes: number;
  weeklyMinutes: number[];
  lastListenDate: string;
}

export interface DailyChallengeRecord {
  lastCompletedDate: string;
  totalCompleted: number;
}

export interface WeeklyChallenge {
  id: string;
  type: string;
  title: string;
  emoji: string;
  target: number;
  progress: number;
  weekStart: string; // ISO date of Monday
  xpTarget: number;
  xpProgress: number;
}

export interface MonthlyChallenge {
  id: string;
  type: string;
  title: string;
  emoji: string;
  target: number;
  progress: number;
  monthStart: string; // ISO date of 1st
  tier: 'none' | 'bronze' | 'silver' | 'gold';
}

export interface DailyXP {
  date: string;
  xp: number;
}

export interface PhraseConfidence {
  [phraseId: string]: {
    confidence: number; // 1-5
    lastReviewed: string;
    timesReviewed: number;
  };
}

// Default values
const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  freezesAvailable: 0,
  totalDaysActive: 0,
};

const DEFAULT_LISTENING: ListeningStats = {
  totalMinutes: 0,
  weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
  lastListenDate: '',
};

// ─── Helpers ─────────────────────────────────────

async function getJSON<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
}

async function setJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
  return monday.toISOString().split('T')[0];
}

function getMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// ─── XP ───────────────────────────────────────────

export async function getXP(): Promise<number> {
  return getJSON(KEYS.XP, 0);
}

export async function addXP(amount: number): Promise<number> {
  const current = await getXP();
  const newXP = current + amount;
  await setJSON(KEYS.XP, newXP);
  // Also track daily XP
  await addDailyXP(amount);
  // Update weekly challenge XP progress
  await updateWeeklyChallengeXP(amount);
  return newXP;
}

export function getLevel(xp: number): { level: number; currentXP: number; nextLevelXP: number; progress: number } {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
    else break;
  }
  const currentThreshold = thresholds[Math.min(level - 1, thresholds.length - 1)];
  const nextThreshold = thresholds[Math.min(level, thresholds.length - 1)];
  const nextLevelXP = nextThreshold - currentThreshold;

  // At max level, avoid division by zero
  if (nextLevelXP === 0) {
    return {
      level,
      currentXP: xp - currentThreshold,
      nextLevelXP: 1,
      progress: 1.0,
    };
  }

  const currentXP = xp - currentThreshold;
  return {
    level,
    currentXP,
    nextLevelXP,
    progress: currentXP / nextLevelXP,
  };
}

// ─── Coins ────────────────────────────────────────

export async function getCoins(): Promise<number> {
  return getJSON(KEYS.COINS, 0);
}

export async function addCoins(amount: number): Promise<number> {
  const current = await getCoins();
  const newCoins = current + amount;
  await setJSON(KEYS.COINS, newCoins);
  return newCoins;
}

// ─── Streaks ──────────────────────────────────────

export async function getStreak(): Promise<StreakData> {
  return getJSON(KEYS.STREAK, DEFAULT_STREAK);
}

export async function recordActivity(): Promise<StreakData> {
  const streak = await getStreak();
  const today = getToday();

  if (streak.lastActiveDate === today) {
    return streak;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newStreak: StreakData;

  if (streak.lastActiveDate === yesterday) {
    newStreak = {
      ...streak,
      currentStreak: streak.currentStreak + 1,
      longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
      lastActiveDate: today,
      totalDaysActive: streak.totalDaysActive + 1,
    };
  } else if (streak.lastActiveDate && streak.freezesAvailable > 0) {
    newStreak = {
      ...streak,
      currentStreak: streak.currentStreak + 1,
      longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
      lastActiveDate: today,
      freezesAvailable: streak.freezesAvailable - 1,
      totalDaysActive: streak.totalDaysActive + 1,
    };
  } else {
    newStreak = {
      ...streak,
      currentStreak: 1,
      lastActiveDate: today,
      totalDaysActive: streak.totalDaysActive + 1,
    };
  }

  await setJSON(KEYS.STREAK, newStreak);
  return newStreak;
}

export async function addStreakFreeze(): Promise<void> {
  const streak = await getStreak();
  await setJSON(KEYS.STREAK, { ...streak, freezesAvailable: streak.freezesAvailable + 1 });
}

export async function saveStreak(data: StreakData): Promise<void> {
  await setJSON(KEYS.STREAK, data);
}

// ─── Mission Progress ─────────────────────────────

export async function getCompletedMissions(): Promise<string[]> {
  return getJSON(KEYS.COMPLETED_MISSIONS, []);
}

export async function completeMission(missionId: string): Promise<void> {
  const completed = await getCompletedMissions();
  if (!completed.includes(missionId)) {
    completed.push(missionId);
    await setJSON(KEYS.COMPLETED_MISSIONS, completed);
  }
}

// ─── Alphabet Progress ────────────────────────────

export async function getAlphabetProgress(): Promise<number[]> {
  return getJSON(KEYS.ALPHABET_PROGRESS, []);
}

export async function markLetterLearned(letterId: number): Promise<void> {
  const progress = await getAlphabetProgress();
  if (!progress.includes(letterId)) {
    progress.push(letterId);
    await setJSON(KEYS.ALPHABET_PROGRESS, progress);
  }
}

// ─── Listening Stats ──────────────────────────────

export async function getListeningStats(): Promise<ListeningStats> {
  return getJSON(KEYS.LISTENING_STATS, DEFAULT_LISTENING);
}

export async function addListeningMinutes(minutes: number): Promise<void> {
  const stats = await getListeningStats();
  const dayOfWeek = new Date().getDay();
  const weeklyMinutes = [...stats.weeklyMinutes];
  weeklyMinutes[dayOfWeek] += minutes;

  await setJSON(KEYS.LISTENING_STATS, {
    totalMinutes: stats.totalMinutes + minutes,
    weeklyMinutes,
    lastListenDate: getToday(),
  });
}

// ─── Daily Challenge ──────────────────────────────

export async function getDailyChallengeRecord(): Promise<DailyChallengeRecord> {
  return getJSON(KEYS.DAILY_CHALLENGE, { lastCompletedDate: '', totalCompleted: 0 });
}

export async function completeDailyChallenge(): Promise<void> {
  const record = await getDailyChallengeRecord();
  await setJSON(KEYS.DAILY_CHALLENGE, {
    lastCompletedDate: getToday(),
    totalCompleted: record.totalCompleted + 1,
  });
}

// ─── Daily XP Tracking ───────────────────────────

export async function getDailyXP(): Promise<DailyXP> {
  const data = await getJSON<DailyXP>(KEYS.DAILY_XP, { date: '', xp: 0 });
  if (data.date !== getToday()) {
    return { date: getToday(), xp: 0 };
  }
  return data;
}

async function addDailyXP(amount: number): Promise<void> {
  const daily = await getDailyXP();
  await setJSON(KEYS.DAILY_XP, {
    date: getToday(),
    xp: daily.xp + amount,
  });
}

export async function getDailyGoal(): Promise<number> {
  return getJSON(KEYS.DAILY_GOAL, 50);
}

export async function setDailyGoal(goal: number): Promise<void> {
  await setJSON(KEYS.DAILY_GOAL, goal);
}

// ─── Weekly Activity (7-day tracker) ──────────────

export async function getWeeklyActivity(): Promise<Record<string, number>> {
  return getJSON(KEYS.WEEKLY_ACTIVITY, {});
}

export async function recordDailyActivity(xp: number): Promise<void> {
  const activity = await getWeeklyActivity();
  activity[getToday()] = (activity[getToday()] || 0) + xp;
  // Clean old entries (keep only last 14 days)
  const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
  for (const key of Object.keys(activity)) {
    if (key < cutoff) delete activity[key];
  }
  await setJSON(KEYS.WEEKLY_ACTIVITY, activity);
}

// ─── Weekly Challenge Stakes ─────────────────────

const WEEKLY_CHALLENGES = [
  { type: 'learn_phrases', target: 20, title: 'Learn 20 phrases', emoji: '📚', xpTarget: 350 },
  { type: 'complete_missions', target: 3, title: 'Complete 3 missions', emoji: '🎯', xpTarget: 350 },
  { type: 'perfect_quizzes', target: 5, title: 'Get 5 perfect scores', emoji: '⭐', xpTarget: 400 },
  { type: 'flashcard_reviews', target: 40, title: 'Review 40 flashcards', emoji: '🃏', xpTarget: 300 },
  { type: 'listening_minutes', target: 30, title: 'Listen for 30 minutes', emoji: '🎧', xpTarget: 350 },
  { type: 'arcade_score', target: 50, title: 'Score 50+ in Arcade', emoji: '🕹️', xpTarget: 300 },
];

export async function getWeeklyChallenge(): Promise<WeeklyChallenge> {
  const saved = await getJSON<WeeklyChallenge | null>(KEYS.WEEKLY_CHALLENGE, null);
  const monday = getMonday();

  if (saved && saved.weekStart === monday) {
    return saved;
  }

  // Generate new weekly challenge
  const weekNum = Math.floor(Date.now() / (7 * 86400000));
  const challenge = WEEKLY_CHALLENGES[weekNum % WEEKLY_CHALLENGES.length];
  const newChallenge: WeeklyChallenge = {
    id: `week_${monday}`,
    ...challenge,
    progress: 0,
    weekStart: monday,
    xpProgress: 0,
  };
  await setJSON(KEYS.WEEKLY_CHALLENGE, newChallenge);
  return newChallenge;
}

export async function updateWeeklyChallenge(type: string, amount: number = 1): Promise<void> {
  const challenge = await getWeeklyChallenge();
  if (challenge.type === type) {
    challenge.progress = Math.min(challenge.progress + amount, challenge.target);
    await setJSON(KEYS.WEEKLY_CHALLENGE, challenge);
  }
}

async function updateWeeklyChallengeXP(amount: number): Promise<void> {
  const challenge = await getWeeklyChallenge();
  challenge.xpProgress = (challenge.xpProgress || 0) + amount;
  await setJSON(KEYS.WEEKLY_CHALLENGE, challenge);
}

// ─── Monthly Challenge Stakes ────────────────────

const MONTHLY_CHALLENGES = [
  { type: 'total_xp', target: 2000, title: 'Earn 2000 XP', emoji: '🏆' },
  { type: 'streak_days', target: 20, title: '20-day streak', emoji: '🔥' },
  { type: 'all_letters', target: 28, title: 'Learn all letters', emoji: '🔤' },
  { type: 'all_missions', target: 5, title: 'Complete all missions', emoji: '🗺️' },
  { type: 'boss_wins', target: 3, title: 'Win 3 Boss Battles', emoji: '⚔️' },
];

export async function getMonthlyChallenge(): Promise<MonthlyChallenge> {
  const saved = await getJSON<MonthlyChallenge | null>(KEYS.MONTHLY_CHALLENGE, null);
  const monthStart = getMonthStart();

  if (saved && saved.monthStart === monthStart) {
    return saved;
  }

  // Generate new monthly challenge
  const monthNum = new Date().getMonth() + new Date().getFullYear() * 12;
  const challenge = MONTHLY_CHALLENGES[monthNum % MONTHLY_CHALLENGES.length];
  const newChallenge: MonthlyChallenge = {
    id: `month_${monthStart}`,
    ...challenge,
    progress: 0,
    monthStart,
    tier: 'none',
  };
  await setJSON(KEYS.MONTHLY_CHALLENGE, newChallenge);
  return newChallenge;
}

export async function updateMonthlyChallenge(type: string, amount: number = 1): Promise<void> {
  const challenge = await getMonthlyChallenge();
  if (challenge.type === type) {
    challenge.progress = Math.min(challenge.progress + amount, challenge.target);
    // Update tier
    const pct = challenge.progress / challenge.target;
    if (pct >= 1) challenge.tier = 'gold';
    else if (pct >= 0.7) challenge.tier = 'silver';
    else if (pct >= 0.4) challenge.tier = 'bronze';
    await setJSON(KEYS.MONTHLY_CHALLENGE, challenge);
  }
}

export async function getMonthlyBadges(): Promise<string[]> {
  return getJSON(KEYS.MONTHLY_BADGES, []);
}

export async function addMonthlyBadge(badgeId: string): Promise<void> {
  const badges = await getMonthlyBadges();
  if (!badges.includes(badgeId)) {
    badges.push(badgeId);
    await setJSON(KEYS.MONTHLY_BADGES, badges);
  }
}

// ─── Phrase Confidence (Spaced Repetition) ────────

export async function getPhraseConfidence(): Promise<PhraseConfidence> {
  return getJSON(KEYS.PHRASE_CONFIDENCE, {});
}

export async function updatePhraseConfidence(
  phraseId: string,
  knows: boolean
): Promise<void> {
  const data = await getPhraseConfidence();
  const existing = data[phraseId] || { confidence: 3, lastReviewed: '', timesReviewed: 0 };

  data[phraseId] = {
    confidence: knows
      ? Math.min(existing.confidence + 1, 5)
      : Math.max(existing.confidence - 1, 1),
    lastReviewed: getToday(),
    timesReviewed: existing.timesReviewed + 1,
  };

  await setJSON(KEYS.PHRASE_CONFIDENCE, data);
}

// ─── Onboarding ──────────────────────────────────

export async function hasOnboarded(): Promise<boolean> {
  return getJSON(KEYS.ONBOARDED, false);
}

export async function setOnboarded(): Promise<void> {
  await setJSON(KEYS.ONBOARDED, true);
}

// ─── Reset All Data ────────────────────────────────

export async function resetAllData(): Promise<void> {
  const allKeys = Object.values(KEYS);
  await AsyncStorage.multiRemove(allKeys);
}
