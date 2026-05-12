/**
 * Root Layout — v3.1 (phrase browser + daily-phrase notification)
 *
 * Two real screens: home (the phrase browser, lives under the (tabs) group)
 * and onboarding. Older screens still exist as redirect-to-/today stubs and
 * are intentionally NOT registered here so they don't appear in navigation.
 *
 * On launch we (re-)schedule the daily-phrase local notification so it
 * always reflects the user's most recently-picked level.
 */
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { HalaTheme, Colors } from '@/constants/theme';
import AnimatedSplash from '@/components/AnimatedSplash';
import { scheduleDailyPhrase } from '@/services/notificationService';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Nunito-Regular': require('@expo-google-fonts/nunito/400Regular/Nunito_400Regular.ttf'),
    'Nunito-Medium': require('@expo-google-fonts/nunito/500Medium/Nunito_500Medium.ttf'),
    'Nunito-SemiBold': require('@expo-google-fonts/nunito/600SemiBold/Nunito_600SemiBold.ttf'),
    'Nunito-Bold': require('@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf'),
    'Nunito-ExtraBold': require('@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf'),
    'Nunito-Black': require('@expo-google-fonts/nunito/900Black/Nunito_900Black.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
    }
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Re-schedule on every app open so the notification always reflects
      // the user's current level. Failures are swallowed inside the service.
      scheduleDailyPhrase();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={HalaTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="onboarding"
              options={{ gestureEnabled: false }}
            />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
        {showSplash && (
          <AnimatedSplash onFinish={() => setShowSplash(false)} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
