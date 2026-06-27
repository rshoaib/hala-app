/**
 * Speech Service — Text-to-Speech for Arabic pronunciation
 * Uses expo-speech for native TTS on iOS & Android.
 *
 * The app teaches Emirati Arabic, so we prefer the `ar-AE` (Gulf) voice
 * when the device ships one, falling back to the near-universally-available
 * `ar-SA` (Saudi) voice otherwise. The chosen locale is resolved once and
 * cached for the session.
 */
import * as Speech from 'expo-speech';

const PREFERRED_LANGUAGE = 'ar-AE';
const FALLBACK_LANGUAGE = 'ar-SA';

// Resolved lazily on first speak; cached for the rest of the session.
let resolvedLanguage: string | null = null;

/** Pick ar-AE if the device exposes a matching voice, else ar-SA. */
async function resolveArabicLanguage(): Promise<string> {
  if (resolvedLanguage) return resolvedLanguage;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const norm = (s: string) => s.replace('_', '-').toLowerCase();
    const hasEmirati = voices.some((v) => norm(v.language).startsWith('ar-ae'));
    resolvedLanguage = hasEmirati ? PREFERRED_LANGUAGE : FALLBACK_LANGUAGE;
  } catch {
    // Voice enumeration can fail on some platforms — fall back safely.
    resolvedLanguage = FALLBACK_LANGUAGE;
  }
  return resolvedLanguage;
}

/**
 * Speak an Arabic text using device TTS
 * @param text Arabic text to pronounce
 * @param rate Speech rate (0.5 = slow, 1.0 = normal)
 */
export async function speakArabic(text: string, rate: number = 0.75): Promise<void> {
  // Stop any ongoing speech first
  await stopSpeaking();

  const language = await resolveArabicLanguage();

  return new Promise((resolve) => {
    Speech.speak(text, {
      language,
      rate,
      pitch: 1.0,
      onDone: resolve,
      onError: () => resolve(), // Don't throw on TTS failure
      onStopped: () => resolve(),
    });
  });
}

/**
 * Check if TTS is currently speaking
 */
export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

/**
 * Stop any ongoing speech
 */
export async function stopSpeaking(): Promise<void> {
  const speaking = await Speech.isSpeakingAsync();
  if (speaking) {
    Speech.stop();
  }
}
