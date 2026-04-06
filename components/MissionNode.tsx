/**
 * MissionNode — Single node on the mission path
 * Circle with status (completed/current/locked) + connector line
 */
import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, Shadows } from '@/constants/theme';

type Status = 'completed' | 'current' | 'locked';

interface MissionNodeProps {
  emoji: string;
  title: string;
  status: Status;
  onPress: () => void;
  showConnector?: boolean;
  isLeft?: boolean; // for zigzag path
  xpReward?: number;
}

export default function MissionNode({
  emoji,
  title,
  status,
  onPress,
  showConnector = true,
  isLeft = false,
  xpReward,
}: MissionNodeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'current') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [status]);

  const nodeSize = status === 'current' ? 72 : 64;

  return (
    <View style={[styles.container, isLeft ? styles.alignLeft : styles.alignRight]}>
      {/* Connector line */}
      {showConnector && (
        <View style={[styles.connector, isLeft ? styles.connectorLeft : styles.connectorRight]} />
      )}

      <TouchableOpacity
        onPress={status !== 'locked' ? onPress : undefined}
        activeOpacity={status !== 'locked' ? 0.7 : 1}
        disabled={status === 'locked'}
      >
        <Animated.View
          style={[
            styles.node,
            {
              width: nodeSize,
              height: nodeSize,
              borderRadius: nodeSize / 2,
            },
            status === 'completed' && styles.nodeCompleted,
            status === 'current' && styles.nodeCurrent,
            status === 'locked' && styles.nodeLocked,
            status === 'current' && { transform: [{ scale: pulseAnim }] },
            status === 'current' && Shadows.glow,
          ]}
        >
          {status === 'locked' ? (
            <Ionicons name="lock-closed" size={24} color={Colors.textMuted} />
          ) : status === 'completed' ? (
            <View style={styles.completedInner}>
              <Text style={styles.emoji}>{emoji}</Text>
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={12} color="#FFF" />
              </View>
            </View>
          ) : (
            <Text style={styles.emoji}>{emoji}</Text>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Label */}
      <View style={styles.labelWrap}>
        <Text
          style={[
            styles.title,
            status === 'locked' && styles.titleLocked,
            status === 'current' && styles.titleCurrent,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {status === 'current' && (
          <View style={styles.nextBadge}>
            <Text style={styles.nextText}>NEXT</Text>
          </View>
        )}
        {xpReward && status !== 'locked' && (
          <Text style={styles.xpText}>+{xpReward} XP</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  alignLeft: {
    flexDirection: 'row',
  },
  alignRight: {
    flexDirection: 'row-reverse',
  },
  connector: {
    position: 'absolute',
    width: 3,
    height: 40,
    backgroundColor: Colors.border,
    top: -20,
  },
  connectorLeft: {
    left: 55,
  },
  connectorRight: {
    right: 55,
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  nodeCompleted: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  nodeCurrent: {
    backgroundColor: Colors.card,
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  nodeLocked: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.borderLight,
  },
  completedInner: {
    position: 'relative',
  },
  emoji: {
    fontSize: 28,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.card,
  },
  labelWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  titleLocked: {
    color: Colors.textMuted,
  },
  titleCurrent: {
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  nextBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  nextText: {
    fontSize: FontSize['2xs'],
    fontWeight: FontWeight.bold,
    color: '#FFF',
    letterSpacing: 1,
  },
  xpText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.xpGold,
  },
});
