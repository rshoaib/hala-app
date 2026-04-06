/**
 * AnimatedCounter — Number that animates counting up
 * Used for XP reveals, score displays
 */
import { useEffect, useRef, useState } from 'react';
import { Text, Animated, TextStyle, StyleProp } from 'react-native';
import { Colors, FontSize, FontWeight } from '@/constants/theme';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  delay?: number;
}

export default function AnimatedCounter({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  style,
  delay = 0,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      animVal.addListener(({ value: v }) => {
        setDisplay(Math.round(v));
      });

      Animated.parallel([
        Animated.timing(animVal, {
          toValue: value,
          duration,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            tension: 80,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      animVal.removeAllListeners();
    };
  }, [value]);

  return (
    <Animated.Text style={[defaultStyle, style, { transform: [{ scale }] }]}>
      {prefix}{display}{suffix}
    </Animated.Text>
  );
}

const defaultStyle: TextStyle = {
  fontSize: FontSize.xxxl,
  fontWeight: FontWeight.black,
  color: Colors.text,
};
