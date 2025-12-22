import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import BottomNavigation from '../components/BottomNavigation';
import { MainHeader } from '../components';
import { getFavorites, removeFromFavorites, FavoriteItem } from '../services/favorites';
import { useAuth } from '../contexts/AuthContext';

const isWeb = Platform.OS === 'web';

// Banner images
const BANNER_IMAGES = [
  { uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80', title: 'SEUS FAVORITOS', subtitle: 'Peças que você ama' },
  { uri: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80', title: 'ESTILO ÚNICO', subtitle: 'Moda consciente' },
];

interface FavoritesScreenProps {
  navigation: any;
}

export default function FavoritesScreen({ navigation }: FavoritesScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 768;
  const cardWidth = isDesktop ? (width - 160) / 4 : (width - 48) / 2;
  const styles = useMemo(() => createStyles(isDesktop, cardWidth), [isDesktop, cardWidth]);
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const response = await getFavorites();
      setFavorites(response.favorites || []);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFavorites();
    });
    return unsubscribe;
  }, [navigation, fetchFavorites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (productId: string) => {
    try {
      await removeFromFavorites(productId);
      setFavorites(prev => prev.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
    }
  };

  const formatPrice = (price: number | string | undefined | null) => {
    if (price === undefined || price === null) return 'R$ 0';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'R$ 0';
    return `R$ ${numPrice.toFixed(0)}`;
  };

  const getConditionStyle = (condition: string | undefined) => {
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('novo') && !cond.includes('semi')) return { bg: '#10B981', label: 'Novo' };
    if (cond.includes('seminovo') || cond.includes('semi')) return { bg: COLORS.primary, label: 'Seminovo' };
    return { bg: '#F59E0B', label: 'Usado' };
  };

  const renderProductCard = (item: FavoriteItem) => {
    const conditionInfo = getConditionStyle(item.condition);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
        activeOpacity={0.95}
      >
        <View style={styles.imageContainer}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[COLORS.primaryExtraLight, COLORS.primaryLight]}
              style={[styles.cardImage, styles.placeholderImage]}
            >
              <Ionicons name="image-outline" size={40} color={COLORS.primary} />
            </LinearGradient>
          )}

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleRemoveFavorite(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="heart" size={20} color="#EF4444" />
          </TouchableOpacity>

          {/* Condition Badge */}
          <View style={[styles.conditionBadge, { backgroundColor: conditionInfo.bg }]}>
            <Text style={styles.conditionText}>{conditionInfo.label}</Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          {item.brand && (
            <Text style={styles.brandText}>{item.brand}</Text>
          )}
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
          {item.size && (
            <View style={styles.sizeTag}>
              <Text style={styles.sizeText}>Tam: {item.size}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF9F7" />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.logo}>apega<Text style={styles.logoLight}>desapega</Text></Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner */}
        <Animated.View style={[styles.heroBanner, { opacity: bannerFade }]}>
          <Image
            source={{ uri: BANNER_IMAGES[currentBanner].uri }}
            style={styles.heroBannerImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroBannerOverlay}
          />
          <View style={styles.heroBannerContent}>
            <Text style={styles.heroBannerTitle}>{BANNER_IMAGES[currentBanner].title}</Text>
            <Text style={styles.heroBannerSubtitle}>{BANNER_IMAGES[currentBanner].subtitle}</Text>
          </View>
        </Animated.View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={64} color={COLORS.primaryLight} />
          </View>
          <Text style={styles.emptyTitle}>Faça login para ver seus favoritos</Text>
          <Text style={styles.emptySubtitle}>
            Salve suas peças favoritas e acompanhe preços
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Entrar na Conta</Text>
          </TouchableOpacity>
        </View>

        <BottomNavigation navigation={navigation} activeRoute="Favorites" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MainHeader navigation={navigation} title="Favoritos" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando favoritos...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {/* Banner */}
          <Animated.View style={[styles.heroBanner, { opacity: bannerFade }]}>
            <Image
              source={{ uri: BANNER_IMAGES[currentBanner].uri }}
              style={styles.heroBannerImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.heroBannerOverlay}
            />
            <View style={styles.heroBannerContent}>
              <Text style={styles.heroBannerTitle}>{BANNER_IMAGES[currentBanner].title}</Text>
              <Text style={styles.heroBannerSubtitle}>{BANNER_IMAGES[currentBanner].subtitle}</Text>
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

          {/* Count */}
          <View style={styles.countSection}>
            <Text style={styles.countText}>
              {favorites.length} {favorites.length === 1 ? 'peça favorita' : 'peças favoritas'}
            </Text>
          </View>

          {favorites.length === 0 ? (
            <View style={styles.emptyStateInline}>
              <View style={styles.emptyIcon}>
                <Ionicons name="heart-outline" size={64} color={COLORS.primaryLight} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
              <Text style={styles.emptySubtitle}>
                Toque no coração nas peças que você gostar para salvá-las aqui
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Search')}
              >
                <Text style={styles.exploreButtonText}>Explorar Peças</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.grid}>
              {favorites.map(renderProductCard)}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      <BottomNavigation navigation={navigation} activeRoute="Favorites" />
    </View>
  );
}

const createStyles = (isDesktop: boolean, cardWidth: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F7',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isDesktop ? 60 : 20,
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
  navLinkActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryExtraLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero Banner
  heroBanner: {
    height: isDesktop ? 250 : 180,
    marginHorizontal: isDesktop ? 60 : 16,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
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
    fontSize: isDesktop ? 42 : 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
  },
  heroBannerSubtitle: {
    fontSize: isDesktop ? 18 : 14,
    color: '#fff',
    marginTop: 4,
    fontWeight: '500',
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

  // Scroll
  scrollContent: {
    paddingBottom: 40,
  },

  // Count Section
  countSection: {
    paddingHorizontal: isDesktop ? 60 : 20,
    marginBottom: 20,
  },
  countText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[800],
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray[500],
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: isDesktop ? 52 : 12,
  },

  // Card
  card: {
    width: cardWidth,
    marginHorizontal: 8,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: COLORS.gray[100],
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conditionBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  cardInfo: {
    padding: 16,
  },
  brandText: {
    fontSize: 12,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 20,
  },
  cardPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  sizeTag: {
    backgroundColor: COLORS.primaryExtraLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateInline: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryExtraLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  loginButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  exploreButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 28,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
