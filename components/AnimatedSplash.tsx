/**
 * Animated Splash Screen — Premium onboarding moment
 * Shows after the native splash with engaging animations:
 * - Logo pulse & scale-in
 * - Floating Arabic letters
 * - Gold shimmer effect
 * - Motivational tagline fade-in
 * - Smooth fade-out transition
 *
 * Every timer and looping animation is tracked and torn down on unmount
 * (or tap-to-skip), so nothing fires on an unmounted component.
 */
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Colors, FontSize, FontWeight, FontFamily, BorderRadius, Spacing,
} from '@/constants/theme';

// Floating Arabic letters that drift across the screen. Positions are
// fractions of the live window size (resolved at render).
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
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [greetingIndex, setGreetingIndex] = useState(0);
  const finished = useRef(false);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;
  // Constant base offset for the glow's scale. Hoisted into a ref so the
  // animation graph keeps a stable node identity across re-renders —
  // creating `new Animated.Value(0.8)` inline every render froze the pulse.
  const glowBase = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greetingScale = useRef(new Animated.Value(0.8)).current;
  const overallOpacity = useRef(new Animated.Value(1)).current;
  const shimmerTranslate = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Floating letter animations
  const letterAnims = useRef(
    FLOATING_LETTERS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
      scale: new Animated.Value(0.5),
    }))
  ).current;

  // Teardown registries: every setTimeout id and every running animation
  // is recorded so the cleanup can cancel them all on unmount / skip.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const anims = useRef<Animated.CompositeAnimation[]>([]);

  const track = (anim: Animated.CompositeAnimation) => {
    anims.current.push(anim);
    return anim;
  };
  const after = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    startAnimationSequence();
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      anims.current.forEach((a) => a.stop());
      anims.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startAnimationSequence() {
    // Phase 1: Logo appears with spring bounce (0-800ms)
    track(
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
      ])
    ).start();

    // Phase 1b: Gold glow pulsing behind logo
    track(
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
      )
    ).start();

    // Phase 1c: Shimmer sweep across logo
    shimmerTranslate.setValue(-width);
    track(
      Animated.loop(
        Animated.timing(shimmerTranslate, {
          toValue: width,
          duration: 2000,
          useNativeDriver: true,
        })
      )
    ).start();

    // Phase 2: Floating letters appear (300-1200ms)
    letterAnims.forEach((anim, i) => {
      const delay = 300 + FLOATING_LETTERS[i].delay;
      after(delay, () => {
        track(
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
          ])
        ).start();

        // Gentle float animation
        track(
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
          )
        ).start();
      });
    });

    // Phase 3: Tagline slides up (800ms)
    after(800, () => {
      track(
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
        ])
      ).start();
    });

    // Phase 4: Greeting cycle (1200-2800ms)
    after(1200, () => showGreeting(0));

    // Phase 5: Progress bar fills (0-3000ms)
    track(
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();

    // Phase 6: Fade out everything (3200ms)
    after(3200, () => finish(500));
  }

  // Single exit path — used by the timed fade-out and by tap-to-skip.
  function finish(duration: number) {
    if (finished.current) return;
    finished.current = true;
    track(
      Animated.timing(overallOpacity, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      })
    ).start(() => {
      onFinish();
    });
  }

  function showGreeting(index: number) {
    if (index >= GREETINGS.length) return;

    setGreetingIndex(index);
    track(
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
      ])
    ).start();

    // Fade out after 600ms, show next
    after(600, () => {
      track(
        Animated.timing(greetingOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ).start(() => {
        greetingScale.setValue(0.8);
        if (index + 1 < GREETINGS.length) {
          showGreeting(index + 1);
        }
      });
    });
  }

  return (
    // Decorative interstitial: hidden from screen readers so TalkBack users
    // aren't trapped on it; any tap skips straight into the app.
    <Animated.View
      style={[styles.container, { opacity: overallOpacity }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Pressable
        style={styles.gradient}
        onPress={() => finish(250)}
        accessible={false}
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
                  scale: Animated.add(glowPulse, glowBase),
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
              height,
              transform: [{ translateX: shimmerTranslate }, { skewX: '-20deg' }],
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

        {/* Progress bar at bottom — clears the home indicator / nav bar */}
        <View
          style={[
            styles.progressContainer,
            { width: width * 0.5, bottom: insets.bottom + Spacing.xxl },
          ]}
        >
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
      </Pressable>
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
    backgroundColor: Colors.splashBackground,
  },
  floatingLetter: {
    position: 'absolute',
    color: Colors.primary,
    fontWeight: FontWeight.regular,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.goldGlow,
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    shadowColor: Colors.primaryDark,
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
    backgroundColor: Colors.shimmer,
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  appName: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.extraBold,
    fontWeight: FontWeight.extraBold,
    color: Colors.text,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    letterSpacing: 1,
  },
  greetingContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    minHeight: 60,
  },
  greetingAr: {
    fontSize: FontSize.arabicLarge,
    color: Colors.primary,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
  },
  greetingSub: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  progressContainer: {
    position: 'absolute',
    height: 3,
    backgroundColor: Colors.goldGlowDeep,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
});
