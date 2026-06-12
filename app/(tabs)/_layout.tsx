/**
 * (tabs) layout — v3.2
 *
 * The only route in this group is `today` (the phrase browser, which is
 * the home screen; `index` redirects to it). The practice session lives
 * at the root level (`/practice`), pushed on top of this group.
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