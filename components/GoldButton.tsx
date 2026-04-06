/**
 * GoldButton — Primary CTA with claymorphic block style
 * Solid color with 3D bottom-border press effect
 */
import { useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, FontWeight, Shadows, ComponentTokens, Spacing } from '@/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface GoldButtonProps {
  title: string;
  onPress: () => void;
  icon?: IoniconsName;
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
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

  const heightMap = { sm: ComponentTokens.buttonSm.height, md: ComponentTokens.button.height, lg: 56 };
  const fontMap = { sm: FontSize.sm, md: FontSize.md, lg: FontSize.lg };
  const iconSize = { sm: 16, md: 18, lg: 20 };

  const isOutline = variant === 'outline';
  const isAccent = variant === 'accent';

  const variantStyle = isOutline
    ? styles.outline
    : isAccent
      ? styles.accent
      : styles.default;

  const iconColor = isOutline ? Colors.primary : Colors.textOnPrimary;
  const textColor = isOutline ? Colors.primary : Colors.textOnPrimary;

  return (
    <TouchableWithoutFeedback
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          { transform: [{ scale }], opacity: disabled ? 0.5 : 1 },
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        <View
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
              style={{ marginRight: 8 }}
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
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
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
    fontWeight: FontWeight.bold,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
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
  disabled: {
    backgroundColor: '#B0A594',
  },
});
