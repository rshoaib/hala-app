/**
 * Notification Service — daily phrase reminder.
 *
 * Schedules a single recurring local notification for 7pm each day. The
 * notification surfaces a randomly-picked phrase from the user's currently
 * selected level (Beginner / Intermediate / Expert). When the user changes
 * level, call `scheduleDailyPhrase()` again — it cancels the old schedule
 * before creating a new one.
 *
 * Local notifications work in Expo Go on SDK 53+. No Firebase required.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { phrasesForLevel, type Level } from '@/data/phrases';
import { getLevel } from './storageService';

const DAILY_HOUR = 19;
const DAILY_MINUTE = 0;
const CHANNEL_ID = 'daily-phrase';

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

function pickPhrase(level: Level) {
  const pool = phrasesForLevel(level);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Cancel any existing scheduled notifications and schedule a fresh
 * daily one for the user's current level. Safe to call repeatedly.
 */
export async function scheduleDailyPhrase(): Promise<void> {
  try {
    const granted = await ensurePermission();
    if (!granted) return;

    await ensureAndroidChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();

    const level = await getLevel();
    const phrase = pickPhrase(level);
    if (!phrase) return;

    await Notifications.scheduleNotificationAsync({
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
