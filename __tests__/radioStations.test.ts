/**
 * Tests for Radio Stations data
 * Validates station structure, URLs, and difficulty labels
 */
import { radioStations, DIFFICULTY_LABELS, TOTAL_STATIONS, type RadioStation } from '@/data/radioStations';

describe('Radio Stations Data', () => {
  test('has at least 3 stations', () => {
    expect(radioStations.length).toBeGreaterThanOrEqual(3);
  });

  test('TOTAL_STATIONS matches array length', () => {
    expect(TOTAL_STATIONS).toBe(radioStations.length);
  });

  test('all station IDs are unique', () => {
    const ids = radioStations.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test.each(radioStations.map((s) => [s.name, s]))('station "%s" has all required fields', (_name, station) => {
    const s = station as RadioStation;
    expect(s.id).toBeTruthy();
    expect(s.name).toBeTruthy();
    expect(s.nameAr).toBeTruthy();
    expect(s.description).toBeTruthy();
    expect(s.emoji).toBeTruthy();
    expect(s.color).toBeTruthy();
    expect(s.streamUrl).toBeTruthy();
    expect(['quran', 'news', 'music']).toContain(s.category);
    expect(['beginner', 'intermediate', 'advanced']).toContain(s.difficulty);
  });

  test('all stream URLs are valid URLs', () => {
    for (const s of radioStations) {
      expect(s.streamUrl).toMatch(/^https?:\/\//);
    }
  });

  test('all colors are valid hex codes', () => {
    for (const s of radioStations) {
      expect(s.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  test('covers multiple difficulty levels', () => {
    const difficulties = new Set(radioStations.map((s) => s.difficulty));
    expect(difficulties.size).toBeGreaterThanOrEqual(2);
  });

  test('covers multiple categories', () => {
    const categories = new Set(radioStations.map((s) => s.category));
    expect(categories.size).toBeGreaterThanOrEqual(2);
  });
});

describe('Difficulty Labels', () => {
  test('has labels for all 3 difficulty levels', () => {
    expect(DIFFICULTY_LABELS.beginner).toBeDefined();
    expect(DIFFICULTY_LABELS.intermediate).toBeDefined();
    expect(DIFFICULTY_LABELS.advanced).toBeDefined();
  });

  test('each label has text, emoji, and color', () => {
    for (const key of ['beginner', 'intermediate', 'advanced'] as const) {
      const label = DIFFICULTY_LABELS[key];
      expect(label.label).toBeTruthy();
      expect(label.emoji).toBeTruthy();
      expect(label.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
