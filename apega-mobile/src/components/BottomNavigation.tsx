import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

const isWeb = Platform.OS === 'web';

interface BottomNavigationProps {
  navigation: any;
  activeRoute?: string;
}

const NAV_ITEMS = [
  { key: 'Home', icon: 'home', label: 'Inicio' },
  { key: 'Search', icon: 'search', label: 'Buscar' },
  { key: 'NewItem', icon: 'add', label: 'Vender', isCenter: true },
  { key: 'Favorites', icon: 'heart', label: 'Salvos' },
  { key: 'Profile', icon: 'person', label: 'Perfil' },
];

export default function BottomNavigation({ navigation, activeRoute = 'Home' }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isAuthenticated } = useAuth();
  const isDesktop = isWeb && width > 768;

  if (isDesktop) return null;

  const navigateWithAuth = (route: string, redirectTo?: string) => {
    if (isAuthenticated) {
      navigation.navigate(route);
    } else {
      navigation.navigate('Login', redirectTo ? { redirectTo } : undefined);
    }
  };

  const handlePress = (key: string) => {
    if (key === 'NewItem' || key === 'Favorites') {
      navigateWithAuth(key, key);
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
          style={styles.centerBtnWrap}
          onPress={() => handlePress(item.key)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerBtn}
          >
            <Ionicons name="add" size={32} color="#FFF" />
          </LinearGradient>
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
        <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
          <Ionicons
            name={isActive ? (item.icon as any) : (`${item.icon}-outline` as any)}
            size={24}
            color={isActive ? '#8B5CF6' : '#94A3B8'}
          />
        </View>
        <Text style={[styles.label, isActive && styles.labelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const NavContent = () => (
    <View style={[styles.navBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {NAV_ITEMS.map(renderNavItem)}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={90} tint="light" style={styles.container}>
        <NavContent />
      </BlurView>
    );
  }

  return (
    <View style={[styles.container, styles.containerSolid]}>
      <NavContent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {},
      android: { elevation: 20 },
      web: { boxShadow: '0 -4px 30px rgba(0,0,0,0.1)' },
    }),
  },
  containerSolid: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
  },
  labelActive: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
  centerBtnWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    marginHorizontal: 4,
  },
  centerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)' },
    }),
  },
});
