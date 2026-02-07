import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows, componentSizes, getColors } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const isDisabled = disabled || loading;

  // Use componentSizes for consistent button heights
  const buttonHeight = {
    sm: componentSizes.button.sm,
    md: componentSizes.button.md,
    lg: componentSizes.button.lg,
  }[size];

  const buttonStyles = [
    styles.button,
    { height: buttonHeight },
    styles[`button_${size}`],
    styles[`button_${variant}`],
    variant === 'primary' && { backgroundColor: themeColors.primary },
    variant === 'secondary' && { backgroundColor: themeColors.primaryMuted },
    variant === 'outline' && { borderColor: themeColors.primary },
    variant === 'danger' && { backgroundColor: themeColors.error },
    fullWidth && styles.fullWidth,
    isDisabled && { backgroundColor: themeColors.gray200 },
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${size}`],
    styles[`text_${variant}`],
    variant === 'secondary' && { color: themeColors.primary },
    variant === 'outline' && { color: themeColors.primary },
    variant === 'ghost' && { color: themeColors.primary },
    isDisabled && { color: themeColors.gray400 },
    textStyle,
  ];

  // Use componentSizes for icon sizes
  const iconSize = size === 'sm' ? componentSizes.icon.sm : size === 'lg' ? componentSizes.icon.lg : componentSizes.icon.md;
  const iconColor = variant === 'primary' || variant === 'danger' ? themeColors.white : themeColors.primary;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? themeColors.white : themeColors.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={isDisabled ? themeColors.gray400 : iconColor}
              style={styles.iconLeft}
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={isDisabled ? themeColors.gray400 : iconColor}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </>
  );

  if (variant === 'primary' && !isDisabled) {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          buttonStyles,
          pressed && styles.buttonPressed,
        ]}
      >
        <LinearGradient
          colors={[themeColors.primary, themeColors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        buttonStyles,
        pressed && styles.buttonPressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingHorizontal: spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    backgroundColor: colors.gray200,
  },

  // Sizes (heights applied dynamically via componentSizes)
  button_sm: {
    paddingHorizontal: spacing.md,
  },
  button_md: {
    paddingHorizontal: spacing.xl,
  },
  button_lg: {
    paddingHorizontal: spacing['2xl'],
  },

  // Variants
  button_primary: {
    backgroundColor: colors.primary,
    ...shadows.primary(0.2),
  },
  button_secondary: {
    backgroundColor: colors.primaryMuted,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_danger: {
    backgroundColor: colors.error,
  },

  // Text
  text: {
    fontWeight: '600',
  },
  text_sm: {
    fontSize: 13,
  },
  text_md: {
    fontSize: 15,
  },
  text_lg: {
    fontSize: 17,
  },
  text_primary: {
    color: colors.white,
  },
  text_secondary: {
    color: colors.primary,
  },
  text_outline: {
    color: colors.primary,
  },
  text_ghost: {
    color: colors.primary,
  },
  text_danger: {
    color: colors.white,
  },
  textDisabled: {
    color: colors.gray400,
  },

  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});

export default Button;
