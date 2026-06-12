/**
 * SRS Service — spaced-recall scheduling for practice sessions.
 *
 * Pure logic only; persistence lives in storageService. Each phrase the
 * learner has answered carries a PracticeRecord: a `stage` indexing into
 * INTERVAL_DAYS and a `due` timestamp. Correct answers advance the stage
 * (longer interval); wrong answers reset it to the shortest one.
 *
 * Everything here is deterministic: question order follows the curriculum
 * (data order) and distractor/option order derives from a hash of the
 * phrase id — no Math.random. Sessions are reproducible for a given
 * state, which the Maestro E2E suite relies on.
 */
import { phrasesForLevel, type Level, type Phrase } from '@/data/phrases';

export interface PracticeRecord {
  /** Index into INTERVAL_DAYS — how far the phrase has progressed. */
  stage: number;
  /** Epoch ms after which the phrase is due for review. */
  due: number;
}

/** phraseId → record. Only phrases that have been answered appear. */
export type PracticeState = Record<string, PracticeRecord>;

export const SESSION_SIZE = 8;
export const OPTION_COUNT = 4;

/** Review interval per stage, in days. */
export const INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;

/** Stage at which a phrase counts as "in long-term memory" (≥ 7 days). */
const MEMORY_STAGE = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Deterministic ordering helpers ──────────────────────

/** FNV-1a 32-bit string hash. */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — tiny seeded PRNG; plenty for shuffling answer options. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates with a seeded PRNG; returns a new array. */
function seededShuffle<T>(items: readonly T[], seedKey: string): T[] {
  const rand = mulberry32(hashString(seedKey));
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── Session building ────────────────────────────────────

/**
 * Phrases to practice now: everything due for review (earliest first),
 * then unseen phrases in curriculum order, capped at SESSION_SIZE.
 */
export function buildSessionQueue(
  level: Level,
  state: PracticeState,
  now: number
): Phrase[] {
  const pool = phrasesForLevel(level);
  const due = pool
    .filter((p) => {
      const record = state[p.id];
      return record !== undefined && record.due <= now;
    })
    // Array.sort is stable, so equal due-dates keep curriculum order.
    .sort((a, b) => state[a.id]!.due - state[b.id]!.due);
  const fresh = pool.filter((p) => state[p.id] === undefined);
  return [...due, ...fresh].slice(0, SESSION_SIZE);
}

export interface QuestionOptions {
  /** English glosses in display order (OPTION_COUNT entries). */
  options: string[];
  /** Index into `options` of the right answer. */
  correctIndex: number;
}

/**
 * Answer options for a phrase: its English gloss plus three distractors
 * from the same level. Glosses are deduped — several phrases share one
 * English meaning (e.g. "How are you? (m)") — so options are always
 * distinct strings; the E2E suite taps options by exact text.
 */
export function buildOptions(phrase: Phrase, level: Level): QuestionOptions {
  const norm = (s: string) => s.trim().toLowerCase();
  const seen = new Set<string>([norm(phrase.english)]);
  const candidates: string[] = [];
  for (const p of phrasesForLevel(level)) {
    if (p.id === phrase.id) continue;
    const key = norm(p.english);
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(p.english);
  }
  const distractors = seededShuffle(candidates, `${phrase.id}:distractors`)
    .slice(0, OPTION_COUNT - 1);
  const options = seededShuffle(
    [phrase.english, ...distractors],
    `${phrase.id}:order`
  );
  return { options, correctIndex: options.indexOf(phrase.english) };
}

// ─── Grading ─────────────────────────────────────────────

/** Next record after an answer. Correct → next stage; wrong → restart. */
export function gradeAnswer(
  previous: PracticeRecord | undefined,
  correct: boolean,
  now: number
): PracticeRecord {
  const stage = correct
    ? Math.min((previous?.stage ?? -1) + 1, INTERVAL_DAYS.length - 1)
    : 0;
  return { stage, due: now + INTERVAL_DAYS[stage] * DAY_MS };
}

// ─── Counts (session summary) ────────────────────────────

/** Phrases of this level that have entered the practice rotation. */
export function countTracked(level: Level, state: PracticeState): number {
  return phrasesForLevel(level).filter((p) => state[p.id] !== undefined).length;
}

/** Phrases of this level the learner holds in long-term memory. */
export function countInMemory(level: Level, state: PracticeState): number {
  return phrasesForLevel(level).filter((p) => {
    const record = state[p.id];
    return record !== undefined && record.stage >= MEMORY_STAGE;
  }).length;
}
