import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { BottomNavigation } from '../components';
import { loadToken, removeToken } from '../services/api';
import { getCurrentUser } from '../services/authService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';
const MAX_CONTENT_WIDTH = 600;

// Banner images
const BANNER_IMAGES = [
  { uri: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80', title: 'SUA CONTA', subtitle: 'Gerencie seus dados' },
  { uri: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80', title: 'VENDA CONOSCO', subtitle: 'Lucre com moda circular' },
];

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

export default function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = isWeb && windowWidth > 768;
  const contentWidth = isDesktop ? Math.min(windowWidth * 0.9, MAX_CONTENT_WIDTH) : windowWidth;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Banner carousel
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(bannerFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentBanner((prev) => (prev + 1) % BANNER_IMAGES.length);
        Animated.timing(bannerFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerFade]);

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
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={[styles.webWrapper, isDesktop && styles.webWrapperDesktop]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>carregando...</Text>
          </View>
        </View>
        <BottomNavigation navigation={navigation} activeRoute="Profile" />
      </View>
    );
  }

  // Not authenticated - Enjoei style login prompt
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF9F7" />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.logo}>apega<Text style={styles.logoLight}>desapega</Text></Text>
          </TouchableOpacity>
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
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.scrollContentDesktop,
          ]}
        >
          <View style={[
            styles.contentWrapper,
            isDesktop && { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }
          ]}>
            {/* Banner Hero */}
            <Animated.View style={[
              styles.heroBanner,
              { opacity: bannerFade },
              isDesktop && styles.heroBannerDesktop
            ]}>
              <Image
                source={{ uri: BANNER_IMAGES[currentBanner].uri }}
                style={styles.heroBannerImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.heroBannerOverlay}
              />
              <View style={styles.heroBannerContent}>
                <Text style={[styles.heroBannerTitle, isDesktop && styles.heroBannerTitleDesktop]}>
                  {BANNER_IMAGES[currentBanner].title}
                </Text>
                <Text style={[styles.heroBannerSubtitle, isDesktop && styles.heroBannerSubtitleDesktop]}>
                  {BANNER_IMAGES[currentBanner].subtitle}
                </Text>
              </View>
              <View style={styles.bannerDots}>
                {BANNER_IMAGES.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.bannerDot, currentBanner === index && styles.bannerDotActive]}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Login Hero */}
            <View style={styles.loginHero}>
              <View style={styles.loginIconCircle}>
                <Ionicons name="heart" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.loginTitle}>Oi, bora desapegar?</Text>
              <Text style={styles.loginSubtitle}>
                Entre pra salvar favoritos, vender suas peças e acompanhar seus pedidos
              </Text>
            </View>

            {/* Login Actions */}
            <View style={styles.loginActions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryBtnText}>entrar ou criar conta</Text>
              </TouchableOpacity>
            </View>

            {/* Features */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>por que entrar?</Text>

              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="heart" size={20} color="#EF4444" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureLabel}>favoritos</Text>
                  <Text style={styles.featureDesc}>salve as peças que você amou</Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="pricetag" size={20} color="#10B981" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureLabel}>venda fácil</Text>
                  <Text style={styles.featureDesc}>anuncie e ganhe dinheiro</Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="cube" size={20} color="#6366F1" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureLabel}>pedidos</Text>
                  <Text style={styles.featureDesc}>acompanhe tudo em um lugar</Text>
                </View>
              </View>
            </View>

            {/* About Section - Story of Apega Desapega */}
            <View style={styles.aboutSection}>
              <LinearGradient
                colors={['#f8f4f0', '#fff5eb']}
                style={styles.aboutGradient}
              >
                <Text style={styles.aboutTitle}>nossa história</Text>

                <View style={styles.founderCard}>
                  <View style={styles.founderImagePlaceholder}>
                    <Ionicons name="person" size={32} color={COLORS.primary} />
                  </View>
                  <View style={styles.founderInfo}>
                    <Text style={styles.founderName}>amanda maier</Text>
                    <Text style={styles.founderRole}>fundadora</Text>
                  </View>
                </View>

                <Text style={styles.aboutText}>
                  a apega desapega nasceu de uma lojinha física em passo fundo, rio grande do sul.
                  começou pequena, com a paixão da amanda por moda circular e sustentabilidade.
                </Text>

                <Text style={styles.aboutText}>
                  hoje somos um brechó destaque no RS, conectando pessoas que amam moda consciente.
                  cada peça tem história, e agora você pode fazer parte da nossa.
                </Text>

                <View style={styles.aboutBadges}>
                  <View style={styles.aboutBadge}>
                    <Ionicons name="location" size={14} color={COLORS.primary} />
                    <Text style={styles.aboutBadgeText}>passo fundo, rs</Text>
                  </View>
                  <View style={styles.aboutBadge}>
                    <Ionicons name="leaf" size={14} color="#10B981" />
                    <Text style={styles.aboutBadgeText}>moda sustentável</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={{ height: 120 }} />
          </View>
        </ScrollView>

        <BottomNavigation navigation={navigation} activeRoute="Profile" />
      </View>
    );
  }

  // Authenticated - Profile Dashboard
  const rating = typeof user.rating === 'number' ? user.rating : parseFloat(user.rating || '0');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F7" />

      {/* Header Padrão */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.logo}>apega<Text style={styles.logoLight}>desapega</Text></Text>
        </TouchableOpacity>
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
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
      >
        <View style={[
          styles.contentWrapper,
          isDesktop && { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }
        ]}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => navigation.navigate('EditProfile')}
            >
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {user.name?.charAt(0)?.toLowerCase() || 'u'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.userName}>{user.name?.toLowerCase()}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            {/* Rating */}
            <View style={styles.ratingRow}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < Math.floor(rating) ? 'star' : 'star-outline'}
                  size={16}
                  color={i < Math.floor(rating) ? '#FFD700' : '#ddd'}
                />
              ))}
              <Text style={styles.ratingText}>
                {rating.toFixed(1)} ({user.total_reviews || 0})
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.total_sales || 0}</Text>
                <Text style={styles.statLabel}>vendas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.total_reviews || 0}</Text>
                <Text style={styles.statLabel}>avaliações</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Favorites')}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="heart" size={20} color="#EF4444" />
              </View>
              <Text style={styles.quickLabel}>favoritos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Orders')}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="cube" size={20} color="#6366F1" />
              </View>
              <Text style={styles.quickLabel}>pedidos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('MyStore')}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="storefront" size={20} color="#10B981" />
              </View>
              <Text style={styles.quickLabel}>minha loja</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('NewItem')}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="add-circle" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.quickLabel}>vender</Text>
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('MyStore')}
            >
              <Ionicons name="storefront-outline" size={20} color="#333" />
              <Text style={styles.menuText}>minha loja</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Sales')}
            >
              <Ionicons name="stats-chart-outline" size={20} color="#333" />
              <Text style={styles.menuText}>minhas vendas</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Balance')}
            >
              <Ionicons name="wallet-outline" size={20} color="#333" />
              <Text style={styles.menuText}>saldo</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Addresses')}
            >
              <Ionicons name="location-outline" size={20} color="#333" />
              <Text style={styles.menuText}>endereços</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Help')}
            >
              <Ionicons name="help-circle-outline" size={20} color="#333" />
              <Text style={styles.menuText}>ajuda</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={[styles.menuText, { color: '#EF4444' }]}>sair</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View style={styles.aboutSection}>
            <LinearGradient
              colors={['#f8f4f0', '#fff5eb']}
              style={styles.aboutGradient}
            >
              <Text style={styles.aboutTitle}>nossa história</Text>

              <View style={styles.founderCard}>
                <View style={styles.founderImagePlaceholder}>
                  <Ionicons name="person" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.founderInfo}>
                  <Text style={styles.founderName}>amanda maier</Text>
                  <Text style={styles.founderRole}>fundadora</Text>
                </View>
              </View>

              <Text style={styles.aboutText}>
                a apega desapega nasceu de uma lojinha física em passo fundo, rio grande do sul.
                começou pequena, com a paixão da amanda por moda circular e sustentabilidade.
              </Text>

              <Text style={styles.aboutText}>
                hoje somos um brechó destaque no RS, conectando pessoas que amam moda consciente.
                cada peça tem história, e agora você pode fazer parte da nossa.
              </Text>

              <View style={styles.aboutBadges}>
                <View style={styles.aboutBadge}>
                  <Ionicons name="location" size={14} color={COLORS.primary} />
                  <Text style={styles.aboutBadgeText}>passo fundo, rs</Text>
                </View>
                <View style={styles.aboutBadge}>
                  <Ionicons name="leaf" size={14} color="#10B981" />
                  <Text style={styles.aboutBadgeText}>moda sustentável</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Version */}
          <Text style={styles.version}>apega desapega v1.0.0</Text>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F7',
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollContentDesktop: {
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
  webWrapper: {
    flex: 1,
  },
  webWrapperDesktop: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FAF9F7',
  },
  logo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  logoLight: {
    fontWeight: '400',
    color: COLORS.gray[400],
  },
  navDesktop: {
    flexDirection: 'row',
    gap: 32,
  },
  navLink: {
    fontSize: 15,
    color: COLORS.gray[700],
    fontWeight: '500',
  },

  // Hero Banner
  heroBanner: {
    height: 180,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBannerDesktop: {
    height: 220,
    marginHorizontal: 0,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  heroBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBannerContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
  },
  heroBannerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
  },
  heroBannerTitleDesktop: {
    fontSize: 36,
  },
  heroBannerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    fontWeight: '500',
  },
  heroBannerSubtitleDesktop: {
    fontSize: 16,
  },
  bannerDots: {
    position: 'absolute',
    bottom: 16,
    right: 24,
    flexDirection: 'row',
    gap: 8,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  bannerDotActive: {
    backgroundColor: '#fff',
    width: 20,
  },

  // Login Hero
  loginHero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    position: 'relative',
  },
  loginIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryExtraLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  loginSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
  },

  // Login Actions
  loginActions: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // Features
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 20,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 15,
    color: '#666',
  },

  // About Section
  aboutSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  aboutGradient: {
    borderRadius: 16,
    padding: 24,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  founderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  founderImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  founderInfo: {
    flex: 1,
  },
  founderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  founderRole: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  aboutText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 12,
  },
  aboutBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  aboutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  aboutBadgeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  // Profile Card (authenticated)
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    marginBottom: 16,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f7f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F7',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 40,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
    marginHorizontal: 20,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 20,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
  },

  // Menu Section
  menuSection: {
    marginHorizontal: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },

  // Version
  version: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
});
