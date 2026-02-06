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
import { ProductListSkeleton } from '../components/ProductListSkeleton';

// ============================================
// DESIGN SYSTEM - Baseado em Enjoei/Vinted/Poshmark
// ============================================

const COLORS = {
  // Primary
  primary: '#C75C3A',
  primaryLight: '#E07A5A',
  primaryDark: '#A04830',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#FAFAFA',

  // Text
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#9B9B9B',

  // Borders
  border: '#E5E5E5',
  borderLight: '#F0F0F0',

  // Status
  success: '#22C55E',
  error: '#EF4444',

  // Overlay
  overlay: 'rgba(0,0,0,0.4)',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Categories - Simple text chips, no icons
const CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'feminino', name: 'Feminino' },
  { id: 'masculino', name: 'Masculino' },
  { id: 'infantil', name: 'Infantil' },
  { id: 'acessorios', name: 'Acessórios' },
  { id: 'calcados', name: 'Calçados' },
];

// Placeholder for products without images
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400';

export function HomeScreen({ navigation }: any) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { isDark } = useTheme();

  // Responsive
  const isMobile = screenWidth < 600;
  const isTablet = screenWidth >= 600 && screenWidth < 900;
  const isDesktop = screenWidth >= 900;
  const gridColumns = isDesktop ? 4 : isTablet ? 3 : 2;
  const horizontalPadding = isMobile ? 16 : isDesktop ? 32 : 24;
  const gap = isMobile ? 12 : 16;
  const productWidth = (screenWidth - (horizontalPadding * 2) - (gap * (gridColumns - 1))) / gridColumns;

  // State
  const [products, setProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartCount, setCartCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);

  // Fetch products
  const fetchData = useCallback(async () => {
    try {
      const res = await productsService.getProducts({ limit: 20 });
      setProducts(res.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch cart count
  const fetchCartCount = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }
    try {
      const res = await cartService.getCart();
      setCartCount(res.items?.length || 0);
    } catch {
      setCartCount(0);
    }
  }, [isAuthenticated]);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites(new Set());
      return;
    }
    try {
      const res = await favoritesService.getFavorites();
      const favoriteIds = new Set((res.favorites || []).map((f: any) => f.id));
      setFavorites(favoriteIds);
    } catch {
      setFavorites(new Set());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
    fetchFavorites();
  }, [fetchData, fetchFavorites]);

  useFocusEffect(
    useCallback(() => {
      fetchCartCount();
    }, [fetchCartCount])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    fetchFavorites();
  };

  // Toggle favorite
  const toggleFavorite = async (productId: string) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    try {
      if (favorites.has(productId)) {
        await favoritesService.removeFavorite(productId);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await favoritesService.addFavorite(productId);
        setFavorites(prev => new Set(prev).add(productId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Filter products
  const filteredProducts = products.filter(item => {
    if (selectedCategory === 'all') return true;
    const categoryMap: Record<string, string[]> = {
      'feminino': ['vestido', 'saia', 'blusa'],
      'masculino': ['camisa', 'calça', 'blazer'],
      'infantil': ['kids', 'infantil', 'bebê'],
      'acessorios': ['bolsa', 'cinto', 'relógio'],
      'calcados': ['tênis', 'sapato', 'sandália'],
    };
    const keywords = categoryMap[selectedCategory] || [];
    return keywords.some(kw => item.title?.toLowerCase().includes(kw));
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ==================== HEADER ==================== */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={[styles.headerInner, { maxWidth: isDesktop ? 1200 : undefined, paddingHorizontal: horizontalPadding }]}>
          {/* Logo */}
          <Pressable onPress={() => navigation.navigate('Home')}>
            <Text style={styles.logo}>Largô</Text>
          </Pressable>

          {/* Search - Desktop */}
          {!isMobile && (
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar produtos, marcas..."
                placeholderTextColor={COLORS.textMuted}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onSubmitEditing={(e) => navigation.navigate('Search', { query: e.nativeEvent.text })}
              />
            </View>
          )}

          {/* Actions */}
          <View style={styles.headerActions}>
            {/* Search icon mobile */}
            {isMobile && (
              <Pressable style={styles.headerIcon} onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search-outline" size={24} color={COLORS.text} />
              </Pressable>
            )}

            {/* Sell button desktop */}
            {isDesktop && (
              <Pressable onPress={() => navigation.navigate('Sell')}>
                <Text style={styles.sellLink}>Vender</Text>
              </Pressable>
            )}

            {/* Notifications */}
            <Pressable style={styles.headerIcon} onPress={() => navigation.navigate('Messages')}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            </Pressable>

            {/* Cart */}
            <Pressable style={styles.headerIcon} onPress={() => navigation.navigate('Cart')}>
              <Ionicons name="bag-outline" size={24} color={COLORS.text} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* ==================== CONTENT ==================== */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { maxWidth: isDesktop ? 1200 : undefined }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ==================== CATEGORIES ==================== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoriesContainer, { paddingHorizontal: horizontalPadding }]}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive
              ]}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ==================== BANNER ==================== */}
        <Pressable
          style={[styles.banner, { marginHorizontal: horizontalPadding }]}
          onPress={() => navigation.navigate('Search', { showOffers: true })}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80' }}
            style={styles.bannerImage}
            contentFit="cover"
          />
          <View style={styles.bannerOverlay}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTag}>NOVIDADES</Text>
              <Text style={styles.bannerTitle}>Achados da semana</Text>
              <Text style={styles.bannerSubtitle}>Peças selecionadas com até 70% off</Text>
            </View>
          </View>
        </Pressable>

        {/* ==================== PRODUCTS SECTION ==================== */}
        <View style={[styles.section, { paddingHorizontal: horizontalPadding }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'Novidades' : CATEGORIES.find(c => c.id === selectedCategory)?.name}
            </Text>
            <Pressable onPress={() => navigation.navigate('Search', { category: selectedCategory })}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </Pressable>
          </View>

          {loading ? (
            <ProductListSkeleton count={6} />
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shirt-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum produto encontrado</Text>
              <Text style={styles.emptySubtitle}>Tente outra categoria</Text>
            </View>
          ) : (
            <View style={[styles.productsGrid, { gap }]}>
              {filteredProducts.slice(0, isDesktop ? 12 : 8).map((item: any) => {
                const img = item.image_url || item.image || PLACEHOLDER_IMAGE;
                const discount = item.original_price
                  ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
                  : 0;

                return (
                  <Pressable
                    key={item.id}
                    style={[styles.productCard, { width: productWidth }]}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                  >
                    {/* Product Image */}
                    <View style={styles.productImageContainer}>
                      <Image source={{ uri: img }} style={styles.productImage} contentFit="cover" />

                      {/* Favorite Button */}
                      <Pressable
                        style={styles.favoriteBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                      >
                        <Ionicons
                          name={favorites.has(item.id) ? 'heart' : 'heart-outline'}
                          size={18}
                          color={favorites.has(item.id) ? COLORS.error : '#FFFFFF'}
                        />
                      </Pressable>

                      {/* Discount Badge */}
                      {discount > 0 && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>-{discount}%</Text>
                        </View>
                      )}
                    </View>

                    {/* Product Info */}
                    <View style={styles.productInfo}>
                      <Text style={styles.productPrice}>
                        R$ {formatPrice(item.price)}
                      </Text>
                      <Text style={styles.productTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.brand && (
                        <Text style={styles.productBrand} numberOfLines={1}>
                          {item.brand}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Load More */}
          {filteredProducts.length > 0 && (
            <Pressable
              style={styles.loadMoreBtn}
              onPress={() => navigation.navigate('Search', { category: selectedCategory })}
            >
              <Text style={styles.loadMoreText}>Ver mais produtos</Text>
            </Pressable>
          )}
        </View>

        {/* ==================== SELL CTA ==================== */}
        <View style={[styles.sellCta, { marginHorizontal: horizontalPadding }]}>
          <View style={styles.sellCtaContent}>
            <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
            <View style={styles.sellCtaText}>
              <Text style={styles.sellCtaTitle}>Tem peças paradas?</Text>
              <Text style={styles.sellCtaSubtitle}>Venda no Largô e ganhe dinheiro</Text>
            </View>
          </View>
          <Pressable style={styles.sellCtaBtn} onPress={() => navigation.navigate('Sell')}>
            <Text style={styles.sellCtaBtnText}>Vender agora</Text>
          </Pressable>
        </View>

        {/* ==================== FOOTER ==================== */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>Largô</Text>
          <Text style={styles.footerTagline}>Moda circular, futuro sustentável</Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => navigation.navigate('Help')}>
              <Text style={styles.footerLink}>Ajuda</Text>
            </Pressable>
            <Text style={styles.footerDot}>•</Text>
            <Pressable onPress={() => navigation.navigate('Policies')}>
              <Text style={styles.footerLink}>Termos</Text>
            </Pressable>
            <Text style={styles.footerDot}>•</Text>
            <Pressable onPress={() => navigation.navigate('Policies')}>
              <Text style={styles.footerLink}>Privacidade</Text>
            </Pressable>
          </View>
          <Text style={styles.footerCopyright}>© 2026 Largô</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Container
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
    paddingBottom: 12,
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.xl,
    paddingHorizontal: SPACING.md,
    height: 40,
    maxWidth: 480,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    outlineStyle: 'none',
  } as any,
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: SPACING.xs,
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: SPACING.md,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.error,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
    paddingBottom: SPACING['3xl'],
  },

  // Categories
  categoriesContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  categoryChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },

  // Banner
  banner: {
    height: 160,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  },
  bannerContent: {},
  bannerTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },

  // Section
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.primary,
  },

  // Products Grid
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productCard: {
    marginBottom: SPACING.lg,
  },
  productImageContainer: {
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favoriteBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productInfo: {
    paddingTop: SPACING.sm,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  productTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  productBrand: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Load More
  loadMoreBtn: {
    alignSelf: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },

  // Sell CTA
  sellCta: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sellCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sellCtaText: {
    marginLeft: SPACING.md,
  },
  sellCtaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  sellCtaSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sellCtaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  sellCtaBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLogo: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footerTagline: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  footerLink: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  footerDot: {
    color: COLORS.textMuted,
  },
  footerCopyright: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});

export default HomeScreen;
