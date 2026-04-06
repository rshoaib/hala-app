/**
 * ConfettiOverlay — Celebration particle animation
 * Lightweight: 30 animated View dots with random colors/positions
 */
import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const PARTICLE_COLORS = [
  Colors.primary,
  Colors.xpGold,
  Colors.accent,
  Colors.secondary,
  Colors.xpPurple,
  '#FF6B35',
  '#FFD700',
  '#2ECC71',
];

const PARTICLE_COUNT = 30;

interface ConfettiOverlayProps {
  visible: boolean;
  onDone?: () => void;
  duration?: number;
}

export default function ConfettiOverlay({
  visible,
  onDone,
  duration = 2000,
}: ConfettiOverlayProps) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-20),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: 6 + Math.random() * 8,
      targetX: Math.random() * width,
      speed: 0.7 + Math.random() * 0.6,
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;

    // Regenerate particle positions/colors for each new animation
    const animations = particles.map((p) => {
      p.x.setValue(Math.random() * width);
      p.y.setValue(-20 - Math.random() * 100);
      p.opacity.setValue(1);
      p.rotate.setValue(0);
      p.targetX = Math.random() * width;
      p.speed = 0.7 + Math.random() * 0.6;
      p.color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
      p.size = 6 + Math.random() * 8;

      return Animated.parallel([
        Animated.timing(p.y, {
          toValue: height + 50,
          duration: duration * p.speed,
          useNativeDriver: true,
        }),
        Animated.timing(p.x, {
          toValue: p.targetX + (Math.random() - 0.5) * 100,
          duration: duration * p.speed,
          useNativeDriver: true,
        }),
        Animated.timing(p.rotate, {
          toValue: Math.random() * 720 - 360,
          duration: duration * p.speed,
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: duration * p.speed,
          delay: duration * 0.5,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      onDone?.();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                {
                  rotate: p.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  particle: {
    position: 'absolute',
  },
});
