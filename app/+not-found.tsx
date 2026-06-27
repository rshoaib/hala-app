import { Stack, Link } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Colors, Spacing, FontSize, FontWeight, FontFamily, BorderRadius,
} from '@/constants/theme';

export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Text style={styles.emoji}>🤷</Text>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Link href="/today" asChild>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Go home</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
  },
});
