/**
 * Tests for Mission curriculum data
 * Validates structure, quiz questions, phrases, and level configuration
 */
import { missions, LEVELS, type Mission, type QuizQuestion } from '@/data/missions';

describe('Missions Data', () => {
  test('has 5 missions for Level 1', () => {
    const level1 = missions.filter((m) => m.level === 1);
    expect(level1).toHaveLength(5);
  });

  test('missions have sequential order from 1 to 5', () => {
    const orders = missions.map((m) => m.order).sort();
    expect(orders).toEqual([1, 2, 3, 4, 5]);
  });

  test('all mission IDs are unique', () => {
    const ids = missions.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test.each(missions.map((m) => [m.title, m]))('mission "%s" has all required fields', (_title, mission) => {
    const m = mission as Mission;
    expect(m.id).toBeTruthy();
    expect(m.title).toBeTruthy();
    expect(m.titleAr).toBeTruthy();
    expect(m.emoji).toBeTruthy();
    expect(m.description).toBeTruthy();
    expect(m.scenario).toBeTruthy();
    expect(m.level).toBeGreaterThan(0);
    expect(m.order).toBeGreaterThan(0);
    expect(m.xpReward).toBeGreaterThan(0);
  });

  test.each(missions.map((m) => [m.title, m]))('mission "%s" has at least 4 phrases', (_title, mission) => {
    const m = mission as Mission;
    expect(m.phrases.length).toBeGreaterThanOrEqual(4);
  });

  test.each(missions.map((m) => [m.title, m]))('mission "%s" has at least 3 quiz questions', (_title, mission) => {
    const m = mission as Mission;
    expect(m.quiz.length).toBeGreaterThanOrEqual(3);
  });

  test('all phrase IDs are unique across all missions', () => {
    const allPhraseIds = missions.flatMap((m) => m.phrases.map((p) => p.id));
    expect(new Set(allPhraseIds).size).toBe(allPhraseIds.length);
  });

  test('all phrases have required fields', () => {
    const allPhrases = missions.flatMap((m) => m.phrases);
    for (const p of allPhrases) {
      expect(p.id).toBeTruthy();
      expect(p.arabic).toBeTruthy();
      expect(p.transliteration).toBeTruthy();
      expect(p.english).toBeTruthy();
      expect(['greeting', 'question', 'response', 'vocab', 'expression']).toContain(p.category);
    }
  });

  test('all quiz questions have valid structure', () => {
    const allQuiz = missions.flatMap((m) => m.quiz);
    for (const q of allQuiz) {
      expect(q.id).toBeTruthy();
      expect(q.question).toBeTruthy();
      expect(q.correctAnswer).toBeTruthy();
      expect(['mcq', 'arrange', 'fillBlank', 'translate']).toContain(q.type);
    }
  });

  test('MCQ questions have options that include the correct answer', () => {
    const mcqQuestions = missions
      .flatMap((m) => m.quiz)
      .filter((q) => q.type === 'mcq' && q.options);

    for (const q of mcqQuestions) {
      expect(q.options).toBeDefined();
      expect(q.options!.length).toBeGreaterThanOrEqual(2);
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  test('MCQ questions have exactly 4 options', () => {
    const mcqQuestions = missions
      .flatMap((m) => m.quiz)
      .filter((q) => q.type === 'mcq' && q.options);

    for (const q of mcqQuestions) {
      expect(q.options).toHaveLength(4);
    }
  });

  test('XP rewards are reasonable (50-100 range)', () => {
    for (const m of missions) {
      expect(m.xpReward).toBeGreaterThanOrEqual(50);
      expect(m.xpReward).toBeLessThanOrEqual(100);
    }
  });

  test('each mission has exactly 10 phrases', () => {
    for (const m of missions) {
      expect(m.phrases).toHaveLength(10);
    }
  });
});

describe('Levels Configuration', () => {
  test('has 4 levels', () => {
    expect(LEVELS).toHaveLength(4);
  });

  test('only level 1 is unlocked by default', () => {
    expect(LEVELS[0].unlocked).toBe(true);
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].unlocked).toBe(false);
    }
  });

  test('levels have sequential IDs', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4]);
  });

  test('all levels have names in both languages', () => {
    for (const level of LEVELS) {
      expect(level.name).toBeTruthy();
      expect(level.nameAr).toBeTruthy();
    }
  });

  test('level 1 has 5 missions', () => {
    expect(LEVELS[0].missions).toBe(5);
  });
});
