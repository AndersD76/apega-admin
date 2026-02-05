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
import { colors, spacing, radius } from '../theme';
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

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>{MICROCOPY.appName}</Text>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <Pressable style={styles.searchContainer} onPress={onSearchPress}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Buscar produtos, marcas...</Text>
        </Pressable>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.iconButton} onPress={onNotificationPress}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </Pressable>

        <Pressable style={styles.iconButton} onPress={onCartPress}>
          <Ionicons name="bag-outline" size={24} color={colors.text} />
          {cartCount > 0 && (
            <View style={styles.badge}>
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
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.primary,
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
