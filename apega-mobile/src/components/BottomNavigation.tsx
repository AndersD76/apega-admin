import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../constants/theme';
import { loadToken } from '../services/api';

interface BottomNavigationProps {
  navigation: any;
  activeRoute?: string;
}

export default function BottomNavigation({ navigation, activeRoute = 'Home' }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth status
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await loadToken();
    setIsAuthenticated(!!token);
  };

  // Navigate with auth check
  const navigateWithAuth = (route: string) => {
    if (isAuthenticated) {
      navigation.navigate(route);
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>
      {/* 1. Home */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons
          name={activeRoute === 'Home' ? 'home' : 'home-outline'}
          size={22}
          color={activeRoute === 'Home' ? COLORS.primary : '#9CA3AF'}
        />
        <Text style={[
          styles.navLabel,
          activeRoute === 'Home' && styles.navLabelActive
        ]}>
          home
        </Text>
      </TouchableOpacity>

      {/* 2. Buscar */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Search')}
      >
        <Ionicons
          name={activeRoute === 'Search' ? 'search' : 'search-outline'}
          size={22}
          color={activeRoute === 'Search' ? COLORS.primary : '#9CA3AF'}
        />
        <Text style={[
          styles.navLabel,
          activeRoute === 'Search' && styles.navLabelActive
        ]}>
          apegar
        </Text>
      </TouchableOpacity>

      {/* 3. DESAPEGAR - Botão central destacado */}
      <TouchableOpacity
        style={styles.sellButton}
        onPress={() => navigateWithAuth('NewItem')}
      >
        <View style={styles.sellButtonInner}>
          <Ionicons name="pricetag" size={24} color={COLORS.white} />
        </View>
        <Text style={styles.sellLabel}>desapegar</Text>
      </TouchableOpacity>

      {/* 4. Meu Apegos (Favoritos) - requer auth */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigateWithAuth('Favorites')}
      >
        <Ionicons
          name={activeRoute === 'Favorites' ? 'heart' : 'heart-outline'}
          size={22}
          color={activeRoute === 'Favorites' ? COLORS.primary : '#9CA3AF'}
        />
        <Text style={[
          styles.navLabel,
          activeRoute === 'Favorites' && styles.navLabelActive
        ]}>
          favoritos
        </Text>
      </TouchableOpacity>

      {/* 5. Perfil */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons
          name={activeRoute === 'Profile' ? 'person' : 'person-outline'}
          size={22}
          color={activeRoute === 'Profile' ? COLORS.primary : '#9CA3AF'}
        />
        <Text style={[
          styles.navLabel,
          activeRoute === 'Profile' && styles.navLabelActive
        ]}>
          perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  sellButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -20,
  },
  sellButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  sellLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});
