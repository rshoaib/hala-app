/**
 * Tab Layout — Desert Gold theme
 * 4 tabs: Home, Learn, Play, Profile
 * Custom floating tab bar with elevated Play button
 */
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';
import FloatingTabBar from '@/components/FloatingTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: Colors.text,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: 'Play',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      {/* Hide old tabs from navigation */}
      <Tabs.Screen name="practice" options={{ href: null }} />
      <Tabs.Screen name="radio" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
    </Tabs>
  );
}
