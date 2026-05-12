/**
 * Tests for isLevelUnlocked — the pure gating function in data/missions.ts.
 *
 * Covers:
 *  - Level 1 (A1) is always unlocked
 *  - Placement-band shortcut (A2 placement unlocks L2; B1 unlocks L2+L3; etc.)
 *  - Completion path (N completed missions at L(n-1) unlocks Ln)
 *  - Locked when neither condition holds
 *  - Bogus level IDs are locked
 */

import {
  isLevelUnlocked,
  MIN_COMPLETED_TO_UNLOCK,
  missions,
} from '@/data/missions';

// Real mission IDs at each level (today all 5 are L1).
const L1_MISSION_IDS = missions.filter((m) => m.level === 1).map((m) => m.id);

describe('isLevelUnlocked()', () => {
  test('Level 1 is always unlocked, regardless of inputs', () => {
    expect(isLevelUnlocked(1)).toBe(true);
    expect(isLevelUnlocked(1, {})).toBe(true);
    expect(isLevelUnlocked(1, { placementBand: null })).toBe(true);
    expect(isLevelUnlocked(1, { placementBand: 'Pre-A1' })).toBe(true);
    expect(isLevelUnlocked(1, { completedMissionIds: [] })).toBe(true);
  });

  test('Level 2 (A2) locked for beginners with no progress', () => {
    expect(isLevelUnlocked(2)).toBe(false);
    expect(isLevelUnlocked(2, { placementBand: 'Pre-A1' })).toBe(false);
    expect(isLevelUnlocked(2, { placementBand: 'A1' })).toBe(false);
    expect(isLevelUnlocked(2, { placementBand: 'A1+' })).toBe(false); // A1+ rank 2 < A2 rank 3
  });

  test('Level 2 unlocked by A2+ placement or higher', () => {
    expect(isLevelUnlocked(2, { placementBand: 'A2' })).toBe(true);
    expect(isLevelUnlocked(2, { placementBand: 'A2+' })).toBe(true);
    expect(isLevelUnlocked(2, { placementBand: 'B1' })).toBe(true);
    expect(isLevelUnlocked(2, { placementBand: 'B2' })).toBe(true);
  });

  test('Level 2 unlocked by MIN_COMPLETED_TO_UNLOCK completed A1 missions', () => {
    // Exactly the threshold.
    const atThreshold = L1_MISSION_IDS.slice(0, MIN_COMPLETED_TO_UNLOCK);
    expect(atThreshold.length).toBe(MIN_COMPLETED_TO_UNLOCK);
    expect(
      isLevelUnlocked(2, { completedMissionIds: atThreshold })
    ).toBe(true);
  });

  test('Level 2 stays locked when under the completion threshold', () => {
    const under = L1_MISSION_IDS.slice(0, MIN_COMPLETED_TO_UNLOCK - 1);
    expect(
      isLevelUnlocked(2, { completedMissionIds: under })
    ).toBe(false);
  });

  test('Completions at unrelated levels don\'t unlock L2', () => {
    // Simulate completing some fictional L3 missions — should NOT unlock L2,
    // since the gate looks specifically at the *previous* level (L1).
    expect(
      isLevelUnlocked(2, {
        completedMissionIds: ['fake-l3-a', 'fake-l3-b', 'fake-l3-c'],
      })
    ).toBe(false);
  });

  test('Set and array both accepted for completedMissionIds', () => {
    const asArray = L1_MISSION_IDS.slice(0, MIN_COMPLETED_TO_UNLOCK);
    const asSet = new Set(asArray);
    expect(isLevelUnlocked(2, { completedMissionIds: asArray })).toBe(true);
    expect(isLevelUnlocked(2, { completedMissionIds: asSet })).toBe(true);
  });

  test('Level 3 (B1) requires B1 placement or full A2 progress', () => {
    expect(isLevelUnlocked(3, { placementBand: 'A2+' })).toBe(false);
    expect(isLevelUnlocked(3, { placementBand: 'B1' })).toBe(true);
    expect(isLevelUnlocked(3, { placementBand: 'B2' })).toBe(true);
  });

  test('Level 4 (B2) requires B2 placement', () => {
    expect(isLevelUnlocked(4, { placementBand: 'B1+' })).toBe(false);
    expect(isLevelUnlocked(4, { placementBand: 'B2' })).toBe(true);
  });

  test('Unknown level IDs are locked', () => {
    expect(isLevelUnlocked(99)).toBe(false);
    expect(isLevelUnlocked(0)).toBe(false);
    expect(isLevelUnlocked(-1)).toBe(false);
  });
});
