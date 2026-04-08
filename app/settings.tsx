/**
 * Settings Screen — Desert Gold themed card-based layout
 * Daily goal, text size, notifications, reset, privacy
 */
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  FontFamily,
  BorderRadius,
  Shadows,
  ComponentTokens,
  ClayStyle,
} from '@/constants/theme';
import * as Storage from '@/services/storageService';
import { setupDailyWordNotification } from '@/services/notificationService';
import SectionHeader from '@/components/SectionHeader';

const DAILY_GOALS = [30, 50, 100];
const TEXT_SIZES = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];
const TEXT_SIZE_KEY = '@hala_arabic_text_size';
const NOTIFICATIONS_KEY = '@hala_notifications_enabled';

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [coins, setCoins] = useState(0);
  const [freezes, setFreezes] = useState(0);
  const [dailyGoal, setDailyGoalState] = useState(50);
  const [arabicTextSize, setArabicTextSize] = useState('medium');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const [coinsVal, streakData, goalVal, textSizeVal, notifVal] = await Promise.all([
      Storage.getCoins(),
      Storage.getStreak(),
      Storage.getDailyGoal(),
      AsyncStorage.getItem(TEXT_SIZE_KEY),
      AsyncStorage.getItem(NOTIFICATIONS_KEY),
    ]);
    setCoins(coinsVal);
    setFreezes(streakData.freezesAvailable);
    setDailyGoalState(goalVal);
    if (textSizeVal) setArabicTextSize(textSizeVal);
    if (notifVal !== null) setNotificationsEnabled(notifVal === 'true');
  }

  async function handleDailyGoalChange(goal: number) {
    setDailyGoalState(goal);
    await Storage.setDailyGoal(goal);
  }

  async function handleTextSizeChange(size: string) {
    setArabicTextSize(size);
    await AsyncStorage.setItem(TEXT_SIZE_KEY, size);
  }

  async function buyStreakFreeze() {
    const FREEZE_COST = 50;
    if (coins < FREEZE_COST) {
      Alert.alert(
        'Not Enough Coins',
        `You need ${FREEZE_COST} coins to buy a streak freeze. Keep learning to earn more!`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Buy Streak Freeze?',
      `Spend ${FREEZE_COST} coins to get a streak freeze? It protects your streak for 1 missed day.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            await Storage.addCoins(-FREEZE_COST);
            const streak = await Storage.getStreak();
            await Storage.saveStreak({
              ...streak,
              freezesAvailable: streak.freezesAvailable + 1,
            });
            setCoins((p) => p - FREEZE_COST);
            setFreezes((p) => p + 1);
            Alert.alert('Streak Freeze Purchased!', 'Your streak is now protected for 1 day.');
          },
        },
      ]
    );
  }

  async function resetProgress() {
    Alert.alert(
      'Reset All Progress?',
      'This will erase all your XP, coins, streaks, and learning progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await Storage.resetAllData();
            loadData();
            Alert.alert('Progress Reset', 'All data has been cleared.');
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── Coins Balance Card ── */}
      <View style={styles.coinCard}>
        <View style={styles.coinCardInner}>
          <Text style={styles.coinEmoji}>🪙</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.coinBalance}>{coins}</Text>
            <Text style={styles.coinLabel}>Coins Available</Text>
          </View>
          <TouchableOpacity style={styles.freezeBtn} onPress={buyStreakFreeze}>
            <Text style={styles.freezeBtnEmoji}>❄️</Text>
            <Text style={styles.freezeBtnText}>Buy Freeze</Text>
            <Text style={styles.freezeCount}>{freezes} owned</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Daily Goal Section ── */}
      <View style={styles.section}>
        <SectionHeader title="Daily Goal" subtitle="How much XP per day?" />
        <View style={styles.goalRow}>
          {DAILY_GOALS.map((goal) => {
            const isActive = dailyGoal === goal;
            return (
              <TouchableOpacity
                key={goal}
                style={[styles.goalOption, isActive && styles.goalOptionActive]}
                onPress={() => handleDailyGoalChange(goal)}
                activeOpacity={0.7}
              >
                <Text style={[styles.goalValue, isActive && styles.goalValueActive]}>{goal}</Text>
                <Text style={[styles.goalLabel, isActive && styles.goalLabelActive]}>XP/day</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Arabic Text Size Section ── */}
      <View style={styles.section}>
        <SectionHeader title="Arabic Text Size" subtitle="Adjust readability" />
        <View style={styles.textSizeRow}>
          {TEXT_SIZES.map((size) => {
            const isActive = arabicTextSize === size.value;
            return (
              <TouchableOpacity
                key={size.value}
                style={[styles.textSizeOption, isActive && styles.textSizeOptionActive]}
                onPress={() => handleTextSizeChange(size.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.textSizePreview,
                    size.value === 'small' && { fontSize: 18 },
                    size.value === 'medium' && { fontSize: 24 },
                    size.value === 'large' && { fontSize: 32 },
                    isActive && { color: Colors.primary },
                  ]}
                >
                  أ
                </Text>
                <Text
                  style={[
                    styles.textSizeLabel,
                    isActive && { color: Colors.primary, fontWeight: FontWeight.bold },
                  ]}
                >
                  {size.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Preferences Section ── */}
      <View style={styles.section}>
        <SectionHeader title="Preferences" />

        {/* Notifications Toggle */}
        <View style={styles.settingCard}>
          <View style={styles.settingInfo}>
            <View style={[styles.settingIconCircle, { backgroundColor: Colors.primaryMuted }]}>
              <Ionicons name="notifications" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Daily Reminders</Text>
              <Text style={styles.settingSubtitle}>Get notified to practice</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(val) => {
              setNotificationsEnabled(val);
              AsyncStorage.setItem(NOTIFICATIONS_KEY, String(val)).then(() => {
                setupDailyWordNotification();
              });
            }}
            trackColor={{ false: Colors.surface, true: Colors.primaryMuted }}
            thumbColor={notificationsEnabled ? Colors.primary : Colors.textMuted}
          />
        </View>
      </View>

      {/* ── Quick Links Section ── */}
      <View style={styles.section}>
        <SectionHeader title="More" />

        {[
          {
            title: 'Vocabulary',
            subtitle: 'Browse all learned phrases',
            icon: 'book' as const,
            color: Colors.secondary,
            onPress: () => router.push('/vocabulary'),
          },
          {
            title: 'Boss Battle',
            subtitle: 'Challenge the Level 1 boss',
            icon: 'flame' as const,
            color: Colors.accent,
            onPress: () => router.push('/boss-battle'),
          },
          {
            title: 'Privacy Policy',
            subtitle: 'How we handle your data',
            icon: 'shield-checkmark' as const,
            color: Colors.info,
            onPress: () => router.push('/privacy'),
          },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.menuCard}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIconCircle, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── App Info ── */}
      <View style={styles.appInfo}>
        <View style={styles.appLogoCircle}>
          <Text style={styles.appLogoText}>هلا</Text>
        </View>
        <Text style={styles.appName}>Hala</Text>
        <Text style={styles.appVersion}>Version 1.1.0</Text>
        <Text style={styles.appCredits}>Made with care by OVC Tech</Text>
        <Text style={styles.appTagline}>Learn Emirati Arabic</Text>
      </View>

      {/* ── Danger Zone ── */}
      <View style={styles.dangerSection}>
        <View style={styles.dangerDivider} />
        <Text style={styles.dangerLabel}>Danger Zone</Text>
        <TouchableOpacity style={styles.resetButton} onPress={resetProgress}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
          <Text style={styles.resetText}>Reset All Progress</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
  },

  // ── Coins Card ──
  coinCard: {
    marginTop: Spacing.md,
  },
  coinCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderRightColor: 'rgba(0,0,0,0.06)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    ...Shadows.cardLifted,
  },
  coinEmoji: {
    fontSize: 36,
  },
  coinBalance: {
    color: '#FFF',
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    fontFamily: FontFamily.black,
  },
  coinLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    fontFamily: FontFamily.medium,
  },
  freezeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  freezeBtnEmoji: {
    fontSize: 20,
  },
  freezeBtnText: {
    color: '#FFF',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    marginTop: 2,
  },
  freezeCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize['2xs'],
    marginTop: 1,
  },

  // ── Sections ──
  section: {
    marginTop: Spacing.lg,
  },

  // ── Daily Goal ──
  goalRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  goalOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    ...ClayStyle.card,
    borderRadius: BorderRadius.lg,
  },
  goalOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
    ...Shadows.card,
  },
  goalValue: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
  goalValueActive: {
    color: '#FFF',
    fontWeight: FontWeight.black,
  },
  goalLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  goalLabelActive: {
    color: 'rgba(255,255,255,0.8)',
  },

  // ── Text Size ──
  textSizeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  textSizeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    ...ClayStyle.card,
    borderRadius: BorderRadius.lg,
  },
  textSizeOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
    ...Shadows.soft,
  },
  textSizePreview: {
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  textSizeLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 4,
    fontWeight: FontWeight.medium,
    fontFamily: FontFamily.medium,
  },

  // ── Setting Card ──
  settingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    ...ClayStyle.card,
    borderRadius: BorderRadius.lg,
    ...Shadows.clay,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.semibold,
  },
  settingSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },

  // ── Menu Cards ──
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...ClayStyle.card,
    borderRadius: BorderRadius.lg,
    ...Shadows.clay,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.semibold,
  },
  menuSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },

  // ── App Info ──
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginTop: Spacing.lg,
  },
  appLogoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  appLogoText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    color: Colors.primary,
  },
  appName: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
  appVersion: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  appCredits: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  appTagline: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.semibold,
    marginTop: 4,
  },

  // ── Danger Zone ──
  dangerSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  dangerDivider: {
    height: 1,
    backgroundColor: Colors.error + '15',
    marginBottom: Spacing.md,
  },
  dangerLabel: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.error + '30',
    borderBottomWidth: 3,
    borderBottomColor: Colors.error + '40',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.errorLight,
  },
  resetText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
});
