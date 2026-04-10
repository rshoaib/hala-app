/**
 * Tests for Daily Challenge data
 * Validates question structure, coverage for all 7 days, and XP rewards
 */
import { dailyChallenges, type DailyChallenge, type ChallengeQuestion } from '@/data/dailyChallenges';

describe('Daily Challenges Data', () => {
  test('has exactly 7 challenges (one per day of week)', () => {
    expect(dailyChallenges).toHaveLength(7);
  });

  test('covers all 7 days of the week (0-6)', () => {
    const days = dailyChallenges.map((c) => c.dayOfWeek).sort();
    expect(days).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  test('all challenge IDs are unique', () => {
    const ids = dailyChallenges.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test.each(dailyChallenges.map((c) => [c.title, c]))('challenge "%s" has all required fields', (_title, challenge) => {
    const c = challenge as DailyChallenge;
    expect(c.id).toBeTruthy();
    expect(c.title).toBeTruthy();
    expect(c.emoji).toBeTruthy();
    expect(c.dayOfWeek).toBeGreaterThanOrEqual(0);
    expect(c.dayOfWeek).toBeLessThanOrEqual(6);
    expect(['translate', 'listen', 'arrange', 'fillBlank', 'match']).toContain(c.type);
  });

  test('all challenges have 60-second time limit', () => {
    for (const c of dailyChallenges) {
      expect(c.timeLimit).toBe(60);
    }
  });

  test('all challenges have at least 4 questions', () => {
    for (const c of dailyChallenges) {
      expect(c.questions.length).toBeGreaterThanOrEqual(4);
    }
  });

  test('all question IDs are unique across all challenges', () => {
    const allIds = dailyChallenges.flatMap((c) => c.questions.map((q) => q.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  test('all questions have valid structure', () => {
    const allQuestions = dailyChallenges.flatMap((c) => c.questions);
    for (const q of allQuestions) {
      expect(q.id).toBeTruthy();
      expect(q.prompt).toBeTruthy();
      expect(q.correctAnswer).toBeTruthy();
      expect(q.xpReward).toBeGreaterThan(0);
    }
  });

  test('questions with options include the correct answer', () => {
    const questionsWithOptions = dailyChallenges
      .flatMap((c) => c.questions)
      .filter((q) => q.options && q.options.length > 0);

    for (const q of questionsWithOptions) {
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  test('questions with options have exactly 4 choices', () => {
    const questionsWithOptions = dailyChallenges
      .flatMap((c) => c.questions)
      .filter((q) => q.options);

    for (const q of questionsWithOptions) {
      expect(q.options).toHaveLength(4);
    }
  });

  test('XP rewards are 10 or 15 per question', () => {
    const allQuestions = dailyChallenges.flatMap((c) => c.questions);
    for (const q of allQuestions) {
      expect([10, 15]).toContain(q.xpReward);
    }
  });

  test('total possible XP per day is between 40 and 75', () => {
    for (const c of dailyChallenges) {
      const totalXP = c.questions.reduce((sum, q) => sum + q.xpReward, 0);
      expect(totalXP).toBeGreaterThanOrEqual(40);
      expect(totalXP).toBeLessThanOrEqual(75);
    }
  });
});
