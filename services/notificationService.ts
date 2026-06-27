/**
 * Notification Service — daily phrase reminder.
 *
 * Schedules a single recurring local notification for 7pm each day. The
 * notification surfaces the phrase the learner is most due to review from
 * their currently selected level (Beginner / Intermediate / Expert),
 * falling back to a random phrase only when nothing is scheduled. When the
 * user changes level, call `scheduleDailyPhrase()` again — it cancels just
 * its own previously-scheduled notification (by a stable identifier) before
 * creating a new one, so it never disturbs other notification types.
 *
 * Local notifications work in Expo Go on SDK 53+. No Firebase required.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { phrasesForLevel, type Level, type Phrase } from '@/data/phrases';
import { getLevel, getPracticeState } from './storageService';
import { buildSessionQueue } from './srsService';

const DAILY_HOUR = 19;
const DAILY_MINUTE = 0;
const CHANNEL_ID = 'daily-phrase';
// Stable id so we cancel/replace only our own daily reminder.
const DAILY_NOTIFICATION_ID = 'hala-daily-phrase';

// In-foreground behaviour: show a banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Android 8+ groups notifications into user-manageable channels. Without a
 * named channel ours would appear as "Miscellaneous" in system settings.
 */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily phrase reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function ensurePermission(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    if (settings.canAskAgain === false) return false;
    const next = await Notifications.requestPermissionsAsync();
    return !!next.granted;
  } catch {
    return false;
  }
}

/**
 * Choose the phrase to surface. Prefers the head of the SRS session queue
 * (the phrase most due for review, then the next unseen phrase), so the
 * reminder reinforces what the learner actually needs — not a phrase they
 * already know cold. Falls back to a random phrase if the queue is empty.
 */
async function pickPhrase(level: Level): Promise<Phrase | null> {
  const pool = phrasesForLevel(level);
  if (pool.length === 0) return null;
  try {
    const state = await getPracticeState();
    const queue = buildSessionQueue(level, state, Date.now());
    if (queue.length > 0) return queue[0];
  } catch {
    /* fall through to random */
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Cancel our existing daily notification and schedule a fresh one for the
 * user's current level. Safe to call repeatedly.
 */
export async function scheduleDailyPhrase(): Promise<void> {
  try {
    const granted = await ensurePermission();
    if (!granted) return;

    await ensureAndroidChannel();
    // Cancel only our own reminder — leaves any other scheduled
    // notifications (e.g. future streak reminders) untouched.
    await Notifications.cancelScheduledNotificationAsync(
      DAILY_NOTIFICATION_ID
    ).catch(() => {});

    const level = await getLevel();
    const phrase = await pickPhrase(level);
    if (!phrase) return;

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_NOTIFICATION_ID,
      content: {
        title: `Today's phrase — ${phrase.transliteration}`,
        body: `${phrase.arabic}  •  ${phrase.english}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: DAILY_HOUR,
        minute: DAILY_MINUTE,
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    // Notifications are non-critical — never throw out of this function.
  }
}

/** Back-compat alias kept for the v2 import path. */
export const setupDailyWordNotification = scheduleDailyPhrase;
