import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ImageBackground,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { productsService, cartService, favoritesService } from '../api';
import { formatPrice } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, getColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { MICROCOPY, CATEGORIES as APP_CATEGORIES } from '../constants';
import { LookCard, Look } from '../components/LookCard';
import { LOOK_DISCOUNT_PERCENT } from '../constants/looks';
import { ProductListSkeleton } from '../components/ProductListSkeleton';

// Hero carousel slides
const HERO_SLIDES = [
  {
    image: require('../../assets/hero/hero1.png'),
    tag: 'MODA SUSTENTÁVEL',
    title: 'Largou?\nPegou!',
    subtitle: 'Peças únicas com até 80% off',
  },
  {
    image: require('../../assets/hero/hero2.png'),
    tag: 'NOVIDADES',
    title: 'Acabaram\nde largar',
    subtitle: 'As melhores marcas por menos',
  },
  {
    image: require('../../assets/hero/hero3.png'),
    tag: 'LARGUE JÁ',
    title: 'Largue suas\npeças paradas',
    subtitle: 'Transforme em dinheiro fácil',
  },
];

const CATEGORY_IMAGES = {
  roupas: require('../../assets/categories/roupas.png'),
  bolsas: require('../../assets/categories/bolsas.png'),
  calcados: require('../../assets/categories/calcados.png'),
  acessorios: require('../../assets/categories/acessorios.png'),
  joias: require('../../assets/categories/joias.png'),
};

const CATEGORIES = [
  { id: 'feminino', name: 'Feminino', icon: 'woman', color: colors.catFeminino },
  { id: 'masculino', name: 'Masculino', icon: 'man', color: colors.catMasculino },
  { id: 'infantil', name: 'Infantil', icon: 'happy', color: colors.catInfantil },
  { id: 'acessorios', name: 'Acessórios', icon: 'bag-handle', color: colors.catAcessorios },
];

const COLLECTIONS = [
  { id: '1', title: 'Verão 2024', subtitle: 'Peças leves', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600', gradient: ['#FF6B6B', '#FF8E53'] },
  { id: '2', title: 'Vintage', subtitle: 'Achados únicos', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600', gradient: ['#9B59B6', '#8E44AD'] },
  { id: '3', title: 'Premium', subtitle: 'Marcas top', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600', gradient: ['#3498DB', '#2980B9'] },
];

// Default placeholder image for products without images
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400';

export function HomeScreen({ navigation }: any) {
  const { width, gridColumns, productWidth, isMobile, isTablet, isDesktop } = useResponsive();
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
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const heroScrollRef = useRef<ScrollView>(null);
  const [looks, setLooks] = useState<Look[]>([]);

  // Mock looks data - TODO: Replace with API call
  useEffect(() => {
    const mockLooks: Look[] = [
      {
        id: '1',
        name: 'Look Verao Casual',
        seller_id: '1',
        seller_name: 'Maria Silva',
        products: [
          { id: '1', title: 'Vestido Floral', price: 150, image_url: 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400' },
          { id: '2', title: 'Bolsa de Palha', price: 80, image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400' },
          { id: '3', title: 'Sandalia Rasteira', price: 60, image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400' },
        ],
      },
      {
        id: '2',
        name: 'Work from Home',
        seller_id: '2',
        seller_name: 'Julia Santos',
        products: [
          { id: '4', title: 'Blazer Linho', price: 180, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400' },
          { id: '5', title: 'Calca Alfaiataria', price: 120, image_url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400' },
        ],
      },
      {
        id: '3',
        name: 'Festival Look',
        seller_id: '3',
        seller_name: 'Ana Costa',
        products: [
          { id: '6', title: 'Top Croche', price: 90, image_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400' },
          { id: '7', title: 'Saia Midi', price: 100, image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0uj7a?w=400' },
          { id: '8', title: 'Bota Cano Curto', price: 200, image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400' },
          { id: '9', title: 'Bolsa Franjas', price: 70, image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400' },
        ],
      },
    ];
    setLooks(mockLooks);
  }, []);

  // Auto-scroll hero carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroSlide((prev) => {
        const next = (prev + 1) % HERO_SLIDES.length;
        heroScrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [width]);

  const handleHeroScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveHeroSlide(slideIndex);
  };

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

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* HERO CAROUSEL */}
        <View style={styles.heroContainer}>
          <ScrollView
            ref={heroScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleHeroScroll}
            scrollEventThrottle={16}
          >
            {HERO_SLIDES.map((slide, index) => (
              <ImageBackground key={index} source={slide.image} style={[styles.hero, { width }]}>
                <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']} style={[styles.heroOverlay, { paddingTop: insets.top + 16 }]}>
                  {/* Header - only on first slide to avoid duplication */}
                  {index === activeHeroSlide && (
                    <View style={styles.header}>
                      <View style={styles.logoWrap}>
                        <Text style={styles.logo}>{MICROCOPY.appName}</Text>
                      </View>
                      <View style={styles.headerIcons}>
                        <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Messages')}>
                          <Ionicons name="notifications-outline" size={24} color="#fff" />
                        </Pressable>
                        <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
                          <Ionicons name="bag-outline" size={24} color="#fff" />
                          {cartCount > 0 && (
                            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}
                  {index !== activeHeroSlide && <View style={styles.header} />}

                  {/* Hero Content */}
                  <View style={styles.heroContent}>
                    <View style={styles.heroTag}>
                      <Text style={styles.heroTagText}>{slide.tag}</Text>
                    </View>
                    <Text style={styles.heroTitle}>{slide.title}</Text>
                    <Text style={styles.heroSubtitle}>{slide.subtitle}</Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
            ))}
          </ScrollView>

          </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#A3A3A3" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar marcas, peças..."
              placeholderTextColor="#A3A3A3"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color="#A3A3A3" />
              </Pressable>
            )}
            <Pressable style={styles.discoveryBtn} onPress={() => navigation.navigate('Discovery')}>
              <Ionicons name="play-circle" size={20} color="#fff" />
            </Pressable>
            <Pressable style={styles.filterBtn} onPress={() => navigation.navigate('Search')}>
              <Ionicons name="options-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Quick Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterChipsWrap}
          contentContainerStyle={styles.filterChipsContent}
        >
          {FILTER_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.filterChipText, selectedCategory === cat.id && styles.filterChipTextActive]}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <Pressable onPress={() => navigation.navigate('Search')}><Text style={styles.seeAll}>Ver todas</Text></Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {CATEGORIES.map((cat) => (
              <Pressable key={cat.id} style={styles.categoryCard} onPress={() => navigation.navigate('Search', { categoryId: cat.id, categoryName: cat.name })}>
                <View style={[styles.categoryImageWrap, { borderColor: cat.color, backgroundColor: cat.color + '15' }]}>
                  <Ionicons name={cat.icon as any} size={32} color={cat.color} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Garimpeiro Banner */}
        <Pressable style={styles.garimpeiroBanner} onPress={() => navigation.navigate('Search', { garimpeiro: true })}>
          <LinearGradient colors={['#D4A574', '#C99A5E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.garimpeiroGrad}>
            <View style={styles.garimpeiroLeft}>
              <View style={styles.garimpeiroIconWrap}>
                <Ionicons name="time" size={24} color="#fff" />
              </View>
              <View style={styles.garimpeiroContent}>
                <Text style={styles.garimpeiroTitle}>Modo Garimpeiro</Text>
                <Text style={styles.garimpeiroSubtitle}>Veja o que acabou de chegar!</Text>
              </View>
            </View>
            <View style={styles.garimpeiroBtn}>
              <Ionicons name="arrow-forward" size={20} color="#D4A574" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Promo Banner */}
        <Pressable style={styles.promoBanner} onPress={() => navigation.navigate('Search', { showOffers: true })}>
          <Image
            source={require('../../assets/banners/promo-70off.png')}
            style={styles.promoImage}
            contentFit="cover"
          />
          <View style={styles.promoOverlay}>
            <View style={styles.promoTag}>
              <Ionicons name="flash" size={12} color="#fff" />
              <Text style={styles.promoTagText}>OFERTA ESPECIAL</Text>
            </View>
            <Text style={styles.promoTitle}>Até 70% OFF</Text>
            <Text style={styles.promoSubtitle}>Peças selecionadas</Text>
            <View style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>Ver ofertas</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </View>
        </Pressable>

        {/* Premium Banner - Only for logged in free users */}
        {showPremiumBanner && (
          <Pressable style={styles.premiumBanner} onPress={() => navigation.navigate('Premium')}>
            <LinearGradient colors={['#1a1a1a', '#2d2d2d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.premiumGrad}>
              <View style={styles.premiumLeft}>
                <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.premiumIconGrad}>
                  <Ionicons name="diamond" size={20} color="#fff" />
                </LinearGradient>
                <View style={styles.premiumContent}>
                  <Text style={styles.premiumTitle}>Desbloqueie o <Text style={styles.premiumHighlight}>Premium</Text></Text>
                  <View style={styles.premiumFeatures}>
                    <View style={styles.premiumFeature}>
                      <Ionicons name="checkmark" size={12} color="#FFD700" />
                      <Text style={styles.premiumFeatureText}>Taxa 10%</Text>
                    </View>
                    <View style={styles.premiumFeature}>
                      <Ionicons name="checkmark" size={12} color="#FFD700" />
                      <Text style={styles.premiumFeatureText}>IA Fotos</Text>
                    </View>
                    <View style={styles.premiumFeature}>
                      <Ionicons name="checkmark" size={12} color="#FFD700" />
                      <Text style={styles.premiumFeatureText}>Ilimitado</Text>
                    </View>
                  </View>
                </View>
              </View>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.premiumBtn}>
                <Text style={styles.premiumBtnText}>Ver</Text>
              </LinearGradient>
            </LinearGradient>
          </Pressable>
        )}

        {/* Looks Completos Section */}
        {looks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View>
                <View style={styles.looksTitleRow}>
                  <Text style={styles.looksTitleIcon}>+</Text>
                  <Text style={styles.sectionTitle}>Looks Completos</Text>
                </View>
                <Text style={styles.sectionSub}>Combos com {LOOK_DISCOUNT_PERCENT}% OFF</Text>
              </View>
              <Pressable style={styles.seeAllBtn} onPress={() => navigation.navigate('Search', { showLooks: true })}>
                <Text style={styles.seeAll}>Ver todos</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.looksRow}>
              {looks.map((look) => (
                <LookCard
                  key={look.id}
                  look={look}
                  onPress={() => navigation.navigate('LookDetail', { lookId: look.id })}
                  width={180}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Collections */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Colecoes</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionsRow}>
            {COLLECTIONS.map((col) => (
              <Pressable key={col.id} style={styles.collectionCard} onPress={() => navigation.navigate('Search', { collection: col.title })}>
                <Image source={{ uri: col.image }} style={styles.collectionImg} contentFit="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.collectionOverlay}>
                  <Text style={styles.collectionTitle}>{col.title}</Text>
                  <Text style={styles.collectionSub}>{col.subtitle}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View>
              <Text style={styles.sectionTitle}>
                {searchQuery ? `Resultados para "${searchQuery}"` : MICROCOPY.sections.newArrivals}
              </Text>
              <Text style={styles.sectionSub}>
                {searchQuery ? `${displayProducts.length} produtos encontrados` : 'Acabou de chegar'}
              </Text>
            </View>
            {!searchQuery && (
              <Pressable style={styles.seeAllBtn} onPress={() => navigation.navigate('Search')}>
                <Text style={styles.seeAll}>Ver tudo</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>

          {loading ? (
            <ProductListSkeleton count={6} />
          ) : displayProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#D4D4D4" />
              <Text style={styles.emptyTitle}>{MICROCOPY.empty.search}</Text>
              <Text style={styles.emptyText}>Tente buscar por outro termo</Text>
            </View>
          ) : (
            <>
              <View style={[styles.productsGrid, { gap: 12 }]}>
                {displayProducts.slice(0, searchQuery ? 20 : (isDesktop ? 8 : 6)).map((item: any) => {
                  const img = item.image_url || item.image || PLACEHOLDER_IMAGE;
                  const discount = item.original_price ? Math.round(((item.original_price - item.price) / item.original_price) * 100) : 0;

                  return (
                    <Pressable key={item.id} style={[styles.productCard, { width: productWidth }]} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}>
                      <View style={styles.productImgWrap}>
                        <Image source={{ uri: img }} style={styles.productImg} contentFit="cover" />
                        <Pressable
                          style={styles.heartBtn}
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
                        {discount > 0 && (
                          <View style={styles.discountTag}>
                            <Text style={styles.discountText}>-{discount}%</Text>
                          </View>
                        )}
                        {item.seller_is_premium && (
                          <View style={styles.premiumTag}>
                            <Ionicons name="star" size={10} color="#fff" />
                          </View>
                        )}
                      </View>
                      <View style={styles.productInfo}>
                        <View style={styles.brandRow}>
                          <Text style={styles.productBrand}>{item.brand || 'Marca'}</Text>
                          {item.seller_is_premium && (
                            <View style={styles.premiumSellerBadge}>
                              <Ionicons name="star" size={8} color="#F59E0B" />
                              <Text style={styles.premiumSellerText}>Premium</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.productName} numberOfLines={1}>{item.title}</Text>
                        <View style={styles.priceRow}>
                          <Text style={styles.price}>R$ {formatPrice(item.price)}</Text>
                          {item.original_price && <Text style={styles.oldPrice}>R$ {formatPrice(item.original_price)}</Text>}
                        </View>
                        <View style={styles.sellerRow}>
                          <Ionicons name="location-outline" size={12} color="#A3A3A3" />
                          <Text style={styles.sellerText} numberOfLines={1}>
                            {[item.city || item.seller_city, item.state || item.seller_state].filter(Boolean).join(', ') || 'Brasil'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              {!searchQuery && (
                <Pressable style={styles.loadMoreBtn} onPress={() => navigation.navigate('Search')}>
                  <Text style={styles.loadMoreText}>Carregar mais</Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Sell CTA */}
        <Pressable style={styles.sellCta} onPress={() => navigation.navigate('Sell')}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.sellCtaGrad}>
            <View style={styles.sellCtaContent}>
              <Text style={styles.sellCtaTitle}>Largue suas peças</Text>
              <Text style={styles.sellCtaSub}>Transforme o que não usa em dinheiro</Text>
            </View>
            <View style={styles.sellCtaBtn}>
              <Ionicons name="add" size={22} color={colors.primary} />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Footer */}
        <LinearGradient colors={[colors.background, '#F5F0E8']} style={styles.footer}>
          <View style={styles.footerTop}>
            <View style={styles.footerLogoWrap}>
              <Text style={styles.footerLogo}>{MICROCOPY.appName}</Text>
            </View>
            <Text style={styles.footerSlogan}>{MICROCOPY.slogan}</Text>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerMiddle}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Navegação</Text>
              <Pressable onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>Explorar</Text></Pressable>
              <Pressable onPress={() => navigation.navigate('Sell')}><Text style={styles.footerLink}>Largar</Text></Pressable>
              <Pressable onPress={() => navigation.navigate('Premium')}><Text style={styles.footerLink}>Premium</Text></Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Suporte</Text>
              <Pressable onPress={() => navigation.navigate('Help')}><Text style={styles.footerLink}>Ajuda</Text></Pressable>
              <Pressable onPress={() => navigation.navigate('Policies')}><Text style={styles.footerLink}>Termos</Text></Pressable>
              <Pressable onPress={() => navigation.navigate('Policies')}><Text style={styles.footerLink}>Privacidade</Text></Pressable>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Contato</Text>
              <Pressable onPress={() => Linking.openURL('https://instagram.com/largo.app')} style={styles.footerSocialLink}>
                <Ionicons name="logo-instagram" size={16} color="#E1306C" />
                <Text style={styles.footerLink}>Instagram</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL('https://wa.me/5511999999999')} style={styles.footerSocialLink}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={styles.footerLink}>WhatsApp</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footerDivider} />

          <View style={styles.footerBottom}>
            <Text style={styles.copyright}>{MICROCOPY.footer.copyright}</Text>
            <View style={styles.footerBadge}>
              <Ionicons name="leaf" size={12} color={colors.success} />
              <Text style={styles.footerBadgeText}>{MICROCOPY.footer.tagline}</Text>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Hero Carousel
  heroContainer: { position: 'relative' },
  hero: { height: 420 },
  heroOverlay: { flex: 1, paddingHorizontal: 16, paddingBottom: 32, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoWrap: { flexDirection: 'row', alignItems: 'baseline' },
  logo: { fontSize: 26, fontWeight: '800', color: '#fff' },
  logoLight: { fontSize: 26, fontWeight: '300', color: 'rgba(255,255,255,0.8)' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#FF6B6B', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  heroContent: {},
  heroTag: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  heroTagText: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 1 },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#fff', lineHeight: 42 },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 8 },

  // Search
  searchWrap: { paddingHorizontal: 16, marginTop: -24 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 28, paddingHorizontal: 16, height: 52, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', elevation: 8, gap: 8 } as any,
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A1A', height: 44 },
  clearBtn: { padding: 4 },
  discoveryBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  filterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#525252', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#A3A3A3', marginTop: 4 },

  // Filter Chips
  filterChipsWrap: { marginTop: 16, maxHeight: 44 },
  filterChipsContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E8E8' },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#525252' },
  filterChipTextActive: { color: '#fff' },

  // Sections
  section: { marginTop: 28 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  sectionSub: { fontSize: 13, color: '#737373', marginTop: 2 },
  seeAll: { fontSize: 14, fontWeight: '600', color: colors.primary },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  // Categories
  categoriesRow: { paddingHorizontal: 16, gap: 14 },
  categoryCard: { alignItems: 'center' },
  categoryImageWrap: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.primary, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 12, fontWeight: '600', color: '#1A1A1A', textAlign: 'center' },

  // Garimpeiro Banner
  garimpeiroBanner: { marginHorizontal: 16, marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  garimpeiroGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16 },
  garimpeiroLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  garimpeiroIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  garimpeiroContent: { flex: 1 },
  garimpeiroTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  garimpeiroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  garimpeiroBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  // Promo Banner
  promoBanner: { marginHorizontal: 16, marginTop: 24, borderRadius: 20, overflow: 'hidden', height: 200, position: 'relative' },
  promoImage: { width: '100%', height: '100%', borderRadius: 20, position: 'absolute' },
  promoOverlay: { flex: 1, padding: 20, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  promoTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  promoTagText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  promoTitle: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 2 },
  promoSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 12 },
  promoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  promoBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  // Premium Banner
  premiumBanner: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  premiumGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16 },
  premiumLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  premiumIconGrad: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  premiumContent: { flex: 1 },
  premiumTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 6 },
  premiumHighlight: { color: '#FFD700', fontWeight: '800' },
  premiumFeatures: { flexDirection: 'row', gap: 12 },
  premiumFeature: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  premiumFeatureText: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  premiumBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  premiumBtnText: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },

  // Looks Section
  looksTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  looksTitleIcon: { fontSize: 20, fontWeight: '700', color: colors.lilas },
  looksRow: { paddingHorizontal: 16, gap: 12 },

  // Collections
  collectionsRow: { paddingHorizontal: 16, gap: 12 },
  collectionCard: { width: 160, height: 200, borderRadius: 16, overflow: 'hidden' },
  collectionImg: { width: '100%', height: '100%' },
  collectionOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 14 },
  collectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  collectionSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  // Products
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  productCard: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', marginBottom: 12, boxShadow: '0 2px 8px rgba(45,41,38,0.08)', elevation: 3 } as any,
  productImgWrap: { aspectRatio: 0.85, position: 'relative' },
  productImg: { width: '100%', height: '100%' },
  heartBtn: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  discountTag: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FF6B6B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  discountText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  premiumTag: { position: 'absolute', bottom: 8, left: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' },
  productInfo: { padding: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productBrand: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  premiumSellerBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  premiumSellerText: { fontSize: 8, fontWeight: '600', color: '#F59E0B' },
  productName: { fontSize: 13, fontWeight: '500', color: '#1A1A1A', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  price: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  oldPrice: { fontSize: 12, color: '#A3A3A3', textDecorationLine: 'line-through' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  sellerText: { fontSize: 11, color: '#A3A3A3' },
  loadMoreBtn: { alignSelf: 'center', marginTop: 16, paddingHorizontal: 32, paddingVertical: 14, borderWidth: 2, borderColor: colors.primary, borderRadius: 28 },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  // Sell CTA
  sellCta: { marginHorizontal: 16, marginTop: 32, borderRadius: 16, overflow: 'hidden' },
  sellCtaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  sellCtaContent: { flex: 1 },
  sellCtaTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  sellCtaSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  sellCtaBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginLeft: 16 },

  // Footer
  footer: { marginTop: 40, paddingVertical: 28, paddingHorizontal: 20 },
  footerTop: { alignItems: 'center', marginBottom: 20 },
  footerLogoWrap: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  footerLogo: { fontSize: 24, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold' },
  footerSlogan: { fontSize: 13, color: '#737373', textAlign: 'center' },
  footerDivider: { height: 1, backgroundColor: '#ddd', marginVertical: 16 },
  footerMiddle: { flexDirection: 'row', justifyContent: 'space-between' },
  footerCol: { flex: 1, gap: 8 },
  footerColTitle: { fontSize: 12, fontWeight: '700', color: '#1A1A1A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  footerLink: { fontSize: 13, color: '#525252' },
  footerSocialLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  copyright: { fontSize: 11, color: '#A3A3A3' },
  footerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  footerBadgeText: { fontSize: 11, fontWeight: '600', color: colors.success },
});

export default HomeScreen;
