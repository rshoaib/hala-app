/**
 * (tabs) layout — v3.0
 *
 * Single-screen app: the only live route in this group is `today` (the
 * phrase browser, which is the home screen). `library` and `you` still
 * exist on disk as redirect-to-/ stubs but they aren't registered here,
 * so they're inert and unreachable through navigation.
 */
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  initialRouteName: 'today',
};

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="today" />
    </Stack>
  );
}