import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS } from '../constants/theme';
import { BottomNavigation } from '../components';
import { getProducts, Product } from '../services/products';
import { loadToken } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const CARD_LARGE = width - 32;

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Premium Categories with gradient colors
const CATEGORIES: Array<{
  id: string;
  name: string;
  icon: string;
  gradient: readonly [string, string];
}> = [
  { id: 'all', name: 'Tudo', icon: 'sparkles', gradient: ['#6B9080', '#527363'] as const },
  { id: 'vestidos', name: 'Vestidos', icon: 'woman', gradient: ['#E8B4BC', '#D4919B'] as const },
  { id: 'blusas', name: 'Blusas', icon: 'shirt', gradient: ['#B5C7E3', '#92ADD6'] as const },
  { id: 'calcas', name: 'Calças', icon: 'analytics', gradient: ['#C5B3D3', '#A890BA'] as const },
  { id: 'saias', name: 'Saias', icon: 'flower', gradient: ['#F5D5CB', '#E8BFB1'] as const },
  { id: 'calcados', name: 'Calçados', icon: 'footsteps', gradient: ['#D4C5A9', '#C4B393'] as const },
  { id: 'bolsas', name: 'Bolsas', icon: 'bag-handle', gradient: ['#B8D4CE', '#9AC5BC'] as const },
  { id: 'acessorios', name: 'Acessórios', icon: 'diamond', gradient: ['#E5D1B8', '#D4BC9C'] as const },
];

interface DisplayItem {
  id: string;
  title: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category?: string;
  size?: string;
  condition: string;
  seller?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleSellPress = async () => {
    const token = await loadToken();
    if (token) {
      (navigation as any).navigate('NewItem');
    } else {
      navigation.navigate('Login');
    }
  };

  const fetchProducts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await getProducts({ limit: 50, sort: 'recent' });
      setProducts(response.products || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(false);
  }, [fetchProducts]);

  const allItems: DisplayItem[] = useMemo(() => {
    return products.map(product => {
      const price = typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0);
      const originalPrice = product.original_price
        ? (typeof product.original_price === 'string' ? parseFloat(product.original_price) : product.original_price)
        : undefined;

      return {
        id: product.id,
        title: product.title || 'Sem título',
        brand: product.brand,
        price: isNaN(price) ? 0 : price,
        originalPrice: originalPrice && !isNaN(originalPrice) ? originalPrice : undefined,
        images: product.images?.map(img => img.image_url) || (product.image_url ? [product.image_url] : []),
        category: product.category_name,
        size: product.size,
        condition: product.condition || 'usado',
        seller: {
          id: product.seller_id,
          name: product.seller_name || 'Vendedor',
          avatar: product.seller_avatar,
        },
      };
    });
  }, [products]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getFilteredItems = () => {
    let items = allItems;
    if (selectedCategory !== 'all') {
      items = items.filter(i => i.category?.toLowerCase() === selectedCategory);
    }
    return items;
  };

  const filteredItems = getFilteredItems();

  // Header opacity animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const renderCategoryCircle = (cat: typeof CATEGORIES[0]) => (
    <TouchableOpacity
      key={cat.id}
      style={styles.categoryItem}
      onPress={() => setSelectedCategory(cat.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={selectedCategory === cat.id ? cat.gradient : ['#F5F5F5', '#EBEBEB']}
        style={[
          styles.categoryCircle,
          selectedCategory === cat.id && styles.categoryCircleActive,
        ]}
      >
        <Ionicons
          name={cat.icon as any}
          size={22}
          color={selectedCategory === cat.id ? '#FFF' : COLORS.gray[600]}
        />
      </LinearGradient>
      <Text style={[
        styles.categoryLabel,
        selectedCategory === cat.id && styles.categoryLabelActive
      ]}>
        {cat.name}
      </Text>
    </TouchableOpacity>
  );

  const renderFeaturedCard = (item: DisplayItem) => {
    const discount = item.originalPrice && item.originalPrice > item.price
      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
      : 0;

    return (
      <TouchableOpacity
        key={`featured-${item.id}`}
        style={styles.featuredCard}
        onPress={() => navigation.navigate('ItemDetail', { item })}
        activeOpacity={0.95}
      >
        {item.images[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.featuredImage} />
        ) : (
          <View style={[styles.featuredImage, { backgroundColor: COLORS.gray[200], justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={48} color={COLORS.gray[400]} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.featuredGradient}
        >
          <View style={styles.featuredContent}>
            {item.brand && (
              <Text style={styles.featuredBrand}>{item.brand.toUpperCase()}</Text>
            )}
            <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.featuredPriceRow}>
              <Text style={styles.featuredPrice}>{formatPrice(item.price)}</Text>
              {discount > 0 && (
                <View style={styles.featuredDiscount}>
                  <Text style={styles.featuredDiscountText}>-{discount}%</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
        <TouchableOpacity style={styles.featuredHeart} activeOpacity={0.8}>
          <Ionicons name="heart-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderProductCard = (item: DisplayItem, index: number) => {
    const discount = item.originalPrice && item.originalPrice > item.price
      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
      : 0;

    const isOdd = index % 2 === 1;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.productCard,
          isOdd ? styles.productCardOdd : styles.productCardEven,
        ]}
        onPress={() => navigation.navigate('ItemDetail', { item })}
        activeOpacity={0.95}
      >
        <View style={styles.productImageContainer}>
          {item.images[0] ? (
            <Image source={{ uri: item.images[0] }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={32} color={COLORS.gray[300]} />
            </View>
          )}

          {/* Condition Badge */}
          <View style={[
            styles.conditionBadge,
            item.condition === 'novo' && styles.conditionNew,
            item.condition === 'seminovo' && styles.conditionSeminew,
          ]}>
            <Text style={styles.conditionText}>
              {item.condition === 'novo' ? 'NOVO' : item.condition === 'seminovo' ? 'SEMINOVO' : 'USADO'}
            </Text>
          </View>

          {/* Discount Tag */}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}

          {/* Favorite Button */}
          <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.8}>
            <Ionicons name="heart-outline" size={18} color={COLORS.gray[700]} />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          {item.brand && (
            <Text style={styles.brandText}>{item.brand}</Text>
          )}
          <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.productMeta}>
            {item.size && (
              <View style={styles.sizeTag}>
                <Text style={styles.sizeText}>{item.size}</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
            {item.originalPrice && item.originalPrice > item.price && (
              <Text style={styles.originalPriceText}>{formatPrice(item.originalPrice)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.loadingText}>Carregando peças incríveis...</Text>
        </View>
        <BottomNavigation navigation={navigation} activeRoute="Home" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Fixed Header with Animation */}
      <Animated.View style={[styles.fixedHeader, { paddingTop: insets.top, opacity: headerOpacity }]}>
        <View style={styles.fixedHeaderContent}>
          <View style={styles.logoSmall}>
            <Text style={styles.logoSmallApega}>apega</Text>
            <Text style={styles.logoSmallDesapega}>desapega</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Ionicons name="search" size={22} color={COLORS.gray[800]} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Hero Header */}
        <View style={[styles.heroHeader, { paddingTop: insets.top + 12 }]}>
          <View style={styles.heroTop}>
            <View style={styles.brandContainer}>
              <Text style={styles.logoApega}>apega</Text>
              <Text style={styles.logoDesapega}>desapega</Text>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.heroIconButton}
                onPress={() => navigation.navigate('Search')}
              >
                <Ionicons name="search" size={22} color={COLORS.gray[800]} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroIconButton}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={22} color={COLORS.gray[800]} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroIconButton}
                onPress={() => navigation.navigate('Cart')}
              >
                <Ionicons name="bag-outline" size={22} color={COLORS.gray[800]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar Premium */}
          <TouchableOpacity
            style={styles.searchBarPremium}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.9}
          >
            <Ionicons name="search" size={20} color={COLORS.gray[400]} />
            <Text style={styles.searchPlaceholder}>Buscar marcas, peças, estilos...</Text>
            <View style={styles.searchFilter}>
              <Ionicons name="options" size={18} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Categories - Instagram Style Circles */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map((cat) => renderCategoryCircle(cat))}
          </ScrollView>
        </View>

        {/* Banner Premium */}
        <TouchableOpacity
          style={styles.premiumBanner}
          onPress={handleSellPress}
          activeOpacity={0.95}
        >
          <LinearGradient
            colors={[COLORS.primary, '#527363']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            <View style={styles.bannerLeft}>
              <Text style={styles.bannerLabel}>NOVO</Text>
              <Text style={styles.bannerHeadline}>Desapega suas peças</Text>
              <Text style={styles.bannerSubheadline}>Venda rápido e ganhe dinheiro</Text>
              <View style={styles.bannerButton}>
                <Text style={styles.bannerButtonText}>VENDER AGORA</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
              </View>
            </View>
            <View style={styles.bannerDecoration}>
              <View style={styles.bannerCircle1} />
              <View style={styles.bannerCircle2} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Featured Section - First item large */}
        {filteredItems.length > 0 && (
          <View style={styles.featuredSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionLabel}>DESTAQUE</Text>
                <Text style={styles.sectionTitle}>Peças em Alta</Text>
              </View>
              <TouchableOpacity style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>Ver tudo</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            {renderFeaturedCard(filteredItems[0])}
          </View>
        )}

        {/* Products Grid */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>NOVIDADES</Text>
              <Text style={styles.sectionTitle}>Acabaram de Chegar</Text>
            </View>
            <Text style={styles.productCount}>{filteredItems.length} peças</Text>
          </View>

          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="search" size={48} color={COLORS.gray[300]} />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma peça encontrada</Text>
              <Text style={styles.emptySubtitle}>Seja a primeira a desapegar!</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleSellPress}>
                <LinearGradient
                  colors={[COLORS.primary, '#527363']}
                  style={styles.emptyButtonGradient}
                >
                  <Text style={styles.emptyButtonText}>Vender agora</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {filteredItems.slice(1).map((item, index) => renderProductCard(item, index))}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.gray[500],
    fontWeight: '500',
  },

  // Fixed Header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  fixedHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoSmall: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoSmallApega: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray[900],
  },
  logoSmallDesapega: {
    fontSize: 18,
    fontWeight: '300',
    color: COLORS.gray[500],
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },

  // Hero Header
  heroHeader: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoApega: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.gray[900],
    letterSpacing: -1,
  },
  logoDesapega: {
    fontSize: 26,
    fontWeight: '300',
    color: COLORS.gray[500],
    letterSpacing: -1,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 8,
  },
  heroIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray[400],
    marginLeft: 12,
  },
  searchFilter: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },

  // Categories
  categoriesSection: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    marginBottom: 8,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  categoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCircleActive: {
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOWS.md,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: COLORS.gray[900],
    fontWeight: '600',
  },

  // Premium Banner
  premiumBanner: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  bannerGradient: {
    padding: 24,
    flexDirection: 'row',
    minHeight: 160,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerLeft: {
    flex: 1,
    zIndex: 1,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  bannerHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  bannerSubheadline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  bannerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  bannerDecoration: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  bannerCircle1: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bannerCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 60,
    left: 40,
  },

  // Featured Section
  featuredSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[900],
    letterSpacing: -0.5,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  productCount: {
    fontSize: 14,
    color: COLORS.gray[500],
  },

  // Featured Card
  featuredCard: {
    width: CARD_LARGE,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  featuredContent: {
    gap: 4,
  },
  featuredBrand: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.5,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  featuredPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  featuredPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  featuredDiscount: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredDiscountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  featuredHeart: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Products Section
  productsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    marginTop: 8,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },

  // Product Card
  productCard: {
    width: CARD_WIDTH,
    marginBottom: 24,
    backgroundColor: COLORS.white,
  },
  productCardEven: {
    marginRight: 8,
    marginLeft: 8,
  },
  productCardOdd: {
    marginLeft: 8,
    marginRight: 8,
  },
  productImageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: COLORS.gray[50],
  },
  productImage: {
    width: '100%',
    aspectRatio: 0.8,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
  },
  conditionBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.gray[800],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionNew: {
    backgroundColor: '#10B981',
  },
  conditionSeminew: {
    backgroundColor: COLORS.primary,
  },
  conditionText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  favoriteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  productInfo: {
    paddingHorizontal: 2,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    lineHeight: 18,
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sizeTag: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sizeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray[900],
  },
  originalPriceText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[400],
    textDecorationLine: 'line-through',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.gray[500],
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
