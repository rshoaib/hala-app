/**
 * (main) layout — v3.2
 *
 * This group is a Stack (not a Tabs navigator — there is no bottom tab
 * bar). The only route in it is `today` (the phrase browser, which is the
 * home screen; `index` redirects to it). The practice session lives at the
 * root level (`/practice`), pushed on top of this group.
 */
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  initialRouteName: 'today',
};

export default function MainLayout() {
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