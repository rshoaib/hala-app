/**
 * QuizOption — Answer button with correct/wrong animations
 * Used in Mission quiz, Challenge, Boss Battle, AI Quiz
 * Claymorphic block style with raised-block border effect
 */
import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, FontFamily, Spacing, BorderRadius } from '@/constants/theme';

interface QuizOptionProps {
  text: string;
  onPress: () => void;
  state?: 'default' | 'selected' | 'correct' | 'wrong' | 'disabled';
  index?: number;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuizOption({
  text,
  onPress,
  state = 'default',
  index = 0,
}: QuizOptionProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'wrong') {
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    if (state === 'correct') {
      // Pop animation
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  const isInteractive = state === 'default';
  const bgColor = {
    default: Colors.card,
    selected: Colors.primaryMuted,
    correct: Colors.successLight,
    wrong: Colors.errorLight,
    disabled: Colors.surfaceLight,
  }[state];

  const borderColor = {
    default: Colors.border,
    selected: Colors.primary,
    correct: Colors.success,
    wrong: Colors.error,
    disabled: Colors.borderLight,
  }[state];

  // Slightly darker bottom border for the raised-block effect
  const borderBottomColor = {
    default: '#D8CFBD',           // darker than Colors.border (#E5DECE)
    selected: Colors.primaryDark,
    correct: Colors.success,
    wrong: Colors.error,
    disabled: '#E5DECE',
  }[state];

  const textColor = {
    default: Colors.text,
    selected: Colors.primary,
    correct: Colors.success,
    wrong: Colors.error,
    disabled: Colors.textMuted,
  }[state];

  // Solid-colored label circle backgrounds
  const labelBg = {
    default: Colors.surfaceLight,
    selected: Colors.primaryMuted,
    correct: Colors.successLight,
    wrong: Colors.errorLight,
    disabled: Colors.surfaceLight,
  }[state];

  // State-specific shadow styles
  const shadowStyle = state === 'correct'
    ? {
        shadowColor: Colors.success,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
      }
    : state === 'wrong'
    ? {
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
      }
    : {};

  return (
    <Animated.View
      style={{
        transform: [
          { translateX: shakeAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <TouchableOpacity
        style={[
          styles.option,
          {
            backgroundColor: bgColor,
            borderColor,
            borderBottomColor,
            borderBottomWidth: 3,
          },
          shadowStyle,
        ]}
        onPress={isInteractive ? onPress : undefined}
        activeOpacity={isInteractive ? 0.7 : 1}
        disabled={!isInteractive}
      >
        <View style={[styles.label, { backgroundColor: labelBg }]}>
          <Text style={[styles.labelText, { color: textColor }]}>
            {OPTION_LABELS[index]}
          </Text>
        </View>
        <Text style={[styles.text, { color: textColor }]}>{text}</Text>
        {state === 'correct' && (
          <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
        )}
        {state === 'wrong' && (
          <Ionicons name="close-circle" size={22} color={Colors.error} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  label: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
  },
  text: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    fontFamily: FontFamily.semibold,
  },
});
