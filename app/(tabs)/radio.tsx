/**
 * Radio Tab — Live Arabic radio streams
 * Proper play/pause/stop with no overlapping audio
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import { radioStations, DIFFICULTY_LABELS, type RadioStation } from '@/data/radioStations';
import * as Storage from '@/services/storageService';

let Audio: any = null;
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  // expo-av not available in Expo Go
}

export default function RadioScreen() {
  const insets = useSafeAreaInsets();
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [listeningMinutes, setListeningMinutes] = useState(0);
  const [totalListening, setTotalListening] = useState(0);

  const soundRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const isTransitioningRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    isMountedRef.current = true;
    loadStats();
    if (Audio) {
      Audio.setAudioModeAsync({
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
      }).catch(() => {});
    }
    return () => {
      isMountedRef.current = false;
      forceCleanup();
    };
  }, []);

  // Stop audio when leaving tab
  useFocusEffect(
    useCallback(() => {
      return () => {
        forceCleanup();
        if (isMountedRef.current) {
          setIsPlaying(false);
          setIsLoading(false);
          setCurrentStation(null);
          setListeningMinutes(0);
        }
      };
    }, [])
  );

  // Pulse animation
  useEffect(() => {
    if (isPlaying) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  async function loadStats() {
    try {
      const stats = await Storage.getListeningStats();
      if (isMountedRef.current) setTotalListening(stats.totalMinutes);
    } catch {}
  }

  // Force cleanup - no awaits, just fire and forget
  function forceCleanup() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (soundRef.current) {
      try { soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
  }

  // Save listening time
  async function saveListeningTime() {
    if (listeningMinutes > 0) {
      try {
        await Storage.addListeningMinutes(listeningMinutes);
        await Storage.recordActivity();
        if (isMountedRef.current) {
          setTotalListening((prev) => prev + listeningMinutes);
        }
      } catch {}
    }
  }

  // Stop everything properly
  async function stopPlayback() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }

    await saveListeningTime();

    if (isMountedRef.current) {
      setIsPlaying(false);
      setIsLoading(false);
      setCurrentStation(null);
      setListeningMinutes(0);
      setStreamError(null);
    }
  }

  // Play a station
  async function playStation(station: RadioStation) {
    if (!Audio) {
      setStreamError('Audio playback is not available in this environment.');
      return;
    }

    // Prevent double-tap race conditions
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    try {
      setStreamError(null);
      setIsLoading(true);

      // Stop any existing playback first
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch {}
        soundRef.current = null;
      }

      // Save previous session time
      if (listeningMinutes > 0) {
        await Storage.addListeningMinutes(listeningMinutes);
      }

      if (!isMountedRef.current) return;

      // Create and play new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: station.streamUrl },
        { shouldPlay: true }
      );

      if (!isMountedRef.current) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;

      // Listen for playback status to detect errors/completion
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (!isMountedRef.current) return;
        if (status.isLoaded && status.error) {
          setStreamError('Stream interrupted. Tap to retry.');
          setIsPlaying(false);
        }
      });

      setCurrentStation(station);
      setIsPlaying(true);
      setIsLoading(false);
      setListeningMinutes(0);

      // Track listening time every minute
      timerRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setListeningMinutes((prev) => prev + 1);
        }
      }, 60000);
    } catch (error: any) {
      console.error('Play error:', error);
      if (isMountedRef.current) {
        setStreamError('Could not connect to stream. Try another station.');
        setIsLoading(false);
        setIsPlaying(false);
        setCurrentStation(null);
      }
    } finally {
      isTransitioningRef.current = false;
    }
  }

  // Toggle pause/resume
  async function togglePlayback() {
    if (!soundRef.current) return;
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) {
        // Sound is no longer loaded, reset
        if (isMountedRef.current) {
          setIsPlaying(false);
          setCurrentStation(null);
          soundRef.current = null;
        }
        return;
      }

      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (isMountedRef.current) setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        if (isMountedRef.current) setIsPlaying(true);
        timerRef.current = setInterval(() => {
          if (isMountedRef.current) {
            setListeningMinutes((prev) => prev + 1);
          }
        }, 60000);
      }
    } catch (error) {
      console.error('Toggle error:', error);
      if (isMountedRef.current) {
        setStreamError('Playback error. Try again.');
        setIsPlaying(false);
      }
    } finally {
      isTransitioningRef.current = false;
    }
  }

  // Skip to prev/next station
  function skipStation(direction: -1 | 1) {
    if (!currentStation) return;
    const idx = radioStations.findIndex((s) => s.id === currentStation.id);
    const nextIdx = (idx + direction + radioStations.length) % radioStations.length;
    playStation(radioStations[nextIdx]);
  }

  const getDifficultyInfo = (d: RadioStation['difficulty']) => DIFFICULTY_LABELS[d];

  if (!Audio) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.noStation}>
          <Text style={styles.noStationEmoji}>📻</Text>
          <Text style={styles.noStationTitle}>Radio</Text>
          <Text style={styles.noStationSub}>
            Audio playback requires a development or preview build. Not available in Expo Go.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Now Playing Card */}
      {currentStation ? (
        <View style={styles.nowPlaying}>
          <LinearGradient
            colors={[currentStation.color + '20', Colors.card]}
            style={styles.nowPlayingGradient}
          >
            {/* Live / Paused indicator */}
            <View style={styles.liveRow}>
              <Animated.View
                style={[
                  styles.liveDot,
                  { opacity: isPlaying ? pulseAnim : 0.3 },
                  !isPlaying && { backgroundColor: Colors.textMuted },
                ]}
              />
              <Text style={[styles.liveText, !isPlaying && { color: Colors.textMuted }]}>
                {isLoading ? 'CONNECTING...' : isPlaying ? 'LIVE' : 'PAUSED'}
              </Text>
            </View>

            <Text style={styles.nowPlayingEmoji}>{currentStation.emoji}</Text>
            <Text style={styles.nowPlayingName}>{currentStation.name}</Text>
            <Text style={styles.nowPlayingNameAr}>{currentStation.nameAr}</Text>
            {currentStation.frequency && (
              <Text style={styles.nowPlayingFreq}>{currentStation.frequency}</Text>
            )}

            {isLoading && (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={{ marginTop: Spacing.sm }}
              />
            )}

            {/* Controls: Skip Back | Play/Pause | Skip Forward */}
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={() => skipStation(-1)}
                style={styles.skipButton}
                activeOpacity={0.6}
              >
                <Ionicons name="play-skip-back" size={26} color={Colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayback}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.textOnPrimary} />
                ) : (
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color={Colors.textOnPrimary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => skipStation(1)}
                style={styles.skipButton}
                activeOpacity={0.6}
              >
                <Ionicons name="play-skip-forward" size={26} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Stop button */}
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopPlayback}
              activeOpacity={0.6}
            >
              <Ionicons name="stop-circle" size={22} color={Colors.error} />
              <Text style={styles.stopText}>Stop</Text>
            </TouchableOpacity>

            {/* Listening Timer */}
            <Text style={styles.listeningTimer}>
              🎧 {listeningMinutes} min this session • {totalListening} min total
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <View style={styles.noStation}>
          <Text style={styles.noStationEmoji}>📻</Text>
          <Text style={styles.noStationTitle}>Start Listening</Text>
          <Text style={styles.noStationSub}>
            Pick a station below and immerse yourself in Arabic
          </Text>
        </View>
      )}

      {/* Error message */}
      {streamError && (
        <View style={styles.errorCard}>
          <Ionicons name="warning" size={18} color={Colors.error} />
          <Text style={styles.errorText}>{streamError}</Text>
          <TouchableOpacity onPress={() => setStreamError(null)}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Listening Tip */}
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          Don't try to understand everything. Just catch words you recognize — that's how immersion works!
        </Text>
      </View>

      {/* Station List */}
      <Text style={styles.sectionTitle}>Stations</Text>
      {radioStations.map((station) => {
        const difficulty = getDifficultyInfo(station.difficulty);
        const isActive = currentStation?.id === station.id;

        return (
          <TouchableOpacity
            key={station.id}
            style={[styles.stationCard, isActive && styles.stationActive]}
            activeOpacity={0.7}
            onPress={() => {
              if (isActive && isPlaying) {
                togglePlayback();
              } else if (isActive && !isPlaying) {
                togglePlayback();
              } else {
                playStation(station);
              }
            }}
          >
            <View style={[styles.stationIcon, { backgroundColor: station.color + '15' }]}>
              <Text style={styles.stationEmoji}>{station.emoji}</Text>
            </View>
            <View style={styles.stationInfo}>
              <View style={styles.stationTitleRow}>
                <Text style={[styles.stationName, isActive && { color: Colors.primary }]}>
                  {station.name}
                </Text>
                {isActive && isPlaying && (
                  <View style={styles.playingBars}>
                    <Animated.View style={[styles.bar, styles.bar1, { opacity: pulseAnim }]} />
                    <Animated.View style={[styles.bar, styles.bar2]} />
                    <Animated.View style={[styles.bar, styles.bar3, { opacity: pulseAnim }]} />
                  </View>
                )}
                {isActive && !isPlaying && !isLoading && (
                  <Ionicons name="pause" size={16} color={Colors.textMuted} />
                )}
                {isActive && isLoading && (
                  <ActivityIndicator size="small" color={Colors.primary} />
                )}
              </View>
              <Text style={styles.stationNameAr}>{station.nameAr}</Text>
              <Text style={styles.stationDesc} numberOfLines={2}>
                {station.description}
              </Text>
              <View style={styles.stationMeta}>
                <Text style={[styles.difficultyBadge, { color: difficulty.color }]}>
                  {difficulty.emoji} {difficulty.label}
                </Text>
                {station.frequency && (
                  <Text style={styles.stationFreq}>{station.frequency}</Text>
                )}
              </View>
            </View>
            {!isActive && (
              <Ionicons name="play-circle" size={36} color={Colors.primary} style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>
        );
      })}

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
  nowPlaying: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  nowPlayingGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  liveText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  nowPlayingEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  nowPlayingName: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  nowPlayingNameAr: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    marginTop: 2,
  },
  nowPlayingFreq: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.lg,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.button,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    backgroundColor: Colors.error + '08',
  },
  stopText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  listeningTimer: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: Spacing.md,
  },
  noStation: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.md,
  },
  noStationEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  noStationTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  noStationSub: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    flex: 1,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  stationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  stationActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  stationIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stationEmoji: {
    fontSize: 26,
  },
  stationInfo: {
    flex: 1,
  },
  stationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stationName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  stationNameAr: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    marginTop: 1,
  },
  stationDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 4,
    lineHeight: 16,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 6,
  },
  difficultyBadge: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  stationFreq: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  playingBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
  },
  bar: {
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  bar1: { height: 8 },
  bar2: { height: 14 },
  bar3: { height: 10 },
});
