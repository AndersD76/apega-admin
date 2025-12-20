import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { loadToken } from '../services/api';

interface BottomNavigationProps {
  navigation: any;
  activeRoute?: string;
}

const NAV_ITEMS = [
  { key: 'Home', icon: 'home', label: 'início' },
  { key: 'Search', icon: 'search', label: 'apegar' },
  { key: 'NewItem', icon: 'add', label: 'vender', isCenter: true },
  { key: 'Favorites', icon: 'heart', label: 'favoritos' },
  { key: 'Profile', icon: 'person', label: 'perfil' },
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

    // Botão central premium - VENDER
    if (item.isCenter) {
      return (
        <TouchableOpacity
          key={item.key}
          style={styles.centerButton}
          onPress={() => handlePress(item.key)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, '#3d5a4c'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerButtonGradient}
          >
            <Ionicons name="add" size={26} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    // Itens normais - minimalista
    return (
      <TouchableOpacity
        key={item.key}
        style={styles.navItem}
        onPress={() => handlePress(item.key)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={isActive ? item.icon as any : `${item.icon}-outline` as any}
            size={22}
            color={isActive ? COLORS.primary : '#8E8E93'}
          />
          {isActive && <View style={styles.activeIndicator} />}
        </View>
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.navBar}>
        {NAV_ITEMS.map(renderNavItem)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 12px rgba(0,0,0,0.04)',
      },
    }),
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  navLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  centerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    marginHorizontal: 8,
  },
  centerButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(107,144,128,0.4)',
      },
    }),
  },
});
