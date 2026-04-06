/**
 * Animated Splash Screen — Premium onboarding moment
 * Shows after the native splash with engaging animations:
 * - Logo pulse & scale-in
 * - Floating Arabic letters
 * - Gold shimmer effect
 * - Motivational tagline fade-in
 * - Smooth fade-out transition
 */
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, FontSize } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// Floating Arabic letters that drift across the screen
const FLOATING_LETTERS = [
  { char: 'أ', x: 0.1, y: 0.15, size: 28, delay: 200 },
  { char: 'ب', x: 0.8, y: 0.2, size: 22, delay: 400 },
  { char: 'ت', x: 0.2, y: 0.7, size: 26, delay: 100 },
  { char: 'ث', x: 0.7, y: 0.65, size: 20, delay: 600 },
  { char: 'ج', x: 0.5, y: 0.85, size: 24, delay: 300 },
  { char: 'ح', x: 0.85, y: 0.45, size: 18, delay: 500 },
  { char: 'خ', x: 0.15, y: 0.45, size: 22, delay: 700 },
  { char: 'د', x: 0.6, y: 0.12, size: 20, delay: 350 },
  { char: 'ذ', x: 0.35, y: 0.9, size: 16, delay: 450 },
  { char: 'ر', x: 0.9, y: 0.8, size: 24, delay: 250 },
];

// Emirati greetings that cycle
const GREETINGS = [
  { text: 'هلا والله!', sub: 'Welcome!' },
  { text: 'شحالك؟', sub: 'How are you?' },
  { text: 'يلّا نتعلم', sub: "Let's learn!" },
];

interface AnimatedSplashProps {
  onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const [greetingIndex, setGreetingIndex] = useState(0);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greetingScale = useRef(new Animated.Value(0.8)).current;
  const overallOpacity = useRef(new Animated.Value(1)).current;
  const shimmerTranslate = useRef(new Animated.Value(-width)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Floating letter animations
  const letterAnims = useRef(
    FLOATING_LETTERS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
      scale: new Animated.Value(0.5),
    }))
  ).current;

  useEffect(() => {
    startAnimationSequence();
  }, []);

  function startAnimationSequence() {
    // Phase 1: Logo appears with spring bounce (0-800ms)
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 1b: Gold glow pulsing behind logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Phase 1c: Shimmer sweep across logo
    Animated.loop(
      Animated.timing(shimmerTranslate, {
        toValue: width,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Phase 2: Floating letters appear (300-1200ms)
    letterAnims.forEach((anim, i) => {
      const delay = 300 + FLOATING_LETTERS[i].delay;
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 0.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(anim.translateY, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            tension: 50,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();

        // Gentle float animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim.translateY, {
              toValue: -8,
              duration: 2000 + i * 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateY, {
              toValue: 8,
              duration: 2000 + i * 200,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);
    });

    // Phase 3: Tagline slides up (800ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(taglineTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);

    // Phase 4: Greeting cycle (1200-2800ms)
    setTimeout(() => showGreeting(0), 1200);

    // Phase 5: Progress bar fills (0-3000ms)
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Phase 6: Fade out everything (3200ms)
    setTimeout(() => {
      Animated.timing(overallOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 3200);
  }

  function showGreeting(index: number) {
    if (index >= GREETINGS.length) return;

    setGreetingIndex(index);
    Animated.parallel([
      Animated.timing(greetingOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(greetingScale, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade out after 500ms, show next
    setTimeout(() => {
      Animated.timing(greetingOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        greetingScale.setValue(0.8);
        if (index + 1 < GREETINGS.length) {
          showGreeting(index + 1);
        }
      });
    }, 600);
  }

  return (
    <Animated.View style={[styles.container, { opacity: overallOpacity }]}>
      <LinearGradient
        colors={['#FBF8F3', '#F5F0E8', '#EDE7DB', '#E5DECE']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating Arabic letters background */}
        {FLOATING_LETTERS.map((letter, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.floatingLetter,
              {
                left: letter.x * width,
                top: letter.y * height,
                fontSize: letter.size,
                opacity: letterAnims[i].opacity,
                transform: [
                  { translateY: letterAnims[i].translateY },
                  { scale: letterAnims[i].scale },
                ],
              },
            ]}
          >
            {letter.char}
          </Animated.Text>
        ))}

        {/* Gold glow behind logo */}
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowPulse,
              transform: [
                {
                  scale: Animated.add(glowPulse, new Animated.Value(0.8)),
                },
              ],
            },
          ]}
        />

        {/* Logo with scale-in animation */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../assets/images/splash-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Shimmer overlay */}
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />

        {/* App title tagline */}
        <Animated.View
          style={[
            styles.taglineContainer,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          <Text style={styles.appName}>Hala</Text>
          <Text style={styles.tagline}>Learn Emirati Arabic</Text>
        </Animated.View>

        {/* Cycling Emirati greetings */}
        <Animated.View
          style={[
            styles.greetingContainer,
            {
              opacity: greetingOpacity,
              transform: [{ scale: greetingScale }],
            },
          ]}
        >
          <Text style={styles.greetingAr}>
            {GREETINGS[greetingIndex].text}
          </Text>
          <Text style={styles.greetingSub}>
            {GREETINGS[greetingIndex].sub}
          </Text>
        </Animated.View>

        {/* Progress bar at bottom */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingLetter: {
    position: 'absolute',
    color: Colors.primary,
    fontWeight: '300',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(218, 165, 32, 0.15)',
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  shimmer: {
    position: 'absolute',
    width: 60,
    height: height,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ skewX: '-20deg' }],
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  appName: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
    letterSpacing: 1,
  },
  greetingContainer: {
    alignItems: 'center',
    marginTop: 40,
    minHeight: 60,
  },
  greetingAr: {
    fontSize: FontSize.arabicLarge,
    color: Colors.primary,
    fontWeight: '700',
  },
  greetingSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 80,
    width: width * 0.5,
    height: 3,
    backgroundColor: 'rgba(184, 134, 11, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});
