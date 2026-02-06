import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { productsService, cartService, favoritesService } from '../api';
import { formatPrice } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, getColors, radius, shadows } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { MICROCOPY, CATEGORIES as APP_CATEGORIES } from '../constants';
import { LookCard, Look } from '../components/LookCard';
import { LOOK_DISCOUNT_PERCENT } from '../constants/looks';
import { ProductListSkeleton } from '../components/ProductListSkeleton';

// Categories with professional Ionicons
const CATEGORIES = [
  { id: 'feminino', name: 'Feminino', icon: 'woman-outline' as const, color: colors.catFeminino, bg: colors.catFemininoBg },
  { id: 'masculino', name: 'Masculino', icon: 'man-outline' as const, color: colors.catMasculino, bg: colors.catMasculinoBg },
  { id: 'infantil', name: 'Infantil', icon: 'happy-outline' as const, color: colors.catInfantil, bg: colors.catInfantilBg },
  { id: 'acessorios', name: 'Acessórios', icon: 'bag-handle-outline' as const, color: colors.catAcessorios, bg: colors.catAcessoriosBg },
  { id: 'calcados', name: 'Calçados', icon: 'footsteps-outline' as const, color: colors.dourado, bg: colors.douradoLight },
  { id: 'joias', name: 'Joias', icon: 'diamond-outline' as const, color: colors.lilas, bg: colors.lilasLight },
];

// Featured collections for desktop sidebar
const COLLECTIONS = [
  { id: '1', title: 'Verão 2026', subtitle: 'Peças leves e coloridas', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400', count: 234 },
  { id: '2', title: 'Vintage', subtitle: 'Achados únicos', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400', count: 189 },
  { id: '3', title: 'Premium', subtitle: 'Grifes e marcas top', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400', count: 156 },
];

// Default placeholder image for products without images
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400';

export function HomeScreen({ navigation }: any) {
  const { width: screenWidth } = useWindowDimensions();
  const { gridColumns, productWidth, isMobile, isTablet, isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const [products, setProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartCount, setCartCount] = useState(0);
  const [looks, setLooks] = useState<Look[]>([]);

  // Calculate responsive values
  const contentMaxWidth = isDesktop ? 1200 : isTablet ? 900 : screenWidth;
  const sidebarWidth = isDesktop ? 280 : 0;
  const mainContentWidth = contentMaxWidth - sidebarWidth - (isDesktop ? 40 : 0);
  const horizontalPadding = isMobile ? 16 : 24;

  // Mock looks data - TODO: Replace with API call
  useEffect(() => {
    const mockLooks: Look[] = [
      {
        id: '1',
        name: 'Look Verão Casual',
        seller_id: '1',
        seller_name: 'Maria Silva',
        products: [
          { id: '1', title: 'Vestido Floral', price: 150, image_url: 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400' },
          { id: '2', title: 'Bolsa de Palha', price: 80, image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400' },
          { id: '3', title: 'Sandália Rasteira', price: 60, image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400' },
        ],
      },
      {
        id: '2',
        name: 'Work from Home',
        seller_id: '2',
        seller_name: 'Julia Santos',
        products: [
          { id: '4', title: 'Blazer Linho', price: 180, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400' },
          { id: '5', title: 'Calça Alfaiataria', price: 120, image_url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400' },
        ],
      },
      {
        id: '3',
        name: 'Festival Look',
        seller_id: '3',
        seller_name: 'Ana Costa',
        products: [
          { id: '6', title: 'Top Crochê', price: 90, image_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400' },
          { id: '7', title: 'Saia Midi', price: 100, image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0uj7a?w=400' },
          { id: '8', title: 'Bota Cano Curto', price: 200, image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400' },
          { id: '9', title: 'Bolsa Franjas', price: 70, image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400' },
        ],
      },
    ];
    setLooks(mockLooks);
  }, []);

  // Check if user should see premium banner (logged in + free subscription)
  const showPremiumBanner = isAuthenticated && (!user?.subscription_type || user?.subscription_type === 'free');

  const FILTER_CATEGORIES = [
    { id: 'all', name: 'Todos' },
    { id: 'feminino', name: 'Feminino' },
    { id: 'masculino', name: 'Masculino' },
    { id: 'infantil', name: 'Infantil' },
    { id: 'acessorios', name: 'Acessórios' },
  ];

  const toggleFavorite = async (productId: string) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    const isFavorited = favorites.has(productId);

    // Optimistic update
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (isFavorited) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });

    try {
      if (isFavorited) {
        await favoritesService.removeFavorite(productId);
      } else {
        await favoritesService.addFavorite(productId);
      }
    } catch (error) {
      // Revert on error
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (isFavorited) {
          newFavorites.add(productId);
        } else {
          newFavorites.delete(productId);
        }
        return newFavorites;
      });
      console.error('Error toggling favorite:', error);
    }
  };

  // Responsive values from hook (gridColumns, productWidth, isMobile, isTablet, isDesktop)
  const numColumns = gridColumns;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productsService.getProducts({ limit: 20 });
      setProducts(res.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchCartCount = useCallback(async () => {
    try {
      const res = await cartService.getCart();
      setCartCount(res.items?.length || 0);
    } catch {
      // User not logged in or error - no cart count
      setCartCount(0);
    }
  }, []);

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
      // Error loading favorites
      setFavorites(new Set());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
    fetchFavorites();
  }, [fetchData, fetchFavorites]);

  // Atualizar carrinho quando a tela volta a ter foco
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

  // Filter products based on search query and category
  const filteredProducts = useCallback(() => {
    let source = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      // Map category IDs to product conditions/types
      const categoryMap: Record<string, string[]> = {
        'roupas': ['Vestido', 'Blazer', 'Saia', 'Camisa', 'Jaqueta'],
        'bolsas': ['Bolsa'],
        'calcados': ['Tênis', 'Sandália'],
        'acessorios': ['Relógio'],
        'joias': ['Colar'],
      };
      const keywords = categoryMap[selectedCategory] || [];
      source = source.filter((item: any) =>
        keywords.some(kw => item.title?.toLowerCase().includes(kw.toLowerCase()))
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      source = source.filter((item: any) =>
        item.title?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query)
      );
    }

    return source;
  }, [products, searchQuery, selectedCategory]);

  const displayProducts = filteredProducts();

  // Render sidebar for desktop
  const renderSidebar = () => {
    if (!isDesktop) return null;

    return (
      <View style={styles.sidebar}>
        {/* User Quick Actions */}
        {isAuthenticated ? (
          <View style={styles.sidebarUserCard}>
            <View style={styles.sidebarUserAvatar}>
              <Text style={styles.sidebarUserInitial}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
            <Text style={styles.sidebarUserName}>Olá, {user?.name?.split(' ')[0] || 'Usuário'}</Text>
            <Pressable style={styles.sidebarSellBtn} onPress={() => navigation.navigate('Sell')}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.sidebarSellText}>Largar Peça</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.sidebarAuthCard}>
            <Text style={styles.sidebarAuthTitle}>Entre para vender</Text>
            <Pressable style={styles.sidebarAuthBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.sidebarAuthBtnText}>Entrar</Text>
            </Pressable>
          </View>
        )}

        {/* Collections */}
        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarSectionTitle}>Coleções</Text>
          {COLLECTIONS.map((col) => (
            <Pressable
              key={col.id}
              style={styles.sidebarCollectionCard}
              onPress={() => navigation.navigate('Search', { collection: col.title })}
            >
              <Image source={{ uri: col.image }} style={styles.sidebarCollectionImage} contentFit="cover" />
              <View style={styles.sidebarCollectionInfo}>
                <Text style={styles.sidebarCollectionTitle}>{col.title}</Text>
                <Text style={styles.sidebarCollectionCount}>{col.count} peças</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Quick Links */}
        <View style={styles.sidebarSection}>
          <Text style={styles.sidebarSectionTitle}>Atalhos</Text>
          <Pressable style={styles.sidebarLink} onPress={() => navigation.navigate('Premium')}>
            <Ionicons name="diamond" size={18} color={colors.primary} />
            <Text style={styles.sidebarLinkText}>Seja Premium</Text>
          </Pressable>
          <Pressable style={styles.sidebarLink} onPress={() => navigation.navigate('Help')}>
            <Ionicons name="help-circle-outline" size={18} color={themeColors.textSecondary} />
            <Text style={styles.sidebarLinkText}>Central de Ajuda</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Fixed Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 8, backgroundColor: themeColors.surface }]}>
        <View style={[styles.headerContent, { maxWidth: contentMaxWidth }]}>
          {/* Logo */}
          <Pressable onPress={() => navigation.navigate('Home')}>
            <Text style={[styles.logo, { color: colors.primary }]}>{MICROCOPY.appName}</Text>
          </Pressable>

          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
            <Ionicons name="search" size={18} color={themeColors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Buscar marcas, peças..."
              placeholderTextColor={themeColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={() => searchQuery && navigation.navigate('Search', { query: searchQuery })}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={themeColors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Header Actions */}
          <View style={styles.headerActions}>
            {isDesktop && (
              <Pressable style={styles.headerTextBtn} onPress={() => navigation.navigate('Sell')}>
                <Text style={[styles.headerTextBtnLabel, { color: colors.primary }]}>Largar</Text>
              </Pressable>
            )}
            <Pressable style={styles.headerIconBtn} onPress={() => navigation.navigate('Messages')}>
              <Ionicons name="notifications-outline" size={22} color={themeColors.text} />
            </Pressable>
            <Pressable style={styles.headerIconBtn} onPress={() => navigation.navigate('Cart')}>
              <Ionicons name="bag-outline" size={22} color={themeColors.text} />
              {cartCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={[styles.mainContainer, { maxWidth: contentMaxWidth }]}>
        {renderSidebar()}

        <ScrollView
          style={[styles.scrollContent, { flex: 1 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* Categories - Emoji style */}
          <View style={styles.section}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.categoriesRow, { paddingHorizontal: horizontalPadding }]}
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={styles.categoryCard}
                  onPress={() => navigation.navigate('Search', { categoryId: cat.id, categoryName: cat.name })}
                >
                  <View style={[styles.categoryIconWrap, { backgroundColor: cat.bg, borderColor: cat.color }]}>
                    <Ionicons name={cat.icon} size={26} color={cat.color} />
                  </View>
                  <Text style={[styles.categoryName, { color: themeColors.text }]}>{cat.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Quick Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.filterChipsContent, { paddingHorizontal: horizontalPadding }]}
          >
            {FILTER_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: themeColors.surface, borderColor: themeColors.border },
                  selectedCategory === cat.id && styles.filterChipActive
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: themeColors.textSecondary },
                  selectedCategory === cat.id && styles.filterChipTextActive
                ]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Banner Principal - Linguagem Largô */}
          <Pressable
            style={[styles.heroBanner, { marginHorizontal: horizontalPadding }]}
            onPress={() => navigation.navigate('Search', { showOffers: true })}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroBannerGrad}
            >
              <View style={styles.heroBannerContent}>
                <Text style={styles.heroBannerTitle}>Largou?</Text>
                <Text style={styles.heroBannerTitleAccent}>Pegou!</Text>
                <Text style={styles.heroBannerSubtitle}>Peças únicas com até 80% off</Text>
              </View>
              <View style={styles.heroBannerBadge}>
                <Ionicons name="pricetag" size={16} color={colors.primary} />
                <Text style={styles.heroBannerBadgeText}>ATÉ 80% OFF</Text>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Modo Garimpeiro - Novidades */}
          <Pressable
            style={[styles.garimpeiroCard, { marginHorizontal: horizontalPadding }]}
            onPress={() => navigation.navigate('Search', { garimpeiro: true })}
          >
            <LinearGradient
              colors={[colors.dourado, '#C99A5E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.garimpeiroGrad}
            >
              <View style={styles.garimpeiroIcon}>
                <Ionicons name="time" size={22} color="#fff" />
              </View>
              <View style={styles.garimpeiroText}>
                <Text style={styles.garimpeiroTitle}>Modo Garimpeiro</Text>
                <Text style={styles.garimpeiroSubtitle}>Acabaram de largar!</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>

          {/* Looks Section - Compact */}
          {looks.length > 0 && !isMobile && (
            <View style={[styles.section, { paddingHorizontal: horizontalPadding }]}>
              <View style={styles.sectionHead}>
                <View style={styles.sectionTitleWrap}>
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Looks Completos</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>{LOOK_DISCOUNT_PERCENT}% OFF</Text>
                  </View>
                </View>
                <Pressable style={styles.seeAllBtn} onPress={() => navigation.navigate('Search', { showLooks: true })}>
                  <Text style={styles.seeAllText}>Ver todos</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.looksRow}>
                {looks.map((look) => (
                  <LookCard
                    key={look.id}
                    look={look}
                    onPress={() => navigation.navigate('LookDetail', { lookId: look.id })}
                    width={isMobile ? 160 : 200}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Products Section */}
          <View style={[styles.section, { paddingHorizontal: horizontalPadding }]}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionTitleWrap}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  {searchQuery ? `"${searchQuery}"` : 'Novidades'}
                </Text>
                {searchQuery && (
                  <Text style={[styles.sectionSubtitle, { color: themeColors.textSecondary }]}>
                    {displayProducts.length} resultados
                  </Text>
                )}
              </View>
              {!searchQuery && (
                <Pressable style={styles.seeAllBtn} onPress={() => navigation.navigate('Search')}>
                  <Text style={styles.seeAllText}>Ver tudo</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </Pressable>
              )}
            </View>

            {loading ? (
              <ProductListSkeleton count={isDesktop ? 8 : 6} />
            ) : displayProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: themeColors.gray100 }]}>
                  <Ionicons name="search-outline" size={32} color={themeColors.textMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                  {MICROCOPY.empty.search}
                </Text>
                <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
                  Tente buscar por outro termo
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.productsGrid}>
                  {displayProducts.slice(0, searchQuery ? 20 : (isDesktop ? 12 : 8)).map((item: any) => {
                    const img = item.image_url || item.image || PLACEHOLDER_IMAGE;
                    const discount = item.original_price ? Math.round(((item.original_price - item.price) / item.original_price) * 100) : 0;

                    return (
                      <Pressable
                        key={item.id}
                        style={[styles.productCard, { width: productWidth, backgroundColor: themeColors.surface }]}
                        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                      >
                        <View style={styles.productImageWrap}>
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
                              color={favorites.has(item.id) ? '#FF6B6B' : '#fff'}
                            />
                          </Pressable>

                          {/* Discount Badge */}
                          {discount > 0 && (
                            <View style={styles.productDiscountBadge}>
                              <Text style={styles.productDiscountText}>-{discount}%</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.productDetails}>
                          <Text style={[styles.productBrand, { color: colors.primary }]} numberOfLines={1}>
                            {item.brand || 'Sem marca'}
                          </Text>
                          <Text style={[styles.productTitle, { color: themeColors.text }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <View style={styles.productPriceRow}>
                            <Text style={[styles.productPrice, { color: themeColors.text }]}>
                              R$ {formatPrice(item.price)}
                            </Text>
                            {item.original_price && (
                              <Text style={[styles.productOldPrice, { color: themeColors.textMuted }]}>
                                R$ {formatPrice(item.original_price)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {!searchQuery && (
                  <Pressable
                    style={[styles.loadMoreBtn, { borderColor: colors.primary }]}
                    onPress={() => navigation.navigate('Search')}
                  >
                    <Text style={[styles.loadMoreText, { color: colors.primary }]}>Ver mais produtos</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                  </Pressable>
                )}
              </>
            )}
          </View>

          {/* CTA Largar Peça */}
          <Pressable
            style={[styles.sellCta, { marginHorizontal: horizontalPadding, maxWidth: isDesktop ? 600 : undefined }]}
            onPress={() => navigation.navigate('Sell')}
          >
            <View style={styles.sellCtaCard}>
              <View style={styles.sellCtaIconWrap}>
                <Ionicons name="camera" size={28} color={colors.primary} />
              </View>
              <View style={styles.sellCtaContent}>
                <Text style={[styles.sellCtaTitle, { color: themeColors.text }]}>Largue suas peças</Text>
                <Text style={[styles.sellCtaSubtitle, { color: themeColors.textSecondary }]}>
                  Tire foto e transforme em dinheiro
                </Text>
              </View>
              <View style={styles.sellCtaBtn}>
                <Text style={styles.sellCtaBtnText}>Largar</Text>
                <Ionicons name="add" size={16} color="#fff" />
              </View>
            </View>
          </Pressable>

          {/* Simple Footer */}
          <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
            <Text style={[styles.footerLogo, { color: colors.primary }]}>{MICROCOPY.appName}</Text>
            <Text style={[styles.footerTagline, { color: themeColors.textSecondary }]}>
              {MICROCOPY.slogan}
            </Text>
            <View style={styles.footerLinks}>
              <Pressable onPress={() => navigation.navigate('Help')}>
                <Text style={[styles.footerLink, { color: themeColors.textSecondary }]}>Ajuda</Text>
              </Pressable>
              <Text style={{ color: themeColors.textMuted }}>•</Text>
              <Pressable onPress={() => navigation.navigate('Policies')}>
                <Text style={[styles.footerLink, { color: themeColors.textSecondary }]}>Termos</Text>
              </Pressable>
              <Text style={{ color: themeColors.textMuted }}>•</Text>
              <Pressable onPress={() => navigation.navigate('Policies')}>
                <Text style={[styles.footerLink, { color: themeColors.textSecondary }]}>Privacidade</Text>
              </Pressable>
            </View>
            <View style={styles.footerSustainable}>
              <Ionicons name="leaf" size={14} color={colors.success} />
              <Text style={[styles.footerSustainableText, { color: colors.success }]}>
                Moda sustentável
              </Text>
            </View>
            <Text style={[styles.footerCopyright, { color: themeColors.textMuted }]}>
              © 2026 Largô. Todos os direitos reservados.
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout
  container: { flex: 1 },
  mainContainer: { flex: 1, flexDirection: 'row', alignSelf: 'center', width: '100%' },
  scrollContent: { flex: 1 },

  // Header
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    alignSelf: 'center',
    width: '100%',
    gap: spacing.md,
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    gap: spacing.sm,
    maxWidth: 400,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: 40,
    outlineStyle: 'none',
  } as any,
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTextBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTextBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // Sidebar (Desktop)
  sidebar: {
    width: 280,
    paddingRight: spacing.xl,
    paddingTop: spacing.xl,
    paddingLeft: spacing.lg,
  },
  sidebarUserCard: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sidebarUserAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  sidebarUserInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  sidebarUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  sidebarSellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  sidebarSellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  sidebarAuthCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sidebarAuthTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  sidebarAuthBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  sidebarAuthBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  sidebarSection: {
    marginBottom: spacing.xl,
  },
  sidebarSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  sidebarCollectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  sidebarCollectionImage: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
  },
  sidebarCollectionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  sidebarCollectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sidebarCollectionCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  sidebarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  sidebarLinkText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Categories
  categoriesRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  categoryCard: {
    alignItems: 'center',
    width: 76,
  },
  categoryIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Filter Chips
  filterChipsContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Sections
  section: {
    marginTop: spacing.xl,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  discountBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  discountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // Hero Banner - Largô Style
  heroBanner: {
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  heroBannerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  heroBannerContent: {
    flex: 1,
  },
  heroBannerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 32,
  },
  heroBannerTitleAccent: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFE4B5',
    lineHeight: 32,
  },
  heroBannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.sm,
  },
  heroBannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  heroBannerBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },

  // Garimpeiro Card
  garimpeiroCard: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  garimpeiroGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  garimpeiroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  garimpeiroText: {
    flex: 1,
  },
  garimpeiroTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  garimpeiroSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },

  // Looks
  looksRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // Products
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  productCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  productImageWrap: {
    aspectRatio: 0.8,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favoriteBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDiscountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  productDiscountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  productDetails: {
    padding: spacing.md,
  },
  productBrand: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  productOldPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: spacing.xs,
  },

  // Load More
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderRadius: radius.full,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Sell CTA
  sellCta: {
    marginTop: spacing['2xl'],
  },
  sellCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primaryMuted,
    borderStyle: 'dashed',
    gap: spacing.md,
  },
  sellCtaIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellCtaContent: {
    flex: 1,
  },
  sellCtaTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sellCtaSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sellCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  sellCtaBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Footer
  footer: {
    marginTop: spacing['3xl'],
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerLogo: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
  },
  footerTagline: {
    fontSize: 13,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  footerLink: {
    fontSize: 13,
  },
  footerSustainable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  footerSustainableText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerCopyright: {
    fontSize: 11,
    marginTop: spacing.md,
  },
});

export default HomeScreen;
