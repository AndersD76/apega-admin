import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const isWeb = Platform.OS === 'web';

interface MainHeaderProps {
  navigation: any;
  showBack?: boolean;
  title?: string;
}

export default function MainHeader({ navigation, showBack = false, title }: MainHeaderProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 1024;
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          {showBack && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.logo}>
              apega<Text style={styles.logoLight}>desapega</Text>
            </Text>
          </TouchableOpacity>
          {title && <Text style={styles.headerTitle}>{title}</Text>}
        </View>

        {isDesktop && (
          <View style={styles.navDesktop}>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.navLink}>Explorar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
              <Text style={styles.navLink}>Favoritos</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.headerRight}>
          {isAuthenticated && user ? (
            <TouchableOpacity style={styles.headerUserBtn} onPress={() => navigation.navigate('Profile')}>
              <View style={styles.headerUserAvatar}>
                <Text style={styles.headerUserInitial}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={styles.headerUserName} numberOfLines={1}>
                {user.name || 'Usuario'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.headerBtnFilled} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.headerBtnFilledText}>Entrar</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: COLORS.surface,
    paddingHorizontal: isWeb ? 32 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  logo: {
    fontSize: isWeb ? 22 : 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  logoLight: {
    fontWeight: '300',
    color: COLORS.textTertiary,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  navDesktop: {
    flexDirection: 'row',
    gap: 24,
  },
  navLink: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtnFilled: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  headerBtnFilledText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textInverse,
  },
  headerUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  headerUserAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUserInitial: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textInverse,
  },
  headerUserName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: 120,
  },
});
