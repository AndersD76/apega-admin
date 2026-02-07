import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  useWindowDimensions,
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
import { productsService, cartService, favoritesService } from '../api';
import { formatPrice } from '../utils/format';
import { useAuth } from '../context/AuthContext';

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
  { id: 'all', label: 'Tudo' },
  { id: 'feminino', label: 'Feminino' },
  { id: 'masculino', label: 'Masculino' },
  { id: 'infantil', label: 'Infantil' },
  { id: 'acessorios', label: 'Acessórios' },
];

export function HomeScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  // Responsive breakpoints
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  // Grid configuration
  const cols = isDesktop ? 5 : isTablet ? 3 : 2;
  const padding = isMobile ? 16 : 24;
  const gap = isMobile ? 12 : 16;
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

  // Data fetching
  const fetchProducts = useCallback(async () => {
    try {
      const res = await productsService.getProducts({ limit: 60 });
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

  useEffect(() => { fetchProducts(); fetchFavorites(); }, []);
  useFocusEffect(useCallback(() => { fetchCart(); }, [fetchCart]));

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

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

  // Filter products
  const filtered = products.filter(p => {
    if (filter === 'all') return true;
    const keywords: Record<string, string[]> = {
      feminino: ['vestido', 'saia', 'blusa', 'feminino'],
      masculino: ['camisa', 'calça', 'blazer', 'masculino'],
      infantil: ['infantil', 'kids', 'bebê'],
      acessorios: ['bolsa', 'cinto', 'relógio', 'acessório'],
    };
    return (keywords[filter] || []).some(k => p.title?.toLowerCase().includes(k));
  });

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
        {/* ══════════ HERO ══════════ */}
        <View style={[styles.heroSection, { paddingHorizontal: padding, maxWidth: maxW }]}>
          <LinearGradient
            colors={['#1A1A1A', '#2D2D2D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTag}>MODA CIRCULAR</Text>
              <Text style={styles.heroTitle}>Peças únicas,{'\n'}preços incríveis</Text>
              <Text style={styles.heroDesc}>Compre e venda moda com até 90% off</Text>
              <Pressable style={styles.heroCta} onPress={() => navigation.navigate('Search')}>
                <Text style={styles.heroCtaText}>Explorar</Text>
                <Ionicons name="arrow-forward" size={16} color={BRAND.black} />
              </Pressable>
            </View>
            <View style={styles.heroVisual}>
              <View style={styles.heroCircle1} />
              <View style={styles.heroCircle2} />
              <View style={styles.heroCircle3} />
            </View>
          </LinearGradient>
        </View>

        {/* ══════════ QUARTA DO DESAPEGO PROMO ══════════ */}
        <Pressable
          style={[styles.quartaPromo, { marginHorizontal: padding, maxWidth: maxW - padding * 2 }]}
          onPress={() => navigation.navigate('QuartaDesapego')}
        >
          <LinearGradient
            colors={['#7C3AED', '#9333EA', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quartaGradient}
          >
            <View style={styles.quartaContent}>
              <View style={styles.quartaTag}>
                <Ionicons name="flash" size={12} color="#FDE047" />
                <Text style={styles.quartaTagText}>TODA QUARTA</Text>
              </View>
              <Text style={styles.quartaTitle}>Quarta do Largô</Text>
              <Text style={styles.quartaDesc}>Leilão semanal com até 50% OFF</Text>
              <View style={styles.quartaCta}>
                <Text style={styles.quartaCtaText}>Participar</Text>
                <Ionicons name="arrow-forward" size={14} color={BRAND.white} />
              </View>
            </View>
            <View style={styles.quartaVisual}>
              <Ionicons name="pricetags" size={48} color="rgba(255,255,255,0.3)" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* ══════════ OFFERS PROMO ══════════ */}
        <Pressable
          style={[styles.offersPromo, { marginHorizontal: padding, maxWidth: maxW - padding * 2 }]}
          onPress={() => navigation.navigate('Offers')}
        >
          <View style={styles.offersIcon}>
            <Ionicons name="cash-outline" size={24} color={BRAND.primary} />
          </View>
          <View style={styles.offersContent}>
            <Text style={styles.offersTitle}>Faça ofertas!</Text>
            <Text style={styles.offersDesc}>Negocie direto com vendedores</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={BRAND.gray400} />
        </Pressable>

        {/* ══════════ FILTERS ══════════ */}
        <View style={[styles.filtersWrapper, { maxWidth: maxW, paddingHorizontal: padding }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
            style={styles.filtersScroll}
          >
            {FILTERS.map((f, index) => (
              <Pressable
                key={f.id}
                style={[
                  styles.filterChip,
                  filter === f.id && styles.filterChipActive,
                  index > 0 && { marginLeft: 8 }
                ]}
                onPress={() => setFilter(f.id)}
              >
                <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
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
              {filtered.map((item) => (
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

        {/* ══════════ FOOTER (Enjoei style) ══════════ */}
        <View style={[styles.footer, { maxWidth: maxW, paddingHorizontal: padding }]}>
          <View style={styles.footerColumns}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>categorias</Text>
              <Pressable><Text style={styles.footerLink}>moda feminina</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>moda masculina</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>infantil</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>acessórios</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>calçados</Text></Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>destaques</Text>
              <Pressable><Text style={styles.footerLink}>novidades</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>promoções</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>marcas famosas</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>ver tudo</Text></Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>utilidades</Text>
              <Pressable><Text style={styles.footerLink}>ajuda</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>como vender</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>como comprar</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>termos de uso</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>privacidade</Text></Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>minha conta</Text>
              <Pressable><Text style={styles.footerLink}>minha loja</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>minhas vendas</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>minhas compras</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>configurações</Text></Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>siga a gente</Text>
              <Pressable><Text style={styles.footerLink}>instagram</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>facebook</Text></Pressable>
              <Pressable><Text style={styles.footerLink}>tiktok</Text></Pressable>
            </View>
          </View>
          <View style={styles.footerBottom}>
            <Text style={styles.footerLogo}>Largô</Text>
            <Text style={styles.copyright}>© 2024 Largô - Moda Sustentável</Text>
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

  // Hero
  heroSection: {
    width: '100%',
    paddingTop: 20,
    paddingBottom: 8,
  },
  heroCard: {
    borderRadius: 20,
    padding: 28,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 180,
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
  },
  heroTag: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.primary,
    letterSpacing: 2,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: BRAND.white,
    lineHeight: 42,
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 8,
  },
  heroCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.black,
  },
  heroVisual: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 300,
    height: 300,
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: BRAND.primary,
    opacity: 0.3,
    right: 0,
    top: 40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BRAND.primary,
    opacity: 0.5,
    right: 80,
    top: 120,
  },
  heroCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND.white,
    opacity: 0.2,
    right: 160,
    top: 80,
  },

  // Quarta do Largô Promo
  quartaPromo: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    alignSelf: 'center',
    width: '100%',
  },
  quartaGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  quartaContent: {
    flex: 1,
    zIndex: 2,
  },
  quartaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  quartaTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FDE047',
    letterSpacing: 0.5,
  },
  quartaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.white,
    marginBottom: 4,
  },
  quartaDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  quartaCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  quartaCtaText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.white,
  },
  quartaVisual: {
    marginLeft: 16,
  },

  // Offers Promo
  offersPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignSelf: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: BRAND.gray200,
  },
  offersIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offersContent: {
    flex: 1,
    marginLeft: 12,
  },
  offersTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.gray900,
  },
  offersDesc: {
    fontSize: 13,
    color: BRAND.gray500,
    marginTop: 2,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  footerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: BRAND.gray200,
  },
  footerLogo: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND.primary,
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
