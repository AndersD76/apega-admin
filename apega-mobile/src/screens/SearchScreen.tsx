import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  Image,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { BottomNavigation, MainHeader } from '../components';
import { getProducts, Product } from '../services/products';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 768;
const CARD_WIDTH = isDesktop ? (width - 120) / 4 : (width - 36) / 2;

// Banner images para o carrossel
const BANNER_IMAGES = [
  { uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80', title: 'LIQUIDAÇÃO', subtitle: 'Até 70% OFF' },
  { uri: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80', title: 'NOVIDADES', subtitle: 'Peças exclusivas' },
  { uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', title: 'PREMIUM', subtitle: 'Marcas importadas' },
];

const CATEGORIES = [
  { id: 'all', name: 'Tudo', image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=300&q=80', icon: '✨' },
  { id: 'novidades', name: 'Novidades', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&q=80', icon: '🆕' },
  { id: 'vestidos', name: 'Vestidos', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&q=80', icon: '👗' },
  { id: 'blusas', name: 'Blusas', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&q=80', icon: '👚' },
  { id: 'calcas', name: 'Calças', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&q=80', icon: '👖' },
  { id: 'saias', name: 'Saias', image: 'https://images.unsplash.com/photo-1577900232427-18219b9166a0?w=300&q=80', icon: '🩱' },
  { id: 'calcados', name: 'Calçados', image: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=300&q=80', icon: '👠' },
  { id: 'bolsas', name: 'Bolsas', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&q=80', icon: '👜' },
  { id: 'acessorios', name: 'Acessórios', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&q=80', icon: '💎' },
];

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
const CONDITIONS = ['Novo', 'Seminovo', 'Usado'];

export default function SearchScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Banner carousel state
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerFade = useRef(new Animated.Value(1)).current;

  // Auto-rotate banner
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

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getProducts({
        search: searchQuery || undefined,
        condition: selectedCondition?.toLowerCase() || undefined,
        size: selectedSize || undefined,
        limit: 50,
      });
      setProducts(response.products || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCondition, selectedSize]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchProducts]);

  const formatPrice = (price: number | string | undefined | null) => {
    if (price === undefined || price === null) return 'R$ 0';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'R$ 0';
    return `R$ ${numPrice.toFixed(0)}`;
  };

  const getFilteredProducts = () => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item =>
        item.category_name?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const getConditionStyle = (condition: string | undefined) => {
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('novo') && !cond.includes('semi')) return { bg: '#10B981', label: 'Novo' };
    if (cond.includes('seminovo') || cond.includes('semi')) return { bg: COLORS.primary, label: 'Seminovo' };
    return { bg: '#F59E0B', label: 'Usado' };
  };

  const renderProductCard = (item: Product, index: number) => {
    const imageHeight = 220;
    const imageUrl = item.image_url || (item.images && item.images[0]?.image_url) || null;
    const hasDiscount = item.original_price && item.original_price > item.price;
    const discount = hasDiscount
      ? Math.round(((item.original_price! - item.price) / item.original_price!) * 100)
      : 0;
    const conditionInfo = getConditionStyle(item.condition);

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.productCard, { width: CARD_WIDTH }]}
        onPress={() => navigation.navigate('ItemDetail', { item: { ...item, images: imageUrl ? [imageUrl] : [] } })}
        activeOpacity={0.95}
      >
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
          ) : (
            <LinearGradient
              colors={[COLORS.primaryExtraLight, COLORS.primaryLight]}
              style={[styles.productImage, styles.imagePlaceholder]}
            >
              <Ionicons name="image-outline" size={40} color={COLORS.primary} />
            </LinearGradient>
          )}

          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}

          <View style={[styles.conditionBadge, { backgroundColor: conditionInfo.bg }]}>
            <Text style={styles.conditionText}>{conditionInfo.label}</Text>
          </View>

          {item.size && (
            <View style={styles.sizeBadge}>
              <Text style={styles.sizeText}>{item.size}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          {item.brand && (
            <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text>
          )}
          <Text style={styles.titleText} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
          {hasDiscount && (
            <Text style={styles.originalPriceText}>{formatPrice(item.original_price)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <MainHeader navigation={navigation} title="Explorar" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* BANNER HERO */}
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
          {/* Dots */}
          <View style={styles.bannerDots}>
            {BANNER_IMAGES.map((_, index) => (
              <View
                key={index}
                style={[styles.bannerDot, currentBanner === index && styles.bannerDotActive]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="O que você está procurando?"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={showFilters ? '#fff' : COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersSection}>
            <Text style={styles.filterTitle}>Tamanho</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {SIZES.map(size => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.filterChip,
                    selectedSize === size && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedSize(selectedSize === size ? null : size)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedSize === size && styles.filterChipTextActive
                  ]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterTitle}>Condição</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {CONDITIONS.map(condition => (
                <TouchableOpacity
                  key={condition}
                  style={[
                    styles.filterChip,
                    selectedCondition === condition && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedCondition(selectedCondition === condition ? null : condition)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedCondition === condition && styles.filterChipTextActive
                  ]}>
                    {condition}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Categories - Grandes e visuais */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>CATEGORIAS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === cat.id && styles.categoryCardActive
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Image source={{ uri: cat.image }} style={styles.categoryImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)']}
                  style={styles.categoryOverlay}
                />
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </View>
                {selectedCategory === cat.id && (
                  <View style={styles.categoryActiveIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {loading ? 'Buscando...' : `${filteredProducts.length} peças encontradas`}
            </Text>
            {(selectedSize || selectedCondition) && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedSize(null);
                  setSelectedCondition(null);
                }}
              >
                <Text style={styles.clearFilters}>Limpar filtros</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Buscando peças incríveis...</Text>
            </View>
          ) : filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map((item, index) => renderProductCard(item, index))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={64} color={COLORS.primaryLight} />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma peça encontrada</Text>
              <Text style={styles.emptySubtitle}>
                Tente buscar com outras palavras ou filtros
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Search" />
    </View>
  );
}

const styles = StyleSheet.create({
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

  // Scroll
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero Banner
  heroBanner: {
    height: isDesktop ? 300 : 200,
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
    fontSize: isDesktop ? 48 : 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  heroBannerSubtitle: {
    fontSize: isDesktop ? 20 : 16,
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
    width: 24,
  },

  // Search Section
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: isDesktop ? 60 : 16,
    gap: 12,
    marginBottom: 24,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 20,
    height: 56,
    gap: 12,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  filterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  // Filters
  filtersSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: isDesktop ? 60 : 16,
    marginBottom: 24,
    borderRadius: 20,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: COLORS.primaryExtraLight,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Categories Section
  categoriesSection: {
    paddingHorizontal: isDesktop ? 60 : 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.gray[800],
    marginBottom: 20,
    letterSpacing: 2,
  },
  categoriesScroll: {
    gap: 16,
  },
  categoryCard: {
    width: isDesktop ? 160 : 120,
    height: isDesktop ? 200 : 150,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  categoryCardActive: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  categoryActiveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Results
  resultsSection: {
    paddingHorizontal: isDesktop ? 60 : 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  clearFilters: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray[500],
  },

  // Products Grid
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },

  // Product Card
  productCard: {
    marginHorizontal: 6,
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  sizeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
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
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 20,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.gray[900],
  },
  originalPriceText: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
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
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
});
