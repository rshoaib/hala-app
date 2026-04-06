/**
 * Root Layout — Desert Gold Theme
 * Handles font loading, RTL, splash screen, navigation stack
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
let setupDailyWordNotification: () => Promise<void> = async () => {};
try {
  setupDailyWordNotification = require('@/services/notificationService').setupDailyWordNotification;
} catch (e) {
  console.log('Notifications module not available');
}

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

// Shared header style for stack screens
const stackHeaderStyle = {
  backgroundColor: Colors.background,
};

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
      setupDailyWordNotification().catch(console.error);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootLayoutNav />
        {showSplash && (
          <AnimatedSplash onFinish={() => setShowSplash(false)} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={HalaTheme}>
      <Stack
        screenOptions={{
          headerStyle: stackHeaderStyle,
          headerTintColor: Colors.text,
          headerBackTitle: 'Back',
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="mission/[id]"
          options={{ headerTitle: '' }}
        />
        <Stack.Screen
          name="alphabet"
          options={{ headerTitle: 'Arabic Alphabet' }}
        />
        <Stack.Screen
          name="flashcard"
          options={{ headerTitle: 'Flashcards' }}
        />
        <Stack.Screen
          name="challenge"
          options={{ headerTitle: 'Daily Challenge' }}
        />
        <Stack.Screen
          name="vocabulary"
          options={{ headerTitle: 'Vocabulary' }}
        />
        <Stack.Screen
          name="boss-battle"
          options={{ headerTitle: 'Boss Battle' }}
        />
        <Stack.Screen
          name="settings"
          options={{ headerTitle: 'Settings' }}
        />
        <Stack.Screen
          name="privacy"
          options={{ headerTitle: 'Privacy Policy' }}
        />
        <Stack.Screen
          name="arcade"
          options={{
            headerTitle: 'Arcade Mode',
            headerStyle: { backgroundColor: Colors.accent },
            headerTintColor: '#FFF',
          }}
        />
        <Stack.Screen
          name="ai-tutor"
          options={{ headerTitle: 'AI Tutor' }}
        />
        <Stack.Screen
          name="ai-quiz"
          options={{ headerTitle: 'AI Quiz' }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
