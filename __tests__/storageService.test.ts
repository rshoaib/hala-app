/**
 * Tests for Storage Service
 * Tests pure functions (getLevel) and AsyncStorage-backed functions
 */

// Mock AsyncStorage before importing the service
const mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: jest.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach((k) => delete mockStorage[k]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockStorage))),
  },
}));

import * as Storage from '@/services/storageService';

beforeEach(() => {
  // Clear mock storage before each test
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  jest.clearAllMocks();
});

// ─── getLevel() — Pure Function ──────────────────────

describe('getLevel()', () => {
  test('0 XP = level 1, progress 0', () => {
    const result = Storage.getLevel(0);
    expect(result.level).toBe(1);
    expect(result.currentXP).toBe(0);
    expect(result.progress).toBe(0);
  });

  test('50 XP = level 1, halfway to level 2', () => {
    const result = Storage.getLevel(50);
    expect(result.level).toBe(1);
    expect(result.currentXP).toBe(50);
    expect(result.nextLevelXP).toBe(100);
    expect(result.progress).toBe(0.5);
  });

  test('100 XP = level 2', () => {
    const result = Storage.getLevel(100);
    expect(result.level).toBe(2);
    expect(result.currentXP).toBe(0);
  });

  test('200 XP = level 2, progress into level 3', () => {
    const result = Storage.getLevel(200);
    expect(result.level).toBe(2);
    expect(result.currentXP).toBe(100);
    expect(result.nextLevelXP).toBe(200); // 300 - 100
    expect(result.progress).toBe(0.5);
  });

  test('300 XP = level 3', () => {
    const result = Storage.getLevel(300);
    expect(result.level).toBe(3);
  });

  test('600 XP = level 4', () => {
    const result = Storage.getLevel(600);
    expect(result.level).toBe(4);
  });

  test('1000 XP = level 5', () => {
    const result = Storage.getLevel(1000);
    expect(result.level).toBe(5);
  });

  test('10000 XP = max level 12', () => {
    const result = Storage.getLevel(10000);
    expect(result.level).toBe(12);
    expect(result.progress).toBe(1.0);
  });

  test('99999 XP = still max level 12', () => {
    const result = Storage.getLevel(99999);
    expect(result.level).toBe(12);
    expect(result.progress).toBe(1.0);
  });

  test('level boundaries are correct', () => {
    // Just below level 2 threshold
    expect(Storage.getLevel(99).level).toBe(1);
    // Exactly at level 2 threshold
    expect(Storage.getLevel(100).level).toBe(2);
    // Just below level 3
    expect(Storage.getLevel(299).level).toBe(2);
    // Exactly at level 3
    expect(Storage.getLevel(300).level).toBe(3);
  });

  test('progress is always between 0 and 1', () => {
    for (const xp of [0, 1, 50, 99, 100, 500, 1000, 5000, 10000, 50000]) {
      const result = Storage.getLevel(xp);
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(1);
    }
  });

  test('nextLevelXP is always positive', () => {
    for (const xp of [0, 100, 1000, 10000, 99999]) {
      const result = Storage.getLevel(xp);
      expect(result.nextLevelXP).toBeGreaterThan(0);
    }
  });
});

// ─── XP Functions ────────────────────────────────────

describe('XP functions', () => {
  test('getXP returns 0 when no XP stored', async () => {
    const xp = await Storage.getXP();
    expect(xp).toBe(0);
  });

  test('addXP adds to current XP and returns new total', async () => {
    const result = await Storage.addXP(50);
    expect(result).toBe(50);

    const result2 = await Storage.addXP(30);
    expect(result2).toBe(80);
  });

  test('addXP accumulates correctly', async () => {
    await Storage.addXP(10);
    await Storage.addXP(20);
    await Storage.addXP(30);
    const total = await Storage.getXP();
    expect(total).toBe(60);
  });
});

// ─── Coins Functions ─────────────────────────────────

describe('Coins functions', () => {
  test('getCoins returns 0 when no coins stored', async () => {
    const coins = await Storage.getCoins();
    expect(coins).toBe(0);
  });

  test('addCoins adds to current coins', async () => {
    const result = await Storage.addCoins(100);
    expect(result).toBe(100);

    const result2 = await Storage.addCoins(50);
    expect(result2).toBe(150);
  });
});

// ─── Completed Missions ──────────────────────────────

describe('Mission completion', () => {
  test('getCompletedMissions returns empty array by default', async () => {
    const missions = await Storage.getCompletedMissions();
    expect(missions).toEqual([]);
  });

  test('completeMission adds mission ID to list', async () => {
    await Storage.completeMission('mission-1');
    const missions = await Storage.getCompletedMissions();
    expect(missions).toContain('mission-1');
  });

  test('completeMission does not add duplicates', async () => {
    await Storage.completeMission('mission-1');
    await Storage.completeMission('mission-1');
    const missions = await Storage.getCompletedMissions();
    expect(missions.filter((m) => m === 'mission-1')).toHaveLength(1);
  });

  test('multiple missions can be completed', async () => {
    await Storage.completeMission('mission-1');
    await Storage.completeMission('mission-2');
    await Storage.completeMission('mission-3');
    const missions = await Storage.getCompletedMissions();
    expect(missions).toHaveLength(3);
    expect(missions).toContain('mission-1');
    expect(missions).toContain('mission-2');
    expect(missions).toContain('mission-3');
  });
});

// ─── Alphabet Progress ───────────────────────────────

describe('Alphabet progress', () => {
  test('getAlphabetProgress returns empty array by default', async () => {
    const progress = await Storage.getAlphabetProgress();
    expect(progress).toEqual([]);
  });

  test('markLetterLearned adds letter ID', async () => {
    await Storage.markLetterLearned(1);
    const progress = await Storage.getAlphabetProgress();
    expect(progress).toContain(1);
  });

  test('markLetterLearned does not add duplicates', async () => {
    await Storage.markLetterLearned(5);
    await Storage.markLetterLearned(5);
    const progress = await Storage.getAlphabetProgress();
    expect(progress.filter((id) => id === 5)).toHaveLength(1);
  });
});

// ─── Daily Challenge ─────────────────────────────────

describe('Daily challenge', () => {
  test('getDailyChallengeRecord returns defaults', async () => {
    const record = await Storage.getDailyChallengeRecord();
    expect(record.totalCompleted).toBe(0);
    expect(record.lastCompletedDate).toBe('');
  });

  test('completeDailyChallenge updates record', async () => {
    await Storage.completeDailyChallenge();
    const record = await Storage.getDailyChallengeRecord();
    expect(record.totalCompleted).toBe(1);
    expect(record.lastCompletedDate).toBe(new Date().toISOString().split('T')[0]);
  });
});

// ─── Listening Stats ─────────────────────────────────

describe('Listening stats', () => {
  test('getListeningStats returns defaults', async () => {
    const stats = await Storage.getListeningStats();
    expect(stats.totalMinutes).toBe(0);
    expect(stats.weeklyMinutes).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  test('addListeningMinutes increases total', async () => {
    await Storage.addListeningMinutes(15);
    const stats = await Storage.getListeningStats();
    expect(stats.totalMinutes).toBe(15);
  });

  test('addListeningMinutes accumulates', async () => {
    await Storage.addListeningMinutes(10);
    await Storage.addListeningMinutes(20);
    const stats = await Storage.getListeningStats();
    expect(stats.totalMinutes).toBe(30);
  });
});

// ─── Onboarding ──────────────────────────────────────

describe('Onboarding', () => {
  test('hasOnboarded returns false by default', async () => {
    expect(await Storage.hasOnboarded()).toBe(false);
  });

  test('setOnboarded sets flag to true', async () => {
    await Storage.setOnboarded();
    expect(await Storage.hasOnboarded()).toBe(true);
  });
});

// ─── Daily Goal ──────────────────────────────────────

describe('Daily goal', () => {
  test('getDailyGoal returns 50 by default', async () => {
    const goal = await Storage.getDailyGoal();
    expect(goal).toBe(50);
  });

  test('setDailyGoal updates the goal', async () => {
    await Storage.setDailyGoal(100);
    const goal = await Storage.getDailyGoal();
    expect(goal).toBe(100);
  });
});

// ─── Streak ──────────────────────────────────────────

describe('Streak', () => {
  test('getStreak returns default values', async () => {
    const streak = await Storage.getStreak();
    expect(streak.currentStreak).toBe(0);
    expect(streak.longestStreak).toBe(0);
    expect(streak.freezesAvailable).toBe(0);
    expect(streak.totalDaysActive).toBe(0);
  });

  test('recordActivity starts a streak on first call', async () => {
    const streak = await Storage.recordActivity();
    expect(streak.currentStreak).toBe(1);
    expect(streak.totalDaysActive).toBe(1);
    expect(streak.lastActiveDate).toBe(new Date().toISOString().split('T')[0]);
  });

  test('recordActivity on same day returns same streak', async () => {
    const first = await Storage.recordActivity();
    const second = await Storage.recordActivity();
    expect(second.currentStreak).toBe(first.currentStreak);
    expect(second.totalDaysActive).toBe(first.totalDaysActive);
  });

  test('addStreakFreeze increases freeze count', async () => {
    const before = await Storage.getStreak();
    await Storage.addStreakFreeze();
    const after = await Storage.getStreak();
    expect(after.freezesAvailable).toBe(before.freezesAvailable + 1);
  });
});
