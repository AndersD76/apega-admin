import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavigation, AppHeader, Button } from '../components';
import { loadToken, removeToken } from '../services/api';
import { getCurrentUser } from '../services/authService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

interface User {
  id: string;
  name: string;
  email: string;
  rating: number;
  total_reviews: number;
  total_sales: number;
  avatar_url: string | null;
}

interface QuickAction {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  iconColor?: string;
  badge?: string;
  premium?: boolean;
}

export default function ProfileScreen({ navigation }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const token = await loadToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeToken();
    setUser(null);
    setIsAuthenticated(false);
    navigation.navigate('Login');
  };

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      id: 'favorites',
      icon: 'heart',
      label: 'Favoritos',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      onPress: () => navigation.navigate('Favorites'),
    },
    {
      id: 'orders',
      icon: 'cube',
      label: 'Pedidos',
      color: '#6366F1',
      bgColor: '#E0E7FF',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      id: 'store',
      icon: 'storefront',
      label: 'Loja',
      color: '#10B981',
      bgColor: '#D1FAE5',
      onPress: () => navigation.navigate('MyStore'),
    },
    {
      id: 'sell',
      icon: 'add-circle',
      label: 'Vender',
      color: COLORS.primary,
      bgColor: '#E8F5E9',
      onPress: () => navigation.navigate('NewItem'),
    },
  ];

  // Menu Items by Section
  const storeMenuItems: MenuItem[] = [
    {
      icon: 'storefront-outline',
      title: 'Minha Loja',
      subtitle: 'Gerenciar produtos e anúncios',
      onPress: () => navigation.navigate('MyStore'),
    },
    {
      icon: 'stats-chart-outline',
      title: 'Estatísticas',
      subtitle: 'Acompanhe seu desempenho',
      onPress: () => navigation.navigate('Sales'),
    },
    {
      icon: 'cash-outline',
      title: 'Vendas',
      subtitle: user?.total_sales ? `${user.total_sales} vendas realizadas` : 'Histórico de vendas',
      onPress: () => navigation.navigate('Sales'),
    },
  ];

  const financialMenuItems: MenuItem[] = [
    {
      icon: 'diamond-outline',
      title: 'Seja Premium',
      subtitle: 'Taxa de apenas 1% por venda',
      onPress: () => navigation.navigate('Subscription'),
      iconColor: COLORS.premium,
      premium: true,
    },
    {
      icon: 'wallet-outline',
      title: 'Saldo e Cashback',
      subtitle: 'Ver saldo disponível',
      onPress: () => navigation.navigate('Balance'),
    },
    {
      icon: 'card-outline',
      title: 'Pagamentos',
      subtitle: 'Gerenciar formas de pagamento',
      onPress: () => navigation.navigate('Payments'),
    },
    {
      icon: 'location-outline',
      title: 'Endereços',
      subtitle: 'Endereços de entrega',
      onPress: () => navigation.navigate('Addresses'),
    },
  ];

  const supportMenuItems: MenuItem[] = [
    {
      icon: 'help-circle-outline',
      title: 'Ajuda e Suporte',
      subtitle: 'Tire suas dúvidas',
      onPress: () => navigation.navigate('Help'),
    },
    {
      icon: 'document-text-outline',
      title: 'Termos e Privacidade',
      onPress: () => navigation.navigate('Terms'),
    },
    {
      icon: 'log-out-outline',
      title: 'Sair da Conta',
      onPress: handleLogout,
      iconColor: COLORS.error,
    },
  ];

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.quickAction}
      onPress={action.onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: action.bgColor }]}>
        <Ionicons name={action.icon} size={22} color={action.color} />
      </View>
      <Text style={styles.quickActionLabel}>{action.label}</Text>
    </TouchableOpacity>
  );

  const renderMenuItem = (item: MenuItem, isLast: boolean = false) => (
    <TouchableOpacity
      key={item.title}
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.menuIconContainer,
        item.premium && styles.menuIconPremium,
        { backgroundColor: item.premium ? '#FEF3C7' : COLORS.gray[100] }
      ]}>
        <Ionicons
          name={item.icon}
          size={20}
          color={item.iconColor || COLORS.textPrimary}
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, item.iconColor === COLORS.error && { color: COLORS.error }]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      {item.premium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>PRO</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
    </TouchableOpacity>
  );

  const renderMenuSection = (title: string, items: MenuItem[]) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {items.map((item, index) => renderMenuItem(item, index === items.length - 1))}
      </View>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <BottomNavigation navigation={navigation} activeRoute="Profile" />
      </View>
    );
  }

  // Not authenticated - Premium Login Prompt
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.loginHero}
        >
          <View style={styles.loginHeroContent}>
            <View style={styles.loginIconCircle}>
              <Ionicons name="person" size={48} color={COLORS.white} />
            </View>
            <Text style={styles.loginHeroTitle}>Entre na sua conta</Text>
            <Text style={styles.loginHeroSubtitle}>
              Acesse favoritos, compras, vendas e muito mais
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.loginContent}>
          <View style={styles.loginFeatures}>
            <View style={styles.loginFeature}>
              <View style={[styles.loginFeatureIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="heart" size={20} color="#EF4444" />
              </View>
              <Text style={styles.loginFeatureText}>Salve seus favoritos</Text>
            </View>
            <View style={styles.loginFeature}>
              <View style={[styles.loginFeatureIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="cube" size={20} color="#6366F1" />
              </View>
              <Text style={styles.loginFeatureText}>Acompanhe pedidos</Text>
            </View>
            <View style={styles.loginFeature}>
              <View style={[styles.loginFeatureIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="cash" size={20} color="#10B981" />
              </View>
              <Text style={styles.loginFeatureText}>Venda suas peças</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButtonGradient}
            >
              <Text style={styles.loginButtonText}>Entrar</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.registerButtonText}>
              Não tem conta? <Text style={styles.registerLink}>Cadastre-se grátis</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <BottomNavigation navigation={navigation} activeRoute="Profile" />
      </View>
    );
  }

  // Authenticated - Profile Dashboard
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.profileHeader}
        >
          <View style={styles.profileHeaderContent}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => navigation.navigate('EditProfile')}
            >
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={12} color={COLORS.white} />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>

              <View style={styles.ratingRow}>
                <View style={styles.starsContainer}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={14}
                      color={i < Math.floor(typeof user.rating === 'number' ? user.rating : parseFloat(user.rating || '0')) ? '#FFD700' : 'rgba(255,255,255,0.3)'}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {typeof user.rating === 'number' ? user.rating.toFixed(1) : parseFloat(user.rating || '0').toFixed(1)} ({user.total_reviews || 0} avaliações)
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.total_sales || 0}</Text>
              <Text style={styles.statLabel}>Vendas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.total_reviews || 0}</Text>
              <Text style={styles.statLabel}>Avaliações</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{typeof user.rating === 'number' ? user.rating.toFixed(1) : parseFloat(user.rating || '0').toFixed(1)}</Text>
              <Text style={styles.statLabel}>Nota</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Menu Sections */}
        {renderMenuSection('Sua Loja', storeMenuItems)}
        {renderMenuSection('Financeiro', financialMenuItems)}
        {renderMenuSection('Mais Opções', supportMenuItems)}

        {/* Version */}
        <Text style={styles.version}>Apega Desapega v1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Login Screen Styles
  loginHero: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  loginHeroContent: {
    alignItems: 'center',
  },
  loginIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  loginHeroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
  },
  loginHeroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  loginContent: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  loginFeatures: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  loginFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  loginFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginFeatureText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  loginButton: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  registerButton: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  registerButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Profile Header
  profileHeader: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Quick Actions
  quickActionsContainer: {
    marginTop: -20,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    justifyContent: 'space-around',
    ...SHADOWS.lg,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Menu Sections
  menuSection: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuIconPremium: {
    borderWidth: 1,
    borderColor: COLORS.premium,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 1,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  premiumBadge: {
    backgroundColor: COLORS.premium,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // Version
  version: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
