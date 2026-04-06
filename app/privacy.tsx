/**
 * Privacy Policy Screen
 */
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.updated}>Last updated: March 2026</Text>

      <View style={styles.section}>
        <Text style={styles.heading}>Information We Collect</Text>
        <Text style={styles.body}>
          Hala - Learn Emirati Arabic does not collect any personal information. All your learning
          progress, streaks, and preferences are stored locally on your device using AsyncStorage.
          We do not require account creation or login.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Advertising</Text>
        <Text style={styles.body}>
          This app uses Google AdMob to display advertisements. Google may collect and use data
          for personalized advertising as described in Google's Privacy Policy. You can opt out
          of personalized advertising in your device settings.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Data Storage</Text>
        <Text style={styles.body}>
          All app data including your learning progress, streak data, XP, and preferences are
          stored locally on your device. No data is transmitted to external servers. If you
          uninstall the app, all local data will be deleted.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Third-Party Services</Text>
        <Text style={styles.body}>
          This app uses the following third-party services:{'\n'}
          • Google AdMob (advertising){'\n'}
          • Expo (app framework and notifications){'\n'}
          {'\n'}
          Each service has its own privacy policy governing data collection.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Contact</Text>
        <Text style={styles.body}>
          If you have questions about this privacy policy, please contact us at
          support@ovctech.com
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginTop: Spacing.lg,
  },
  updated: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  heading: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  body: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
});
