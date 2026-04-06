/**
 * Floating Tab Bar — Premium claymorphic custom tab bar
 * Rounded pill shape, glass highlight, clay shadows.
 * "Play" tab gets a prominent elevated gold button.
 */
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Colors,
  Shadows,
  ComponentTokens,
  FontSize,
  FontWeight,
  FontFamily,
} from '@/constants/theme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<string, { icon: IoniconsName; label: string; isPlay?: boolean }> = {
  index: { icon: 'home', label: 'Home' },
  learn: { icon: 'book', label: 'Learn' },
  play: { icon: 'game-controller', label: 'Play', isPlay: true },
  profile: { icon: 'person', label: 'Profile' },
};

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {state.routes
          .filter((route) => TAB_CONFIG[route.name]) // Only show configured tabs
          .map((route) => {
          const index = state.routes.indexOf(route);
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name];
          const isPlay = config.isPlay;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          const iconName: IoniconsName = isFocused
            ? config.icon
            : (`${config.icon}-outline` as IoniconsName);

          if (isPlay) {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.playTabWrapper}
                activeOpacity={0.8}
              >
                <View style={[styles.playButton, isFocused && styles.playButtonActive]}>
                  <Ionicons
                    name={iconName}
                    size={28}
                    color={isFocused ? Colors.textOnPrimary : Colors.primary}
                  />
                </View>
                <Text style={[styles.label, isFocused && styles.labelActive]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Ionicons
                  name={iconName}
                  size={22}
                  color={isFocused ? Colors.primary : Colors.textMuted}
                />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: ComponentTokens.tabBar.margin,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: ComponentTokens.tabBar.borderRadius,
    height: ComponentTokens.tabBar.height,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.8)',
    ...Shadows.tabBar,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconWrap: {
    width: 44,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  label: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    fontWeight: FontWeight.medium,
    color: Colors.textMuted,
    marginTop: 2,
  },
  labelActive: {
    color: Colors.primary,
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
  },
  playTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.card,
    ...Shadows.button,
  },
  playButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primaryDark,
    ...Shadows.glow,
  },
});
