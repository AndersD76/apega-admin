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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { productsService, cartService, favoritesService } from '../api';
import { formatPrice } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ============================================
// DESIGN SYSTEM - Inspirado no Enjoei REAL
// ============================================

const COLORS = {
  // Brand
  primary: '#8B1A50', // Roxo/Magenta do Enjoei
  secondary: '#FFD700', // Amarelo
  tertiary: '#E8D5F0', // Lilás claro
  accent: '#00C853', // Verde

  // UI
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#222222',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#E0E0E0',
  white: '#FFFFFF',
};

// Categories with images
const CATEGORIES = [
  { id: 'all', name: 'tudo', icon: 'grid-outline' },
  { id: 'feminino', name: 'moças', icon: 'woman-outline' },
  { id: 'masculino', name: 'rapazes', icon: 'man-outline' },
  { id: 'infantil', name: 'crianças', icon: 'happy-outline' },
  { id: 'acessorios', name: 'acessórios', icon: 'watch-outline' },
  { id: 'calcados', name: 'calçados', icon: 'footsteps-outline' },
];

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300';

export function HomeScreen({ navigation }: any) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();

  // Responsive
  const isMobile = screenWidth < 600;
  const isTablet = screenWidth >= 600 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;

  // Grid: 2 mobile, 4 tablet, 5 desktop (como Enjoei)
  const gridColumns = isDesktop ? 5 : isTablet ? 4 : 2;
  const containerPadding = isMobile ? 16 : 24;
  const maxWidth = 1280;
  const contentWidth = Math.min(screenWidth, maxWidth);
  const gap = isMobile ? 12 : 16;
  const cardWidth = Math.floor((contentWidth - containerPadding * 2 - gap * (gridColumns - 1)) / gridColumns);

  // State
  const [products, setProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartCount, setCartCount] = useState(0);

  // Fetch functions
  const fetchData = useCallback(async () => {
    try {
      const res = await productsService.getProducts({ limit: 50 });
      setProducts(res.products || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchCartCount = useCallback(async () => {
    if (!isAuthenticated) return setCartCount(0);
    try {
      const res = await cartService.getCart();
      setCartCount(res.items?.length || 0);
    } catch { setCartCount(0); }
  }, [isAuthenticated]);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) return setFavorites(new Set());
    try {
      const res = await favoritesService.getFavorites();
      setFavorites(new Set((res.favorites || []).map((f: any) => f.id)));
    } catch { setFavorites(new Set()); }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
    fetchFavorites();
  }, [fetchData, fetchFavorites]);

  useFocusEffect(useCallback(() => { fetchCartCount(); }, [fetchCartCount]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleFavorite = async (productId: string) => {
    if (!isAuthenticated) return navigation.navigate('Login');
    try {
      if (favorites.has(productId)) {
        await favoritesService.removeFavorite(productId);
        setFavorites(prev => { const n = new Set(prev); n.delete(productId); return n; });
      } else {
        await favoritesService.addFavorite(productId);
        setFavorites(prev => new Set(prev).add(productId));
      }
    } catch {}
  };

  // Filter
  const filteredProducts = products.filter(item => {
    if (selectedCategory === 'all') return true;
    const map: Record<string, string[]> = {
      'feminino': ['vestido', 'saia', 'blusa', 'feminino'],
      'masculino': ['camisa', 'calça', 'blazer', 'masculino'],
      'infantil': ['kids', 'infantil', 'bebê'],
      'acessorios': ['bolsa', 'cinto', 'relógio'],
      'calcados': ['tênis', 'sapato', 'sandália'],
    };
    return (map[selectedCategory] || []).some(kw => item.title?.toLowerCase().includes(kw));
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ========== HEADER (Estilo Enjoei) ========== */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={[styles.headerInner, { maxWidth, paddingHorizontal: containerPadding }]}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>L</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder='busque "zara"'
              placeholderTextColor={COLORS.textMuted}
              onSubmitEditing={(e) => navigation.navigate('Search', { query: e.nativeEvent.text })}
            />
            <Pressable style={styles.searchBtn}>
              <Ionicons name="search" size={18} color={COLORS.textMuted} />
            </Pressable>
          </View>

          {/* Nav Links (Desktop) */}
          {!isMobile && (
            <View style={styles.navLinks}>
              {CATEGORIES.slice(1, 5).map(cat => (
                <Pressable
                  key={cat.id}
                  style={styles.navLink}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.navLinkText, selectedCategory === cat.id && styles.navLinkActive]}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.headerActions}>
            <Pressable style={styles.headerIconBtn} onPress={() => navigation.navigate('Help')}>
              <Ionicons name="help-circle-outline" size={22} color={COLORS.text} />
            </Pressable>

            {isAuthenticated ? (
              <Pressable style={styles.headerIconBtn} onPress={() => navigation.navigate('Profile')}>
                <Ionicons name="person-outline" size={20} color={COLORS.text} />
              </Pressable>
            ) : (
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>entrar</Text>
              </Pressable>
            )}

            <Pressable style={styles.sellBtn} onPress={() => navigation.navigate('Sell')}>
              <Text style={styles.sellBtnText}>quero vender</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ========== HERO BANNER ========== */}
        <View style={[styles.heroBanner, { marginHorizontal: containerPadding }]}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>largou?{'\n'}pegou!</Text>
            <Text style={styles.heroSubtitle}>peças únicas até 80% off</Text>
            <Pressable style={styles.heroBtn} onPress={() => navigation.navigate('Search')}>
              <Text style={styles.heroBtnText}>ver ofertas</Text>
            </Pressable>
          </View>
          <View style={styles.heroDecor}>
            <View style={[styles.heroCircle, { backgroundColor: COLORS.secondary }]} />
            <View style={[styles.heroCircle2, { backgroundColor: COLORS.accent }]} />
          </View>
        </View>

        {/* ========== CATEGORIES (Mobile) ========== */}
        {isMobile && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.categoriesRow, { paddingHorizontal: containerPadding }]}
          >
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat.id}
                style={[styles.categoryItem, selectedCategory === cat.id && styles.categoryItemActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <View style={[styles.categoryIcon, selectedCategory === cat.id && styles.categoryIconActive]}>
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={selectedCategory === cat.id ? COLORS.white : COLORS.text}
                  />
                </View>
                <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.categoryLabelActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ========== SECTION: queridíssimos ========== */}
        <View style={[styles.section, { paddingHorizontal: containerPadding }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>queridíssimos e disputados</Text>
              <Text style={styles.sectionSubtitle}>formam mais fila que toboágua</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('Search')}>
              <Text style={styles.sectionLink}>ver mais</Text>
            </Pressable>
          </View>

          {/* Products Grid */}
          <View style={[styles.productsGrid, { gap }]}>
            {loading ? (
              <Text style={styles.loadingText}>carregando...</Text>
            ) : filteredProducts.length === 0 ? (
              <Text style={styles.emptyText}>nenhum produto encontrado</Text>
            ) : (
              filteredProducts.slice(0, isDesktop ? 10 : 6).map((item: any) => {
                const img = item.image_url || item.image || PLACEHOLDER_IMAGE;
                const isFav = favorites.has(item.id);

                return (
                  <Pressable
                    key={item.id}
                    style={[styles.productCard, { width: cardWidth }]}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                  >
                    <View style={[styles.productImageWrap, { height: cardWidth * 1.2 }]}>
                      <Image source={{ uri: img }} style={styles.productImage} contentFit="cover" />

                      {/* Cart icon (like Enjoei) */}
                      <Pressable
                        style={styles.cartIconBtn}
                        onPress={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                      >
                        <Ionicons name={isFav ? 'heart' : 'cart-outline'} size={16} color={isFav ? '#E53935' : COLORS.text} />
                        {!isFav && <Text style={styles.cartIconCount}>1</Text>}
                      </Pressable>

                      {/* Price badge */}
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceText}>R$ {formatPrice(item.price)}</Text>
                      </View>
                    </View>

                    <View style={styles.productInfo}>
                      <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.productMeta}>{item.brand || 'sem marca'} • {item.size || 'M'}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        {/* ========== SECTION: outlet ========== */}
        <View style={[styles.section, { paddingHorizontal: containerPadding }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>outlet largô</Text>
              <Text style={styles.sectionSubtitle}>grandes marcas e curadoria afiada</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('Search')}>
              <Text style={styles.sectionLink}>ver tudo</Text>
            </Pressable>
          </View>

          <View style={[styles.productsGrid, { gap }]}>
            {filteredProducts.slice(6, isDesktop ? 16 : 10).map((item: any) => {
              const img = item.image_url || item.image || PLACEHOLDER_IMAGE;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.productCard, { width: cardWidth }]}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                >
                  <View style={[styles.productImageWrap, { height: cardWidth * 1.2 }]}>
                    <Image source={{ uri: img }} style={styles.productImage} contentFit="cover" />
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>R$ {formatPrice(item.price)}</Text>
                    </View>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.productMeta}>{item.brand || 'sem marca'}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ========== APP DOWNLOAD BANNER ========== */}
        <View style={[styles.appBanner, { marginHorizontal: containerPadding }]}>
          <Text style={styles.appBannerTitle}>baixe o app do largô</Text>
          <Text style={styles.appBannerSubtitle}>altas tendências em preços de oportunidade</Text>
          <View style={styles.appBtns}>
            <Pressable style={styles.storeBadge}>
              <Ionicons name="logo-google-playstore" size={16} color={COLORS.white} />
              <Text style={styles.storeBadgeText}>Google Play</Text>
            </Pressable>
            <Pressable style={styles.storeBadge}>
              <Ionicons name="logo-apple" size={16} color={COLORS.white} />
              <Text style={styles.storeBadgeText}>App Store</Text>
            </Pressable>
          </View>
        </View>

        {/* ========== FOOTER ========== */}
        <View style={[styles.footer, { paddingHorizontal: containerPadding }]}>
          <View style={styles.footerCols}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>categorias</Text>
              <Text style={styles.footerLink}>moda feminina</Text>
              <Text style={styles.footerLink}>moda masculina</Text>
              <Text style={styles.footerLink}>infantil</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>utilidades</Text>
              <Text style={styles.footerLink}>ajuda</Text>
              <Text style={styles.footerLink}>como vender</Text>
              <Text style={styles.footerLink}>como comprar</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>minha conta</Text>
              <Text style={styles.footerLink}>minha loja</Text>
              <Text style={styles.footerLink}>minhas compras</Text>
              <Text style={styles.footerLink}>minhas vendas</Text>
            </View>
          </View>
          <Text style={styles.footerCopyright}>© 2026 Largô. Todos os direitos reservados.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    alignSelf: 'center',
    width: '100%',
    gap: 12,
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 40,
    maxWidth: 500,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  searchBtn: {
    padding: 4,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  navLink: {
    paddingVertical: 4,
  },
  navLinkText: {
    fontSize: 14,
    color: COLORS.text,
  },
  navLinkActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.text,
    marginRight: 8,
  },
  sellBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sellBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },

  // Hero
  heroBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginTop: 16,
    padding: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 160,
  },
  heroContent: {
    flex: 1,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  heroBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  heroBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  heroDecor: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  heroCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.3,
  },
  heroCircle2: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: -40,
    marginLeft: 40,
    opacity: 0.4,
  },

  // Categories (Mobile)
  categoriesRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 16,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 6,
  },
  categoryItemActive: {},
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconActive: {
    backgroundColor: COLORS.primary,
  },
  categoryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  categoryLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Section
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Products
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productCard: {},
  productImageWrap: {
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  cartIconBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  cartIconCount: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  productInfo: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  productTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  productMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // States
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    padding: 20,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    padding: 20,
  },

  // App Banner
  appBanner: {
    backgroundColor: COLORS.tertiary,
    borderRadius: 12,
    padding: 32,
    marginTop: 48,
    alignItems: 'center',
  },
  appBannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
  },
  appBannerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  appBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  storeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Footer
  footer: {
    marginTop: 48,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerCols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
  },
  footerCol: {
    minWidth: 140,
  },
  footerColTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 32,
  },
});

export default HomeScreen;
