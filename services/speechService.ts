/**
 * Speech Service — Text-to-Speech for Arabic pronunciation
 * Uses expo-speech for native TTS on iOS & Android
 */
import * as Speech from 'expo-speech';

/**
 * Speak an Arabic text using device TTS
 * @param text Arabic text to pronounce
 * @param rate Speech rate (0.5 = slow, 1.0 = normal)
 */
export async function speakArabic(text: string, rate: number = 0.75): Promise<void> {
  // Stop any ongoing speech first
  await stopSpeaking();

  return new Promise((resolve) => {
    Speech.speak(text, {
      language: 'ar-SA',    // Saudi Arabic (widely supported)
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
