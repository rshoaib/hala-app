/**
 * Notification Service — Daily word notifications
 * Safely handles missing expo-notifications in Expo Go
 */
import { Platform } from 'react-native';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // expo-notifications not available in Expo Go
}

const WORDS = [
  { arabic: 'مرحبا', transliteration: 'marhaba', eng: 'Hello / Welcome' },
  { arabic: 'شخبارك', transliteration: 'shakhbarak', eng: 'How are you?' },
  { arabic: 'مشكور', transliteration: 'mashkoor', eng: 'Thank you' },
  { arabic: 'زين', transliteration: 'zain', eng: 'Good / Okay' },
  { arabic: 'وايد', transliteration: 'wayid', eng: 'A lot / Very' },
  { arabic: 'سامحني', transliteration: 'samehni', eng: 'Forgive me / Sorry' },
  { arabic: 'باجر', transliteration: 'bachir', eng: 'Tomorrow' },
  { arabic: 'أبا', transliteration: 'aba', eng: 'I want' },
  { arabic: 'فلوس', transliteration: 'floos', eng: 'Money' },
  { arabic: 'ليش', transliteration: 'laysh', eng: 'Why' },
];

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function setupDailyWordNotification() {
  if (Platform.OS === 'web' || !Notifications) return;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return;
    }

    // Cancel existing to prevent spam/duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule next 14 days
    for (let i = 1; i <= 14; i++) {
      const word = WORDS[i % WORDS.length];

      // Set to 10:00 AM local time
      const trigger = new Date();
      trigger.setDate(trigger.getDate() + i);
      trigger.setHours(10, 0, 0, 0);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🇦🇪 Today's Emirati Word",
          body: `Learn to say: ${word.arabic} (${word.transliteration}) - ${word.eng}. Tap here to practice!`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
        },
      });
    }
  } catch (error) {
    console.log('Notifications setup failed:', error);
  }
}
