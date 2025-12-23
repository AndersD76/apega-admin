import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const isWeb = Platform.OS === 'web';

interface BottomNavigationProps {
  navigation: any;
  activeRoute?: string;
}

const NAV_ITEMS = [
  { key: 'Home', icon: 'home', label: 'inicio' },
  { key: 'Search', icon: 'search', label: 'buscar' },
  { key: 'NewItem', icon: 'add', label: 'vender', isCenter: true },
  { key: 'Favorites', icon: 'heart', label: 'curtidos' },
  { key: 'Profile', icon: 'person', label: 'eu' },
];

export default function BottomNavigation({ navigation, activeRoute = 'Home' }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isAuthenticated } = useAuth();
  const isDesktop = isWeb && width > 768;

  if (isDesktop) {
    return null;
  }

  const navigateWithAuth = (route: string, redirectTo?: string) => {
    if (isAuthenticated) {
      navigation.navigate(route);
    } else if (redirectTo) {
      navigation.navigate('Login', { redirectTo });
    } else {
      navigation.navigate('Login');
    }
  };

  const handlePress = (key: string) => {
    if (key === 'NewItem') {
      navigateWithAuth(key, 'NewItem');
    } else if (key === 'Favorites') {
      navigateWithAuth(key);
    } else {
      navigation.navigate(key);
    }
  };

  const renderNavItem = (item: typeof NAV_ITEMS[0]) => {
    const isActive = activeRoute === item.key;

    if (item.isCenter) {
      return (
        <TouchableOpacity
          key={item.key}
          style={styles.centerButton}
          onPress={() => handlePress(item.key)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerButtonGradient}
          >
            <Ionicons name="add" size={26} color={COLORS.white} />
          </LinearGradient>
          <Text style={styles.centerLabel}>{item.label}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={item.key}
        style={styles.navItem}
        onPress={() => handlePress(item.key)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={isActive ? (item.icon as any) : (`${item.icon}-outline` as any)}
            size={22}
            color={isActive ? COLORS.textPrimary : COLORS.textTertiary}
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
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
    color: COLORS.textTertiary,
    fontWeight: '500',
    marginTop: 2,
  },
  navLabelActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  centerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    marginHorizontal: 8,
  },
  centerButtonGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(97,0,93,0.25)',
      },
    }),
  },
  centerLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },
});
