import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';

interface AppHeaderProps {
  navigation: any;
  cartCount?: number;
  notificationCount?: number;
}

// Componente de Logo com texto estilizado
export function BrandLogo({ size = 'medium', color = 'light' }: { size?: 'small' | 'medium' | 'large'; color?: 'light' | 'dark' }) {
  const sizes = {
    small: { main: 16, sub: 9 },
    medium: { main: 20, sub: 10 },
    large: { main: 32, sub: 14 },
  };

  const colors = {
    light: {
      apega: COLORS.white,
      desapega: 'rgba(255,255,255,0.8)',
      tagline: 'rgba(255,255,255,0.65)',
    },
    dark: {
      apega: COLORS.primary,
      desapega: COLORS.primaryLight,
      tagline: COLORS.textSecondary,
    },
  };

  const currentSize = sizes[size];
  const currentColor = colors[color];

  return (
    <View style={brandStyles.nameRow}>
      <Text style={[brandStyles.apega, { fontSize: currentSize.main, color: currentColor.apega }]}>
        apega
      </Text>
      <Text style={[brandStyles.desapega, { fontSize: currentSize.main, color: currentColor.desapega }]}>
        desapega
      </Text>
    </View>
  );
}

const brandStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  apega: {
    fontWeight: '800',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  desapega: {
    fontWeight: '300',
    letterSpacing: -0.3,
  },
  tagline: {
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: -1,
  },
});

export default function AppHeader({ navigation, cartCount = 0, notificationCount = 0 }: AppHeaderProps) {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark || '#527363']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Logo em Texto */}
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <BrandLogo size="medium" color="light" />
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Buscar */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>

          {/* Sacolinha */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.7}
          >
            <Ionicons name="bag-outline" size={22} color={COLORS.white} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Notificações */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF385C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
});
