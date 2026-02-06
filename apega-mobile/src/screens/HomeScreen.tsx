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
} from 'react-native';
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
        <View style={[styles.headerContent, { maxWidth: maxW, paddingHorizontal: padding }]}>

          {/* Logo */}
          <Pressable onPress={() => navigation.navigate('Home')}>
            <Text style={styles.logo}>Largô</Text>
          </Pressable>

          {/* Search */}
          <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
            <Ionicons name="search" size={18} color={BRAND.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar marcas, peças..."
              placeholderTextColor={BRAND.gray400}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onSubmitEditing={(e) => navigation.navigate('Search', { query: e.nativeEvent.text })}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {isDesktop && (
              <Pressable style={styles.sellButton} onPress={() => navigation.navigate('Sell')}>
                <Ionicons name="add" size={18} color={BRAND.white} />
                <Text style={styles.sellButtonText}>Vender</Text>
              </Pressable>
            )}

            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Favorites')}>
              <Ionicons name="heart-outline" size={22} color={BRAND.gray900} />
            </Pressable>

            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
              <Ionicons name="bag-outline" size={22} color={BRAND.gray900} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={styles.iconBtn}
              onPress={() => navigation.navigate(isAuthenticated ? 'Profile' : 'Login')}
            >
              <Ionicons name="person-outline" size={22} color={BRAND.gray900} />
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

        {/* ══════════ FILTERS ══════════ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filtersRow, { paddingHorizontal: padding }]}
        >
          {FILTERS.map(f => (
            <Pressable
              key={f.id}
              style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

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

        {/* ══════════ CTA SECTION ══════════ */}
        {!isDesktop && (
          <View style={[styles.ctaSection, { marginHorizontal: padding }]}>
            <Text style={styles.ctaTitle}>Tem peças paradas no armário?</Text>
            <Text style={styles.ctaDesc}>Venda no Largô e ganhe dinheiro com o que você não usa mais</Text>
            <Pressable style={styles.ctaBtn} onPress={() => navigation.navigate('Sell')}>
              <Text style={styles.ctaBtnText}>Começar a vender</Text>
            </Pressable>
          </View>
        )}

        {/* ══════════ FOOTER ══════════ */}
        <View style={[styles.footer, { paddingHorizontal: padding }]}>
          <Text style={styles.footerLogo}>Largô</Text>
          <Text style={styles.footerTagline}>Moda sustentável para todos</Text>
          <View style={styles.footerLinks}>
            <Pressable><Text style={styles.footerLink}>Sobre</Text></Pressable>
            <Text style={styles.footerDot}>•</Text>
            <Pressable><Text style={styles.footerLink}>Ajuda</Text></Pressable>
            <Text style={styles.footerDot}>•</Text>
            <Pressable><Text style={styles.footerLink}>Termos</Text></Pressable>
          </View>
          <Text style={styles.copyright}>© 2024 Largô</Text>
        </View>
      </ScrollView>

      {/* ══════════ MOBILE FAB ══════════ */}
      {isMobile && (
        <Pressable style={styles.fab} onPress={() => navigation.navigate('Sell')}>
          <Ionicons name="add" size={28} color={BRAND.white} />
        </Pressable>
      )}
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
    fontSize: 11,
    fontWeight: '700',
    color: BRAND.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND.white,
    lineHeight: 34,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
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

  // Filters
  filtersRow: {
    paddingVertical: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 18,
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
    fontSize: 14,
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
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.gray900,
  },
  seeAll: {
    fontSize: 14,
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
    fontSize: 11,
    fontWeight: '600',
    color: BRAND.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND.gray900,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.gray900,
  },
  cardOldPrice: {
    fontSize: 12,
    color: BRAND.gray400,
    textDecorationLine: 'line-through',
  },

  // CTA
  ctaSection: {
    backgroundColor: BRAND.gray100,
    borderRadius: 16,
    padding: 24,
    marginTop: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.gray900,
    textAlign: 'center',
  },
  ctaDesc: {
    fontSize: 14,
    color: BRAND.gray500,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  ctaBtn: {
    backgroundColor: BRAND.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.white,
  },

  // Footer
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: BRAND.gray200,
  },
  footerLogo: {
    fontSize: 22,
    fontWeight: '700',
    color: BRAND.primary,
  },
  footerTagline: {
    fontSize: 13,
    color: BRAND.gray500,
    marginTop: 4,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  footerLink: {
    fontSize: 13,
    color: BRAND.gray600,
    fontWeight: '500',
  },
  footerDot: {
    color: BRAND.gray400,
  },
  copyright: {
    fontSize: 12,
    color: BRAND.gray400,
    marginTop: 16,
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
});

export default HomeScreen;
