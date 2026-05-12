/**
 * Tests for the CEFR band filter that gates new-card draws in srs.ts.
 * Verifies:
 *  - bandCapRank mapping for every stored band (and null/unknown fallback)
 *  - phraseEligibleForBand for both mission phrases (filtered) and extras (always pass)
 *  - buildTodaysQueue with an empty state respects the band cap on new-card draws
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
  bandCapRank,
  phraseEligibleForBand,
  buildTodaysQueue,
  __resetPhraseBandCache,
} from '@/services/srs';
import { missions } from '@/data/missions';
import { extraPhrases } from '@/data/phrases';

beforeEach(() => {
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  __resetPhraseBandCache();
  jest.clearAllMocks();
});

// ─── bandCapRank ──────────────────────────────────

describe('bandCapRank()', () => {
  test('null → A1 cap (rank 1) — conservative for unknown learners', () => {
    // Unknown / skipped placement = cap at A1 (rank 1). This is stricter
    // than an explicit A1 placement (which gets A1+) because we have no
    // evidence the learner actually knows A1 material yet.
    expect(bandCapRank(null)).toBe(1);
    expect(bandCapRank(undefined)).toBe(1);
  });

  test('Pre-A1 → A1 cap (rank 1)', () => {
    expect(bandCapRank('Pre-A1')).toBe(1);
  });

  test('A1 placement → A1+ cap (rank 2)', () => {
    expect(bandCapRank('A1')).toBe(2);
  });

  test('A2 placement → A2+ cap (rank 4)', () => {
    expect(bandCapRank('A2')).toBe(4);
  });

  test('B1 placement → B1+ cap (rank 6)', () => {
    expect(bandCapRank('B1')).toBe(6);
  });

  test('B2 placement → clamped to B2 (rank 7)', () => {
    // Already at top band — no step-up possible.
    expect(bandCapRank('B2')).toBe(7);
  });
});

// ─── phraseEligibleForBand ────────────────────────

describe('phraseEligibleForBand()', () => {
  test('known A1 mission phrase (g1) is eligible for every band', () => {
    // g1 lives in mission-1-greetings which is level 1 (A1).
    // Every band's cap is >= A1, so g1 is always drawable as a new card.
    expect(phraseEligibleForBand('g1', null)).toBe(true);
    expect(phraseEligibleForBand('g1', 'Pre-A1')).toBe(true);
    expect(phraseEligibleForBand('g1', 'A1')).toBe(true);
    expect(phraseEligibleForBand('g1', 'A2')).toBe(true);
    expect(phraseEligibleForBand('g1', 'B1')).toBe(true);
    expect(phraseEligibleForBand('g1', 'B2')).toBe(true);
  });

  test('extras (non-mission phrases) are eligible for every band', () => {
    // Extras have no mission membership → treated as band-agnostic.
    // Pick an extra that isn't also a mission phrase ID.
    const extra = extraPhrases.find(
      (p) => !missions.some((m) => m.phrases.some((mp) => mp.id === p.id))
    );
    expect(extra).toBeDefined();
    const id = extra!.id;
    expect(phraseEligibleForBand(id, null)).toBe(true);
    expect(phraseEligibleForBand(id, 'Pre-A1')).toBe(true);
    expect(phraseEligibleForBand(id, 'B2')).toBe(true);
  });

  test('unknown phrase ID is treated as extras (always eligible)', () => {
    expect(phraseEligibleForBand('no-such-id', null)).toBe(true);
    expect(phraseEligibleForBand('no-such-id', 'Pre-A1')).toBe(true);
  });
});

// ─── buildTodaysQueue with band ───────────────────

describe('buildTodaysQueue() with band filter', () => {
  test('empty state + band="A1" returns up to `newCards` cards, all band-eligible', async () => {
    const q = await buildTodaysQueue({ band: 'A1', newCards: 5, review: 0 });
    expect(q.length).toBeGreaterThan(0);
    expect(q.length).toBeLessThanOrEqual(5);
    for (const card of q) {
      expect(phraseEligibleForBand(card.id, 'A1')).toBe(true);
    }
  });

  test('empty state + band=null defaults to A1+ cap — new cards all eligible', async () => {
    // No stored placement band = conservative cap at A1+.
    const q = await buildTodaysQueue({ band: null, newCards: 5, review: 0 });
    for (const card of q) {
      expect(phraseEligibleForBand(card.id, null)).toBe(true);
    }
  });

  test('mission mode ignores band filter (walks every phrase in the mission)', async () => {
    const first = missions[0];
    const q = await buildTodaysQueue({ missionId: first.id, band: 'Pre-A1' });
    // Mission mode returns all phrases in the mission regardless of band.
    expect(q.length).toBe(first.phrases.length);
  });
});
