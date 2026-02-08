import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { productsService, cartService, favoritesService, auctionsService } from '../api';
import { formatPrice } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import {
  AuctionInviteModal,
  AnimatedQuartaBanner,
  AnimatedHeroBanner,
  AnimatedOffersBanner,
  HangerIcon,
  RecycleIcon,
  DressIcon,
  ShoppingBagIcon,
} from '../components';

// ════════════════════════════════════════════════════════════
// DESIGN SYSTEM — Clean & Modern Marketplace
// ════════════════════════════════════════════════════════════

const BRAND = {
  primary: '#C75C3A',     // Terracotta - main brand color
  primaryDark: '#A84B2E',
  black: '#0F0F0F',
  white: '#FFFFFF',
  gray50: '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray900: '#18181B',
};

const FILTERS = [
  { id: 'all', label: 'Tudo', icon: 'grid-outline', custom: null },
  { id: 'feminino', label: 'Feminino', icon: 'woman-outline', custom: 'dress' },
  { id: 'masculino', label: 'Masculino', icon: 'man-outline', custom: null },
  { id: 'infantil', label: 'Infantil', icon: 'happy-outline', custom: null },
  { id: 'acessorios', label: 'Acessórios', icon: 'glasses-outline', custom: 'hanger' },
  { id: 'calcados', label: 'Calçados', icon: 'footsteps-outline', custom: null },
  { id: 'bolsas', label: 'Bolsas', icon: 'bag-handle-outline', custom: 'bag' },
  { id: 'vintage', label: 'Vintage', icon: 'time-outline', custom: 'recycle' },
];

export function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  // Use responsive hook for consistent breakpoints
  const {
    width,
    isMobile,
    isTablet,
    isDesktop,
    gridColumns,
    productWidth,
    gridGap,
    getResponsiveValue
  } = useResponsive();

  // Grid configuration - HomeScreen uses 5 columns on large desktop
  const cols = width >= 1200 ? 5 : gridColumns;
  const padding = getResponsiveValue(16, 24, 32);
  const gap = gridGap;
  const maxW = 1400;
  const containerW = Math.min(width, maxW);
  const cardW = (containerW - padding * 2 - gap * (cols - 1)) / cols;

  // State
  const [products, setProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('all');
  const [cartCount, setCartCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAuctionInvite, setShowAuctionInvite] = useState(false);
  const [sellerProductsCount, setSellerProductsCount] = useState(0);

  // Check if first visit to show welcome modal
  useEffect(() => {
    const checkFirstVisit = async () => {
      try {
        const hasVisited = await AsyncStorage.getItem('largo_visited');
        if (!hasVisited && !isAuthenticated) {
          setTimeout(() => setShowWelcome(true), 1000);
          await AsyncStorage.setItem('largo_visited', 'true');
        }
      } catch {
        // Web fallback
        if (Platform.OS === 'web') {
          const hasVisited = localStorage.getItem('largo_visited');
          if (!hasVisited && !isAuthenticated) {
            setTimeout(() => setShowWelcome(true), 1000);
            localStorage.setItem('largo_visited', 'true');
          }
        }
      }
    };
    checkFirstVisit();
  }, [isAuthenticated]);

  // Check if seller should see auction invite
  useEffect(() => {
    const checkAuctionInvite = async () => {
      if (!isAuthenticated) return;

      try {
        // Check if user has active products (is a seller)
        const myProducts = await productsService.getMyProducts('active');
        const activeCount = myProducts.products?.length || 0;
        setSellerProductsCount(activeCount);

        if (activeCount === 0) return;

        // Check day of week (show invite on Sunday, Monday, Tuesday before auction)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const showDays = [0, 1, 2]; // Sun, Mon, Tue

        if (!showDays.includes(dayOfWeek)) return;

        // Check if already dismissed this week
        const dismissedKey = 'auction_invite_dismissed';
        let lastDismissed: string | null = null;

        if (Platform.OS === 'web') {
          lastDismissed = localStorage.getItem(dismissedKey);
        } else {
          lastDismissed = await AsyncStorage.getItem(dismissedKey);
        }

        if (lastDismissed) {
          const dismissedDate = new Date(lastDismissed);
          const daysSinceDismissed = Math.floor((now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceDismissed < 7) return;
        }

        // Show the invite after a delay
        setTimeout(() => setShowAuctionInvite(true), 2000);
      } catch (error) {
        console.error('Error checking auction invite:', error);
      }
    };

    checkAuctionInvite();
  }, [isAuthenticated]);

  // Data fetching
  const fetchProducts = useCallback(async (category?: string) => {
    try {
      const params: any = { limit: 60 };
      if (category && category !== 'all') {
        params.category = category;
      }
      const res = await productsService.getProducts(params);
      setProducts(res.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) return setFavorites(new Set());
    try {
      const res = await favoritesService.getFavorites();
      setFavorites(new Set((res.favorites || []).map((f: any) => f.id)));
    } catch { setFavorites(new Set()); }
  }, [isAuthenticated]);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return setCartCount(0);
    try {
      const res = await cartService.getCart();
      setCartCount(res.items?.length || 0);
    } catch { setCartCount(0); }
  }, [isAuthenticated]);

  useEffect(() => { fetchProducts(filter); fetchFavorites(); }, [filter]);
  useFocusEffect(useCallback(() => { fetchCart(); }, [fetchCart]));

  const onRefresh = () => { setRefreshing(true); fetchProducts(filter); };

  const toggleFavorite = async (id: string) => {
    if (!isAuthenticated) return navigation.navigate('Login');
    try {
      if (favorites.has(id)) {
        await favoritesService.removeFavorite(id);
        setFavorites(prev => { const s = new Set(prev); s.delete(id); return s; });
      } else {
        await favoritesService.addFavorite(id);
        setFavorites(prev => new Set(prev).add(id));
      }
    } catch {}
  };

  // Products are now filtered by the API based on the selected filter

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* ══════════ HEADER ══════════ */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={[styles.headerContent, { maxWidth: maxW, paddingHorizontal: padding, gap: isMobile ? 8 : 16 }]}>

          {/* Logo */}
          <Pressable onPress={() => navigation.navigate('Home')}>
            <Text style={[styles.logo, isMobile && { fontSize: 22 }]}>Largô</Text>
          </Pressable>

          {/* Search */}
          <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
            <Ionicons name="search" size={18} color={BRAND.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder={isMobile ? "Buscar..." : "Buscar marcas, peças..."}
              placeholderTextColor={BRAND.gray400}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onSubmitEditing={(e) => navigation.navigate('Search', { query: e.nativeEvent.text })}
            />
          </View>

          {/* Actions */}
          <View style={[styles.actions, { gap: isMobile ? 0 : 4 }]}>
            {isDesktop && (
              <Pressable style={styles.sellButton} onPress={() => navigation.navigate('Sell')}>
                <Ionicons name="pricetag" size={16} color={BRAND.white} />
                <Text style={styles.sellButtonText}>Vender</Text>
              </Pressable>
            )}

            {/* Hide favorites on mobile - it's in tab bar */}
            {!isMobile && (
              <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Favorites')}>
                <Ionicons name="heart-outline" size={22} color={BRAND.gray900} />
              </Pressable>
            )}

            <Pressable style={[styles.iconBtn, isMobile && { width: 40, height: 40 }]} onPress={() => navigation.navigate('Cart')}>
              <Ionicons name="bag-outline" size={isMobile ? 20 : 22} color={BRAND.gray900} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={[styles.iconBtn, isMobile && { width: 40, height: 40 }]}
              onPress={() => navigation.navigate(isAuthenticated ? 'Profile' : 'Login')}
            >
              <Ionicons name="person-outline" size={isMobile ? 20 : 22} color={BRAND.gray900} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />
        }
      >
        {/* ══════════ HERO (Animated) ══════════ */}
        <View style={[styles.heroSection, { paddingHorizontal: padding, maxWidth: maxW }]}>
          <AnimatedHeroBanner onExplore={() => navigation.navigate('Search')} />
        </View>

        {/* ══════════ QUARTA DO LARGÔ PROMO (Animated) ══════════ */}
        <View style={{ paddingHorizontal: padding, maxWidth: maxW, width: '100%' }}>
          <AnimatedQuartaBanner onPress={() => navigation.navigate('QuartaLargo')} />
        </View>

        {/* ══════════ OFFERS PROMO (Animated) ══════════ */}
        <View style={{ paddingHorizontal: padding, maxWidth: maxW, width: '100%', marginTop: 12 }}>
          <AnimatedOffersBanner onPress={() => navigation.navigate('Offers')} />
        </View>

        {/* ══════════ FILTERS ══════════ */}
        <View style={[styles.filtersWrapper, { maxWidth: maxW, paddingHorizontal: padding }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
            style={styles.filtersScroll}
          >
            {FILTERS.map((f, index) => {
              const isActive = filter === f.id;
              const iconColor = isActive ? BRAND.white : BRAND.gray600;
              const iconSize = 16;

              // Render custom icon or Ionicons based on filter type
              const renderIcon = () => {
                switch (f.custom) {
                  case 'dress':
                    return <DressIcon size={iconSize} color={iconColor} />;
                  case 'hanger':
                    return <HangerIcon size={iconSize} color={iconColor} />;
                  case 'bag':
                    return <ShoppingBagIcon size={iconSize} color={iconColor} />;
                  case 'recycle':
                    return <RecycleIcon size={iconSize} color={iconColor} />;
                  default:
                    return <Ionicons name={f.icon as any} size={iconSize} color={iconColor} />;
                }
              };

              return (
                <Pressable
                  key={f.id}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                    index > 0 && { marginLeft: 8 }
                  ]}
                  onPress={() => { setLoading(true); setFilter(f.id); }}
                >
                  <View style={{ marginRight: 6 }}>
                    {renderIcon()}
                  </View>
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ══════════ PRODUCTS ══════════ */}
        <View style={[styles.productsSection, { paddingHorizontal: padding, maxWidth: maxW }]}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Destaques</Text>
            <Pressable onPress={() => navigation.navigate('Search')}>
              <Text style={styles.seeAll}>Ver tudo</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingGrid}>
              {[...Array(cols * 2)].map((_, i) => (
                <View key={i} style={[styles.skeleton, { width: cardW, height: cardW * 1.4 }]} />
              ))}
            </View>
          ) : (
            <View style={[styles.grid, { gap }]}>
              {products.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.card, { width: cardW }]}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                >
                  <View style={[styles.cardImageWrap, { height: cardW * 1.3 }]}>
                    <Image
                      source={{ uri: item.image_url || item.image || 'https://via.placeholder.com/300' }}
                      style={styles.cardImage}
                      contentFit="cover"
                      transition={200}
                    />

                    {/* Favorite button */}
                    <Pressable
                      style={styles.favBtn}
                      onPress={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                    >
                      <Ionicons
                        name={favorites.has(item.id) ? 'heart' : 'heart-outline'}
                        size={18}
                        color={favorites.has(item.id) ? '#EF4444' : BRAND.gray600}
                      />
                    </Pressable>

                    {/* Discount badge */}
                    {item.original_price && item.price < item.original_price && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>
                          -{Math.round((1 - item.price / item.original_price) * 100)}%
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardBrand} numberOfLines={1}>
                      {item.brand || 'Sem marca'}
                    </Text>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.cardPrice}>R$ {formatPrice(item.price)}</Text>
                      {item.original_price && item.price < item.original_price && (
                        <Text style={styles.cardOldPrice}>R$ {formatPrice(item.original_price)}</Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ══════════ APP DOWNLOAD BANNER (Enjoei style) ══════════ */}
        <View style={styles.appBanner}>
          <View style={[styles.appBannerInner, { maxWidth: maxW, paddingHorizontal: padding }]}>
            <View style={styles.appBannerContent}>
              <Text style={styles.appBannerTitle}>BAIXE O APP DO LARGÔ</Text>
              <Text style={styles.appBannerSubtitle}>
                altas tendências em preços de oportunidade.{'\n'}
                tudo o que realmente importa na vida do brecheiro.
              </Text>
              <View style={styles.storeBadges}>
                <Pressable style={styles.storeBadge}>
                  <Ionicons name="logo-google-playstore" size={20} color={BRAND.white} />
                  <View>
                    <Text style={styles.storeSmall}>DISPONÍVEL NO</Text>
                    <Text style={styles.storeName}>Google Play</Text>
                  </View>
                </Pressable>
                <Pressable style={styles.storeBadge}>
                  <Ionicons name="logo-apple" size={22} color={BRAND.white} />
                  <View>
                    <Text style={styles.storeSmall}>Baixar na</Text>
                    <Text style={styles.storeName}>App Store</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* ══════════ FOOTER ══════════ */}
        <View style={[styles.footer, { maxWidth: maxW, paddingHorizontal: padding }]}>
          <View style={styles.footerColumns}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>categorias</Text>
              <Pressable onPress={() => navigation.navigate('Search', { category: 'feminino' })}>
                <Text style={styles.footerLink}>moda feminina</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Search', { category: 'masculino' })}>
                <Text style={styles.footerLink}>moda masculina</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Search', { category: 'infantil' })}>
                <Text style={styles.footerLink}>infantil</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Search', { category: 'acessorios' })}>
                <Text style={styles.footerLink}>acessórios</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Search', { category: 'calcados' })}>
                <Text style={styles.footerLink}>calçados</Text>
              </Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>destaques</Text>
              <Pressable onPress={() => navigation.navigate('Search', { sort: 'newest' })}>
                <Text style={styles.footerLink}>novidades</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('QuartaLargo')}>
                <Text style={styles.footerLink}>promoções</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Search', { query: 'marca' })}>
                <Text style={styles.footerLink}>marcas famosas</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Search')}>
                <Text style={styles.footerLink}>ver tudo</Text>
              </Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>utilidades</Text>
              <Pressable onPress={() => navigation.navigate('Help')}>
                <Text style={styles.footerLink}>ajuda</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('HowToSell')}>
                <Text style={styles.footerLink}>como vender</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('HowToBuy')}>
                <Text style={styles.footerLink}>como comprar</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Terms')}>
                <Text style={styles.footerLink}>termos de uso</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Privacy')}>
                <Text style={styles.footerLink}>privacidade</Text>
              </Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>minha conta</Text>
              <Pressable onPress={() => navigation.navigate(isAuthenticated ? 'MyProducts' : 'Login')}>
                <Text style={styles.footerLink}>minha loja</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate(isAuthenticated ? 'MySales' : 'Login')}>
                <Text style={styles.footerLink}>minhas vendas</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate(isAuthenticated ? 'MyPurchases' : 'Login')}>
                <Text style={styles.footerLink}>minhas compras</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate(isAuthenticated ? 'Settings' : 'Login')}>
                <Text style={styles.footerLink}>configurações</Text>
              </Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>siga a gente</Text>
              <Pressable onPress={() => {
                if (Platform.OS === 'web') {
                  window.open('https://instagram.com/largo.moda', '_blank');
                }
              }}>
                <View style={styles.footerSocialLink}>
                  <Ionicons name="logo-instagram" size={16} color={BRAND.gray600} />
                  <Text style={styles.footerLink}>instagram</Text>
                </View>
              </Pressable>
            </View>
          </View>
          <View style={styles.footerBottom}>
            <View style={styles.footerLogoWrap}>
              <Text style={styles.footerLogo}>Largô</Text>
              <View style={styles.footerLogoDot} />
            </View>
            <Text style={styles.copyright}>© 2025 Largô - Moda Sustentável</Text>
          </View>
        </View>
      </ScrollView>

{/* FAB removed - using tab bar "Largar" button instead */}

      {/* ══════════ WELCOME MODAL (Enjoei style) ══════════ */}
      <Modal
        visible={showWelcome}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWelcome(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close button */}
            <Pressable style={styles.modalClose} onPress={() => setShowWelcome(false)}>
              <Ionicons name="close" size={24} color={BRAND.gray600} />
            </Pressable>

            {/* Logo */}
            <Text style={styles.modalLogo}>Largô</Text>

            {/* Promo Banner */}
            <LinearGradient
              colors={['#E8D4F0', '#D4E8D0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalPromo}
            >
              <Text style={styles.promoTitle}>20% OFF</Text>
              <Text style={styles.promoSubtitle}>NA 1ª COMPRA COM O CUPOM:</Text>
              <View style={styles.promoCoupon}>
                <Text style={styles.promoCouponText}>LARGOU20</Text>
              </View>
              <Text style={styles.promoNote}>em produtos selecionados</Text>
            </LinearGradient>

            {/* CTA */}
            <Text style={styles.modalTitle}>chegue chegando</Text>
            <Text style={styles.modalSubtitle}>compre agora com desconto</Text>

            <Pressable
              style={styles.modalBtn}
              onPress={() => { setShowWelcome(false); navigation.navigate('Register'); }}
            >
              <Text style={styles.modalBtnText}>criar conta</Text>
            </Pressable>

            <Text style={styles.modalTerms}>
              ao criar uma conta, você está de acordo com os{' '}
              <Text style={styles.modalLink}>termos de serviço</Text> e a{' '}
              <Text style={styles.modalLink}>política de privacidade</Text> do Largô.
            </Text>

            <Pressable onPress={() => setShowWelcome(false)}>
              <Text style={styles.modalSkip}>continuar sem conta</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ══════════ AUCTION INVITE MODAL ══════════ */}
      <AuctionInviteModal
        visible={showAuctionInvite}
        onClose={async () => {
          setShowAuctionInvite(false);
          // Save dismissed date
          const dismissedKey = 'auction_invite_dismissed';
          const now = new Date().toISOString();
          if (Platform.OS === 'web') {
            localStorage.setItem(dismissedKey, now);
          } else {
            await AsyncStorage.setItem(dismissedKey, now);
          }
        }}
        onParticipate={() => {
          setShowAuctionInvite(false);
          navigation.navigate('SelectAuctionProducts');
        }}
        productsCount={sellerProductsCount}
      />
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.white,
  },

  // Header
  header: {
    backgroundColor: BRAND.white,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.gray200,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  logo: {
    fontSize: 26,
    fontWeight: '700',
    color: BRAND.primary,
    letterSpacing: -1,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.gray100,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    maxWidth: 480,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  searchBoxFocused: {
    borderColor: BRAND.primary,
    backgroundColor: BRAND.white,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: BRAND.gray900,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: BRAND.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND.white,
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginRight: 8,
  },
  sellButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.white,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },

  // Hero Section (container only - animation is in AnimatedHeroBanner)
  heroSection: {
    width: '100%',
    paddingTop: 20,
    paddingBottom: 8,
  },

  // Filters
  filtersWrapper: {
    width: '100%',
    paddingVertical: 16,
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: BRAND.gray100,
    borderWidth: 1.5,
    borderColor: BRAND.gray100,
  },
  filterChipActive: {
    backgroundColor: BRAND.black,
    borderColor: BRAND.black,
  },
  filterText: {
    fontSize: 15,
    fontWeight: '500',
    color: BRAND.gray600,
  },
  filterTextActive: {
    color: BRAND.white,
  },

  // Products
  productsSection: {
    width: '100%',
    paddingTop: 8,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: BRAND.gray900,
  },
  seeAll: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.primary,
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skeleton: {
    backgroundColor: BRAND.gray100,
    borderRadius: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    marginBottom: 20,
  },
  cardImageWrap: {
    backgroundColor: BRAND.gray100,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
      default: { elevation: 2 },
    }),
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND.white,
  },
  cardInfo: {
    paddingTop: 10,
  },
  cardBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: BRAND.gray900,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.gray900,
  },
  cardOldPrice: {
    fontSize: 14,
    color: BRAND.gray400,
    textDecorationLine: 'line-through',
  },

  // App Banner (Enjoei style - lilás)
  appBanner: {
    width: '100%',
    backgroundColor: '#E8D4F0', // Lilás Enjoei
    marginTop: 48,
    paddingVertical: 48,
  },
  appBannerInner: {
    width: '100%',
    alignSelf: 'center',
  },
  appBannerContent: {
    maxWidth: 600,
  },
  appBannerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4A1942', // Roxo escuro
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  appBannerSubtitle: {
    fontSize: 16,
    color: '#6B4D68',
    lineHeight: 24,
    marginBottom: 24,
  },
  storeBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 10,
  },
  storeSmall: {
    fontSize: 9,
    color: BRAND.gray400,
    textTransform: 'uppercase',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
  },

  // Footer (Enjoei style - multi column)
  footer: {
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 48,
    borderTopWidth: 1,
    borderTopColor: BRAND.gray200,
  },
  footerColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
    marginBottom: 40,
  },
  footerCol: {
    minWidth: 140,
  },
  footerColTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.gray900,
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 14,
    color: BRAND.gray600,
    marginBottom: 10,
  },
  footerSocialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  footerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: BRAND.gray200,
  },
  footerLogoWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  footerLogo: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND.primary,
    letterSpacing: -1,
    fontStyle: 'italic',
  },
  footerLogoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginLeft: 2,
    marginBottom: 6,
  },
  copyright: {
    fontSize: 13,
    color: BRAND.gray500,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(199, 92, 58, 0.4)' },
      default: { elevation: 8 },
    }),
  },

  // Welcome Modal (Enjoei style)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLogo: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND.primary,
    marginBottom: 24,
  },
  modalPromo: {
    width: '100%',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  promoTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#4A1942',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A1942',
    marginBottom: 12,
  },
  promoCoupon: {
    backgroundColor: BRAND.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4A1942',
    borderStyle: 'dashed',
  },
  promoCouponText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4A1942',
    letterSpacing: 2,
  },
  promoNote: {
    fontSize: 12,
    color: '#6B4D68',
    marginTop: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: BRAND.gray900,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: BRAND.gray500,
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: BRAND.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.white,
  },
  modalTerms: {
    fontSize: 12,
    color: BRAND.gray500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalLink: {
    color: BRAND.primary,
    textDecorationLine: 'underline',
  },
  modalSkip: {
    fontSize: 14,
    color: BRAND.gray500,
    textDecorationLine: 'underline',
  },
});

export default HomeScreen;
