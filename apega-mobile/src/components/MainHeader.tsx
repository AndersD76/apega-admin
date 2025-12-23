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
  const isTablet = isWeb && width > 600 && width <= 1024;
  const { user, isAuthenticated } = useAuth();

  const handleSellPress = () => {
    if (isAuthenticated) {
      navigation.navigate('NewItem');
    } else {
      navigation.navigate('Login', { redirectTo: 'NewItem' });
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F7" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          {showBack && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
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
            <TouchableOpacity onPress={handleSellPress}>
              <Text style={styles.navLink}>Venda conosco</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
              <Text style={styles.navLink}>Favoritos</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.headerRight}>
          {isAuthenticated && user ? (
            <TouchableOpacity
              style={styles.headerUserBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              {(() => {
                const isPremium = user.subscription_type === 'premium';
                return (
                  <>
                    <View style={[
                      styles.headerUserAvatar,
                      isPremium && styles.headerUserAvatarPremium
                    ]}>
                      <Text style={styles.headerUserInitial}>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.headerUserInfo}>
                      <Text style={styles.headerUserName} numberOfLines={1}>
                        {user.name || 'Usuario'}
                      </Text>
                      {isPremium && (
                        <View style={styles.headerUserBadgePremium}>
                          <Text style={styles.headerUserBadgeTextPremium}>PREMIUM</Text>
                        </View>
                      )}
                    </View>
                  </>
                );
              })()}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.headerBtnFilled}
              onPress={() => navigation.navigate('Profile')}
            >
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
    backgroundColor: '#FAF9F7',
    paddingHorizontal: isWeb ? 40 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  logo: {
    fontSize: isWeb ? 22 : 20,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  logoLight: {
    fontWeight: '400',
    color: COLORS.gray[600],
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginLeft: 16,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.gray[300],
  },
  navDesktop: {
    flexDirection: 'row',
    gap: 32,
  },
  navLink: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtnFilled: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  headerBtnFilledText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  headerUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: COLORS.primaryExtraLight || '#f0f5f3',
  },
  headerUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUserAvatarPremium: {
    backgroundColor: '#7B1FA2',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  headerUserInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  headerUserInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  headerUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    maxWidth: 150,
  },
  headerUserBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  headerUserBadgeFree: {
    backgroundColor: COLORS.gray[200],
  },
  headerUserBadgePremium: {
    backgroundColor: '#FFD700',
  },
  headerUserBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gray[600],
    letterSpacing: 0.5,
  },
  headerUserBadgeTextPremium: {
    color: '#7B1FA2',
  },
});
