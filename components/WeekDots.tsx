/**
 * WeekDots — 7-day activity indicator
 * Shows Mon-Sun with filled/empty/today states
 */
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface WeekDotsProps {
  activeDays: boolean[]; // 7 booleans, Mon-Sun
  todayIndex?: number;   // 0-6, which day is today
  color?: string;
  labelColor?: string;   // explicit label color for dark backgrounds
  size?: 'sm' | 'md';
}

export default function WeekDots({
  activeDays,
  todayIndex,
  color = Colors.primary,
  labelColor,
  size = 'md',
}: WeekDotsProps) {
  const dotSize = size === 'sm' ? 28 : 36;
  const fontSize = size === 'sm' ? FontSize['2xs'] : FontSize.xs;

  return (
    <View style={styles.container}>
      {DAYS.map((day, i) => {
        const isActive = activeDays[i];
        const isToday = todayIndex === i;

        return (
          <View key={i} style={styles.dayCol}>
            <Text style={[styles.dayLabel, { fontSize }, labelColor && { color: labelColor }]}>{day}</Text>
            <View
              style={[
                styles.dot,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                },
                isActive && { backgroundColor: color, borderBottomWidth: 2, borderBottomColor: 'rgba(0,0,0,0.15)' },
                !isActive && [styles.dotInactive, labelColor && { backgroundColor: 'rgba(255,255,255,0.2)' }],
                isToday && !isActive && { borderColor: color, borderWidth: 2, borderStyle: 'dashed' as const },
              ]}
            >
              {isActive && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCol: {
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInactive: {
    backgroundColor: Colors.surface,
  },
  checkmark: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
});
