import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';

interface AppHeaderProps {
  navigation: any;
  cartCount?: number;
  notificationCount?: number;
}

export function BrandLogo({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizes = {
    small: 16,
    medium: 20,
    large: 28,
  };

  return (
    <View style={brandStyles.nameRow}>
      <Text style={[brandStyles.apega, { fontSize: sizes[size] }]}>apega</Text>
      <Text style={[brandStyles.desapega, { fontSize: sizes[size] }]}>desapega</Text>
    </View>
  );
}

const brandStyles = StyleSheet.create({
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  apega: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  desapega: {
    fontWeight: '300',
    color: COLORS.textSecondary,
    letterSpacing: -0.3,
  },
});

export default function AppHeader({ navigation, cartCount = 0, notificationCount = 0 }: AppHeaderProps) {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <BrandLogo size="medium" />
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.7}
          >
            <Ionicons name="bag-outline" size={20} color={COLORS.textPrimary} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textInverse,
  },
});
