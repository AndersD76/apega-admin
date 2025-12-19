import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../constants/theme';
import { loadToken } from '../services/api';

interface BottomNavigationProps {
  navigation: any;
  activeRoute?: string;
}

const NAV_ITEMS = [
  { key: 'Home', icon: 'grid', label: 'início' },
  { key: 'Search', icon: 'compass', label: 'apegar' },
  { key: 'NewItem', icon: 'add', label: 'desapegar', isCenter: true },
  { key: 'Favorites', icon: 'heart', label: 'apegos' },
  { key: 'Profile', icon: 'person-circle', label: 'eu' },
];

export default function BottomNavigation({ navigation, activeRoute = 'Home' }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await loadToken();
    setIsAuthenticated(!!token);
  };

  const navigateWithAuth = (route: string) => {
    if (isAuthenticated) {
      navigation.navigate(route);
    } else {
      navigation.navigate('Login');
    }
  };

  const handlePress = (key: string) => {
    if (key === 'NewItem' || key === 'Favorites') {
      navigateWithAuth(key);
    } else {
      navigation.navigate(key);
    }
  };

  const renderNavItem = (item: typeof NAV_ITEMS[0]) => {
    const isActive = activeRoute === item.key;

    // Botão central com gradiente
    if (item.isCenter) {
      return (
        <TouchableOpacity
          key={item.key}
          style={styles.centerButton}
          onPress={() => handlePress(item.key)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#6B9080', '#2d3b35', '#1a1a1a'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerButtonGradient}
          >
            <View style={styles.centerButtonInner}>
              <Ionicons name="add" size={28} color={COLORS.white} />
            </View>
          </LinearGradient>
          <Text style={styles.centerLabel}>{item.label}</Text>
        </TouchableOpacity>
      );
    }

    // Itens normais
    return (
      <TouchableOpacity
        key={item.key}
        style={styles.navItem}
        onPress={() => handlePress(item.key)}
        activeOpacity={0.7}
      >
        {isActive ? (
          <LinearGradient
            colors={[COLORS.primary, '#3d5a4c'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeIconBg}
          >
            <Ionicons
              name={item.icon as any}
              size={20}
              color={COLORS.white}
            />
          </LinearGradient>
        ) : (
          <View style={styles.inactiveIconBg}>
            <Ionicons
              name={`${item.icon}-outline` as any}
              size={20}
              color="#9CA3AF"
            />
          </View>
        )}
        <Text style={[
          styles.navLabel,
          isActive && styles.navLabelActive
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.navBar}>
        {NAV_ITEMS.map(renderNavItem)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      },
    }),
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  activeIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  navLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  centerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -28,
  },
  centerButtonGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#1a1a1a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 6px 16px rgba(26,26,26,0.35)',
      },
    }),
  },
  centerButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  centerLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});
