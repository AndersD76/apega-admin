import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, componentSizes, getColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { MICROCOPY } from '../constants';

interface HeaderProps {
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  onCartPress?: () => void;
  showSearch?: boolean;
  cartCount?: number;
}

export function Header({
  onSearchPress,
  onNotificationPress,
  onCartPress,
  showSearch = true,
  cartCount = 0,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const { isMobile, getResponsiveValue } = useResponsive();

  const iconSize = getResponsiveValue(componentSizes.icon.md, componentSizes.icon.md, componentSizes.icon.lg);
  const buttonSize = getResponsiveValue(componentSizes.button.sm, componentSizes.button.md, componentSizes.button.md);
  const logoSize = getResponsiveValue(22, 24, 26);
  const horizontalPadding = getResponsiveValue(spacing.md, spacing.lg, spacing.xl);

  return (
    <View style={[styles.container, {
      paddingTop: insets.top + spacing.sm,
      paddingHorizontal: horizontalPadding,
      backgroundColor: themeColors.surface,
      borderBottomColor: themeColors.border,
    }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={[styles.logo, { fontSize: logoSize, color: themeColors.primary }]}>{MICROCOPY.appName}</Text>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <Pressable style={[styles.searchContainer, {
          backgroundColor: themeColors.background,
          borderColor: themeColors.border,
        }]} onPress={onSearchPress}>
          <Ionicons name="search" size={18} color={themeColors.textMuted} />
          <Text style={[styles.searchPlaceholder, { color: themeColors.textMuted }]}>
            {isMobile ? 'Buscar...' : 'Buscar produtos, marcas...'}
          </Text>
        </Pressable>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={[styles.iconButton, { width: buttonSize, height: buttonSize }]} onPress={onNotificationPress}>
          <Ionicons name="notifications-outline" size={iconSize} color={themeColors.text} />
        </Pressable>

        <Pressable style={[styles.iconButton, { width: buttonSize, height: buttonSize }]} onPress={onCartPress}>
          <Ionicons name="bag-outline" size={iconSize} color={themeColors.text} />
          {cartCount > 0 && (
            <View style={[styles.badge, { backgroundColor: themeColors.primary }]}>
              <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logo: {
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    minHeight: componentSizes.button.md,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: radius.md,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default Header;
