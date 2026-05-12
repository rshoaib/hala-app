/**
 * Tests for Storage Service — v2.0
 * Covers the pruned surface: XP, level, streak, daily goal, onboarding, reset.
 * Features removed in v2.0 (coins, missions, alphabet progress, daily challenge,
 * listening stats, manual freeze purchase) are no longer tested.
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
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  jest.clearAllMocks();
});

// ─── getLevel() — Pure Function ──────────────────────
// v2.0 thresholds: [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500]
// Max level = 10 ("Arabic Master")

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

  test('200 XP = level 2, halfway to level 3', () => {
    const result = Storage.getLevel(200);
    expect(result.level).toBe(2);
    expect(result.currentXP).toBe(100);
    expect(result.nextLevelXP).toBe(200); // 300 - 100
    expect(result.progress).toBe(0.5);
  });

  test('300 XP = level 3', () => {
    expect(Storage.getLevel(300).level).toBe(3);
  });

  test('600 XP = level 4', () => {
    expect(Storage.getLevel(600).level).toBe(4);
  });

  test('1000 XP = level 5', () => {
    expect(Storage.getLevel(1000).level).toBe(5);
  });

  test('7500 XP = max level 11', () => {
    const result = Storage.getLevel(7500);
    expect(result.level).toBe(11);
    expect(result.progress).toBe(1.0);
  });

  test('99999 XP = still max level 11', () => {
    const result = Storage.getLevel(99999);
    expect(result.level).toBe(11);
    expect(result.progress).toBe(1.0);
  });

  test('level boundaries are correct', () => {
    expect(Storage.getLevel(99).level).toBe(1);
    expect(Storage.getLevel(100).level).toBe(2);
    expect(Storage.getLevel(299).level).toBe(2);
    expect(Storage.getLevel(300).level).toBe(3);
  });

  test('level title is returned', () => {
    expect(Storage.getLevel(0).title).toBe('Newcomer');
    expect(Storage.getLevel(7500).title).toBe('Arabic Master');
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
    expect(await Storage.getXP()).toBe(0);
  });

  test('addXP adds to current XP and returns new total', async () => {
    expect(await Storage.addXP(50)).toBe(50);
    expect(await Storage.addXP(30)).toBe(80);
  });

  test('addXP accumulates correctly', async () => {
    await Storage.addXP(10);
    await Storage.addXP(20);
    await Storage.addXP(30);
    expect(await Storage.getXP()).toBe(60);
  });

  test('addXP also tracks daily XP for today', async () => {
    await Storage.addXP(25);
    const daily = await Storage.getDailyXP();
    expect(daily.xp).toBe(25);
    expect(daily.date).toBe(new Date().toISOString().split('T')[0]);
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
  test('getDailyGoal returns 12 cards by default', async () => {
    expect(await Storage.getDailyGoal()).toBe(12);
  });

  test('setDailyGoal updates the goal', async () => {
    await Storage.setDailyGoal(20);
    expect(await Storage.getDailyGoal()).toBe(20);
  });
});

// ─── Streak ──────────────────────────────────────────

describe('Streak', () => {
  test('getStreak returns default values (1 starter freeze)', async () => {
    const streak = await Storage.getStreak();
    expect(streak.currentStreak).toBe(0);
    expect(streak.longestStreak).toBe(0);
    expect(streak.freezesAvailable).toBe(1);
    expect(streak.totalDaysActive).toBe(0);
  });

  test('recordActivity starts a streak on first call', async () => {
    const streak = await Storage.recordActivity();
    expect(streak.currentStreak).toBe(1);
    expect(streak.totalDaysActive).toBe(1);
    expect(streak.lastActiveDate).toBe(new Date().toISOString().split('T')[0]);
  });

  test('recordActivity on same day is idempotent', async () => {
    const first = await Storage.recordActivity();
    const second = await Storage.recordActivity();
    expect(second.currentStreak).toBe(first.currentStreak);
    expect(second.totalDaysActive).toBe(first.totalDaysActive);
  });
});

// ─── Weekly Activity ─────────────────────────────────

describe('Weekly activity', () => {
  test('getWeeklyActivity returns empty object by default', async () => {
    expect(await Storage.getWeeklyActivity()).toEqual({});
  });

  test('recordActivity populates today in weekly activity', async () => {
    await Storage.recordActivity();
    const activity = await Storage.getWeeklyActivity();
    const today = new Date().toISOString().split('T')[0];
    expect(activity[today]).toBeGreaterThanOrEqual(1);
  });
});

// ─── Reset ───────────────────────────────────────────

describe('resetAllData', () => {
  test('clears XP, streak, goal, onboarded', async () => {
    await Storage.addXP(100);
    await Storage.recordActivity();
    await Storage.setDailyGoal(20);
    await Storage.setOnboarded();

    await Storage.resetAllData();

    expect(await Storage.getXP()).toBe(0);
    expect((await Storage.getStreak()).currentStreak).toBe(0);
    expect(await Storage.getDailyGoal()).toBe(12);
    expect(await Storage.hasOnboarded()).toBe(false);
  });
});
