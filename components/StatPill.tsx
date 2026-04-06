/**
 * StatPill — Compact stat display
 * Shows icon + value in a pill shape
 */
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, FontWeight, ComponentTokens, Spacing } from '@/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface StatPillProps {
  icon: IoniconsName;
  value: string | number;
  label?: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
}

export default function StatPill({
  icon,
  value,
  label,
  color = Colors.primary,
  bgColor,
  size = 'md',
}: StatPillProps) {
  const bg = bgColor || `${color}15`;
  const isSm = size === 'sm';

  return (
    <View style={[styles.pill, { backgroundColor: bg, borderBottomColor: `${color}30` }, isSm && styles.pillSm]}>
      <Ionicons name={icon} size={isSm ? 14 : 16} color={color} />
      <Text style={[styles.value, { color }, isSm && styles.valueSm]}>{value}</Text>
      {label && <Text style={[styles.label, isSm && styles.labelSm]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ComponentTokens.pill.height,
    borderRadius: 18,
    paddingHorizontal: ComponentTokens.pill.paddingH,
    gap: 6,
    borderBottomWidth: 1,
  },
  pillSm: {
    height: 26,
    paddingHorizontal: 10,
    gap: 4,
  },
  value: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
  valueSm: {
    fontSize: FontSize.xs,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  labelSm: {
    fontSize: FontSize['2xs'],
  },
});
