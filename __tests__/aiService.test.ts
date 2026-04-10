/**
 * Tests for AI Service and AI Configuration
 * Tests config structure, service exports, and error handling
 */

// Mock the Google Generative AI SDK
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn(),
      }),
    }),
  })),
}));

// Mock AsyncStorage (needed by storageService which aiService may call indirectly)
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
  },
}));

import { AI_CONFIG, SYSTEM_PROMPTS } from '@/constants/aiConfig';
import {
  isAIConfigured,
  startTutorChat,
  resetTutorChat,
  generateQuiz,
  generateBossQuestions,
  explainAnswer,
  type AIQuizQuestion,
} from '@/services/aiService';

// ─── AI Config ───────────────────────────────────────

describe('AI Configuration', () => {
  test('has a valid model name', () => {
    expect(AI_CONFIG.model).toBeTruthy();
    expect(typeof AI_CONFIG.model).toBe('string');
  });

  test('has a fallback model configured', () => {
    expect(AI_CONFIG.fallbackModel).toBeTruthy();
    expect(typeof AI_CONFIG.fallbackModel).toBe('string');
  });

  test('primary and fallback models are different', () => {
    expect(AI_CONFIG.model).not.toBe(AI_CONFIG.fallbackModel);
  });

  test('has reasonable maxTokens (256-4096)', () => {
    expect(AI_CONFIG.maxTokens).toBeGreaterThanOrEqual(256);
    expect(AI_CONFIG.maxTokens).toBeLessThanOrEqual(4096);
  });

  test('temperature is between 0 and 1', () => {
    expect(AI_CONFIG.temperature).toBeGreaterThanOrEqual(0);
    expect(AI_CONFIG.temperature).toBeLessThanOrEqual(1);
  });

  test('has an API key configured', () => {
    expect(AI_CONFIG.apiKey).toBeTruthy();
    expect(AI_CONFIG.apiKey).not.toBe('YOUR_GEMINI_API_KEY');
  });
});

// ─── System Prompts ──────────────────────────────────

describe('System Prompts', () => {
  test('has tutor prompt', () => {
    expect(SYSTEM_PROMPTS.tutor).toBeTruthy();
    expect(SYSTEM_PROMPTS.tutor.length).toBeGreaterThan(50);
  });

  test('tutor prompt mentions Emirati dialect', () => {
    expect(SYSTEM_PROMPTS.tutor.toLowerCase()).toContain('emirati');
  });

  test('has quiz generator prompt', () => {
    expect(SYSTEM_PROMPTS.quizGenerator).toBeTruthy();
    expect(SYSTEM_PROMPTS.quizGenerator.length).toBeGreaterThan(50);
  });

  test('quiz generator prompt mentions JSON format', () => {
    expect(SYSTEM_PROMPTS.quizGenerator.toLowerCase()).toContain('json');
  });

  test('has explainer prompt', () => {
    expect(SYSTEM_PROMPTS.explainer).toBeTruthy();
    expect(SYSTEM_PROMPTS.explainer.length).toBeGreaterThan(50);
  });

  test('explainer prompt is encouraging', () => {
    const lower = SYSTEM_PROMPTS.explainer.toLowerCase();
    expect(lower).toContain('encouraging');
  });
});

// ─── AI Service Exports ──────────────────────────────

describe('AI Service exports', () => {
  test('isAIConfigured is a function', () => {
    expect(typeof isAIConfigured).toBe('function');
  });

  test('isAIConfigured returns true when key is set', () => {
    expect(isAIConfigured()).toBe(true);
  });

  test('startTutorChat is a function', () => {
    expect(typeof startTutorChat).toBe('function');
  });

  test('resetTutorChat is a function', () => {
    expect(typeof resetTutorChat).toBe('function');
  });

  test('generateQuiz is a function', () => {
    expect(typeof generateQuiz).toBe('function');
  });

  test('generateBossQuestions is a function', () => {
    expect(typeof generateBossQuestions).toBe('function');
  });

  test('explainAnswer is a function', () => {
    expect(typeof explainAnswer).toBe('function');
  });

  test('startTutorChat does not throw', () => {
    expect(() => startTutorChat()).not.toThrow();
  });

  test('resetTutorChat does not throw', () => {
    expect(() => resetTutorChat()).not.toThrow();
  });
});

// ─── AIQuizQuestion Type Validation ──────────────────

describe('AIQuizQuestion type validation', () => {
  const validQuestion: AIQuizQuestion = {
    question: 'What does "هلا" mean?',
    options: ['Hello', 'Goodbye', 'Please', 'Sorry'],
    correctAnswer: 'Hello',
    explanation: 'هلا is the most common Emirati greeting.',
  };

  test('valid question has all required fields', () => {
    expect(validQuestion.question).toBeTruthy();
    expect(validQuestion.options).toHaveLength(4);
    expect(validQuestion.correctAnswer).toBeTruthy();
    expect(validQuestion.explanation).toBeTruthy();
  });

  test('correctAnswer is included in options', () => {
    expect(validQuestion.options).toContain(validQuestion.correctAnswer);
  });
});
