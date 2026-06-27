/**
 * GoldButton — Primary CTA with claymorphic block style
 * Solid color with 3D bottom-border press effect.
 *
 * Uses Pressable (not the legacy TouchableWithoutFeedback): the `disabled`
 * prop blocks every interaction — press, press-in, press-out — so a
 * disabled button can't bounce or fire its spring animation. The disabled
 * style neutralizes the surface, borders, and shadows of all three
 * variants so a disabled outline/accent button never looks active.
 */
import { useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors, FontSize, Shadows, ComponentTokens, Spacing, fontStyle,
} from '@/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface GoldButtonProps {
  title: string;
  onPress: () => void;
  icon?: IoniconsName;
  variant?: 'primary' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function GoldButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}: GoldButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  };

  const heightMap = { sm: ComponentTokens.buttonSm.height, md: ComponentTokens.button.height, lg: 64 };
  const fontMap = { sm: FontSize.sm, md: FontSize.md, lg: FontSize.lg };
  const iconSize = { sm: 16, md: 18, lg: 20 };

  const isOutline = variant === 'outline';
  const isAccent = variant === 'accent';

  const variantStyle = isOutline
    ? styles.outline
    : isAccent
      ? styles.accent
      : styles.default;

  const baseTextColor = isOutline ? Colors.primaryDark : Colors.textOnPrimary;
  const textColor = disabled ? Colors.textMuted : baseTextColor;
  const iconColor = textColor;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      style={[fullWidth && { width: '100%' }, style]}
    >
      <Animated.View
        style={[
          { transform: [{ scale }], opacity: disabled ? 0.6 : 1 },
          fullWidth && { width: '100%' },
        ]}
      >
        <Animated.View
          style={[
            styles.button,
            { height: heightMap[size], borderRadius: ComponentTokens.button.borderRadius },
            variantStyle,
            disabled && styles.disabled,
          ]}
        >
          {icon && (
            <Ionicons
              name={icon}
              size={iconSize[size]}
              color={iconColor}
              style={{ marginRight: Spacing.sm }}
            />
          )}
          <Text
            style={[
              styles.text,
              { fontSize: fontMap[size], color: textColor },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  text: {
    ...fontStyle('bold'),
    letterSpacing: ComponentTokens.button.letterSpacing,
  },
  default: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
    borderBottomWidth: 3,
    borderBottomColor: Colors.primaryDark,
    ...Shadows.button,
  },
  outline: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  accent: {
    backgroundColor: Colors.accent,
    borderBottomWidth: 3,
    borderBottomColor: Colors.accentDark,
    shadowColor: Colors.accentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  // Neutralizes every variant: flat disabled surface, no colored borders,
  // no shadow. Listed last so it wins over the variant style.
  disabled: {
    backgroundColor: Colors.disabled,
    borderWidth: 0,
    borderBottomWidth: 0,
    borderColor: 'transparent',
    borderBottomColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
});
