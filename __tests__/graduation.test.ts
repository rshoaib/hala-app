/**
 * Tests for the level graduation helpers (services/srs.ts):
 *  - getGraduationQuiz samples from the right level only
 *  - Question IDs are namespaced mission::q so duplicates across missions
 *    don't collide in the answer map
 *  - graduationPassed enforces the 80% threshold, rejects 0/0
 */

// Mock AsyncStorage before importing srs
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

import {
  getGraduationQuiz,
  graduationPassed,
  GRADUATION_PASS_RATIO,
  GRADUATION_QUIZ_SIZE,
} from '@/services/srs';
import { missions } from '@/data/missions';

// ─── getGraduationQuiz ──────────────────────────

describe('getGraduationQuiz()', () => {
  test('returns up to GRADUATION_QUIZ_SIZE questions for level 1', () => {
    const q = getGraduationQuiz(1);
    expect(q.length).toBeGreaterThan(0);
    expect(q.length).toBeLessThanOrEqual(GRADUATION_QUIZ_SIZE);
  });

  test('respects the size argument when smaller than the pool', () => {
    const q = getGraduationQuiz(1, 3);
    expect(q.length).toBe(3);
  });

  test('returns an empty array for a level with no missions', () => {
    // Level 99 doesn't exist. Real empty bands today (A2/B1/B2) also have no
    // missions — same behavior — so the screen can show a friendly fallback.
    expect(getGraduationQuiz(99)).toEqual([]);
    expect(getGraduationQuiz(2)).toEqual([]); // A2 has 0 missions today
  });

  test('question IDs are namespaced as <missionId>::<localId>', () => {
    const q = getGraduationQuiz(1, GRADUATION_QUIZ_SIZE);
    const level1MissionIds = new Set(
      missions.filter((m) => m.level === 1).map((m) => m.id)
    );
    for (const item of q) {
      const [missionPart] = item.id.split('::');
      expect(level1MissionIds.has(missionPart)).toBe(true);
    }
  });

  test('all sampled questions belong to a real level-1 mission/question', () => {
    const q = getGraduationQuiz(1, GRADUATION_QUIZ_SIZE);
    for (const item of q) {
      const [missionId, localId] = item.id.split('::');
      const m = missions.find((m) => m.id === missionId);
      expect(m).toBeDefined();
      expect(m!.level).toBe(1);
      expect(m!.quiz.some((qq) => qq.id === localId)).toBe(true);
    }
  });

  test('sampled questions do not duplicate within one draw', () => {
    const q = getGraduationQuiz(1, GRADUATION_QUIZ_SIZE);
    const ids = q.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── graduationPassed ───────────────────────────

describe('graduationPassed()', () => {
  test(`threshold constant is ${GRADUATION_PASS_RATIO} (80%)`, () => {
    expect(GRADUATION_PASS_RATIO).toBe(0.8);
  });

  test('exactly at threshold is a pass', () => {
    // 8 / 10 = 0.8 -> pass
    expect(graduationPassed(8, 10)).toBe(true);
  });

  test('just under threshold is a fail', () => {
    expect(graduationPassed(7, 10)).toBe(false);
  });

  test('perfect score is a pass', () => {
    expect(graduationPassed(10, 10)).toBe(true);
  });

  test('zero score is a fail', () => {
    expect(graduationPassed(0, 10)).toBe(false);
  });

  test('0/0 defaults to fail (no quiz taken = not graduated)', () => {
    expect(graduationPassed(0, 0)).toBe(false);
  });

  test('odd totals round correctly', () => {
    // 4/5 = 0.8 -> pass
    expect(graduationPassed(4, 5)).toBe(true);
    // 3/5 = 0.6 -> fail
    expect(graduationPassed(3, 5)).toBe(false);
  });
});
