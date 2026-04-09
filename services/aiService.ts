/**
 * AI Service — Gemini-powered language learning features
 * Uses Google Generative AI SDK for:
 * 1. Arabic Tutor Chat
 * 2. Adaptive Quiz Generation
 * 3. Smart Wrong-Answer Explanations
 *
 * Includes automatic retry with exponential backoff and
 * auto-reset of stale chat sessions for reliability.
 */
import { GoogleGenerativeAI, type ChatSession } from '@google/generative-ai';
import { AI_CONFIG, SYSTEM_PROMPTS } from '@/constants/aiConfig';

let genAI: GoogleGenerativeAI | null = null;
let tutorChat: ChatSession | null = null;

// ─────────────────────────────────────────
// RETRY HELPER — exponential backoff
// ─────────────────────────────────────────

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s

function isRetryableError(error: any): boolean {
  const msg = (error?.message || error?.toString() || '').toLowerCase();
  const status = error?.status || error?.httpStatusCode || 0;

  // Rate limit, server errors, network failures
  if (status === 429 || status === 503 || status === 500) return true;
  if (msg.includes('quota') || msg.includes('rate') || msg.includes('limit')) return true;
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('econnreset')) return true;
  if (msg.includes('unavailable') || msg.includes('deadline') || msg.includes('timeout')) return true;
  return false;
}

// Track whether we've fallen back to the alternate model
let usingFallback = false;

function getModelName(): string {
  if (usingFallback && AI_CONFIG.fallbackModel) {
    return AI_CONFIG.fallbackModel;
  }
  return AI_CONFIG.model;
}

function isStaleChatError(error: any): boolean {
  const msg = (error?.message || error?.toString() || '').toLowerCase();
  if (msg.includes('context') || msg.includes('token') || msg.includes('too long')) return true;
  if (msg.includes('invalid') && msg.includes('history')) return true;
  return false;
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error?.message === 'GEMINI_API_KEY_NOT_SET') throw error;

      // On first 503/unavailable, try switching to fallback model
      if (attempt === 0 && !usingFallback && AI_CONFIG.fallbackModel && isRetryableError(error)) {
        console.warn(`${label}: Primary model unavailable, switching to fallback`);
        usingFallback = true;
        continue;
      }

      if (isRetryableError(error) && attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`${label}: Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`, error?.message);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// ─────────────────────────────────────────
// CLIENT
// ─────────────────────────────────────────

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const key = AI_CONFIG.apiKey as string;
    if (!key || key === 'YOUR_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY_NOT_SET');
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

// ─────────────────────────────────────────
// 1. AI TUTOR CHAT
// ─────────────────────────────────────────

/**
 * Start a new tutor conversation
 */
export function startTutorChat(): void {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: getModelName(),
    systemInstruction: SYSTEM_PROMPTS.tutor,
    generationConfig: {
      maxOutputTokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
    },
  });

  tutorChat = model.startChat({
    history: [],
  });
}

/**
 * Send a message to the AI tutor and get a response.
 * Retries on transient errors and auto-resets stale sessions.
 */
export async function sendTutorMessage(message: string): Promise<string> {
  try {
    return await withRetry(async () => {
      if (!tutorChat) {
        startTutorChat();
      }

      try {
        const result = await tutorChat!.sendMessage(message);
        return result.response.text();
      } catch (chatError: any) {
        // If the chat session is stale/context exceeded, reset and retry
        if (isStaleChatError(chatError)) {
          console.warn('Tutor: Chat session stale, resetting...');
          tutorChat = null;
          startTutorChat();
          const result = await tutorChat!.sendMessage(message);
          return result.response.text();
        }
        throw chatError;
      }
    }, 'Tutor');
  } catch (error: any) {
    if (error?.message === 'GEMINI_API_KEY_NOT_SET') {
      return '⚠️ Please set your Gemini API key in Settings to use AI features.';
    }
    console.error('Tutor error:', error);

    const msg = (error?.message || '').toLowerCase();
    console.error('Tutor full error:', JSON.stringify(error, null, 2));
    if (msg.includes('quota') || msg.includes('rate') || msg.includes('limit')) {
      return '⏳ AI is a bit busy right now. Please try again in a moment!';
    }
    if (msg.includes('not found') || msg.includes('model')) {
      return '⚠️ AI model not available. Please check Settings.';
    }
    return '😅 Sorry, I had a hiccup. Please try again!';
  }
}

/**
 * Reset the tutor conversation
 */
export function resetTutorChat(): void {
  tutorChat = null;
}

// ─────────────────────────────────────────
// 2. AI QUIZ GENERATION
// ─────────────────────────────────────────

export interface AIQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

/**
 * Generate adaptive quiz questions based on phrases the user has learned.
 * Retries on transient errors.
 */
export async function generateQuiz(
  phrases: { arabic: string; english: string; transliteration: string }[],
  count: number = 5
): Promise<AIQuizQuestion[]> {
  try {
    return await withRetry(async () => {
      const client = getClient();
      const model = client.getGenerativeModel({
        model: getModelName(),
        systemInstruction: SYSTEM_PROMPTS.quizGenerator,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.8,
        },
      });

      const phraseSample = phrases
        .sort(() => 0.5 - Math.random())
        .slice(0, 10)
        .map((p) => `${p.arabic} (${p.transliteration}) = ${p.english}`)
        .join('\n');

      const prompt = `Generate exactly ${count} quiz questions using these Emirati Arabic phrases the student has learned:\n\n${phraseSample}\n\nReturn ONLY a valid JSON array of objects. No markdown code blocks, no explanation.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Parse JSON — handle markdown code blocks
      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const questions: AIQuizQuestion[] = JSON.parse(jsonStr);

      // Validate structure
      return questions
        .filter(
          (q) =>
            q.question &&
            Array.isArray(q.options) &&
            q.options.length >= 2 &&
            q.correctAnswer &&
            q.options.includes(q.correctAnswer)
        )
        .slice(0, count);
    }, 'Quiz');
  } catch (error: any) {
    if (error?.message === 'GEMINI_API_KEY_NOT_SET') {
      throw error;
    }
    console.error('Quiz generation error:', error);
    return [];
  }
}

// ─────────────────────────────────────────
// 3. SMART EXPLANATIONS
// ─────────────────────────────────────────

/**
 * Generate an explanation for why a quiz answer is correct.
 * Retries on transient errors.
 */
export async function explainAnswer(
  question: string,
  correctAnswer: string,
  userAnswer: string,
): Promise<string> {
  try {
    return await withRetry(async () => {
      const client = getClient();
      const model = client.getGenerativeModel({
        model: getModelName(),
        systemInstruction: SYSTEM_PROMPTS.explainer,
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.6,
        },
      });

      const prompt = `Question: "${question}"
The student answered: "${userAnswer}"
The correct answer is: "${correctAnswer}"

Explain why "${correctAnswer}" is correct in 2-3 short sentences.`;

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    }, 'Explainer');
  } catch (error: any) {
    if (error?.message === 'GEMINI_API_KEY_NOT_SET') {
      return '💡 Set your Gemini API key in Settings to get AI explanations!';
    }
    console.error('Explain error:', error);
    return '';
  }
}

/**
 * Check if the API key is configured
 */
export function isAIConfigured(): boolean {
  const key = AI_CONFIG.apiKey as string;
  return key !== 'YOUR_GEMINI_API_KEY' && key.length > 0;
}
