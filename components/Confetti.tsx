/**
 * Confetti — a lightweight celebratory burst built on the core Animated
 * API (no extra dependency). Renders a full-screen, non-interactive overlay
 * of falling, spinning paper pieces. Mount it with `visible` when a
 * milestone is hit; it plays once and calls `onDone`.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Colors } from '@/constants/theme';

const COLORS = [
  Colors.primary,
  Colors.primaryDark,
  Colors.accent,
  Colors.accentDark,
  '#3BA776', // emerald — UAE flag green, used only as a festive accent here
];

const PIECE_COUNT = 80;
const DURATION = 2600;

interface ConfettiProps {
  visible: boolean;
  onDone?: () => void;
}

export default function Confetti({ visible, onDone }: ConfettiProps) {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  // Deterministic-per-mount piece layout. Regenerated only if size changes.
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, i) => ({
        key: i,
        x: Math.random() * width,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
        rounded: Math.random() > 0.5,
        delay: Math.random() * 600,
        drift: (Math.random() - 0.5) * 120,
        spin: Math.random() > 0.5 ? 1 : -1,
        fall: height + 60,
      })),
    [width, height]
  );

  useEffect(() => {
    if (!visible) return;
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) onDone?.();
    });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p) => {
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-60, p.fall],
        });
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.drift],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spin * 540}deg`],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.1, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });
        return (
          <Animated.View
            key={p.key}
            style={{
              position: 'absolute',
              left: p.x,
              top: 0,
              width: p.size,
              height: p.size,
              borderRadius: p.rounded ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
