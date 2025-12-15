import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavigation, AppHeader } from '../components';
import { getProducts, Product } from '../services/products';
import { loadToken } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getCardWidth, moderateScale, screenWidth, isSmallDevice, isTablet } from '../utils/responsive';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = moderateScale(100);
const ITEM_WIDTH = getCardWidth(isTablet ? 4 : 2, 12, 12);
const GRID_COLUMNS = isTablet ? 4 : 2;

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const CATEGORIES = [
  { id: '1', name: 'Tudo', icon: 'apps' },
  { id: '2', name: 'Pra você', icon: 'heart' },
  { id: '3', name: 'Ofertas', icon: 'pricetag' },
  { id: '4', name: 'Novidades', icon: 'sparkles' },
  { id: '5', name: 'Roupas', icon: 'shirt' },
  { id: '6', name: 'Calçados', icon: 'footsteps' },
  { id: '7', name: 'Bolsas', icon: 'bag-handle' },
  { id: '8', name: 'Acessórios', icon: 'watch' },
];

const BANNERS = [
  {
    id: '1',
    title: 'Inverno 2025',
    subtitle: 'Até 60% OFF',
    image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&h=400&fit=crop',
    backgroundColor: '#E8EAF6',
  },
  {
    id: '2',
    title: 'Marcas Premium',
    subtitle: 'Peças selecionadas',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=400&fit=crop',
    backgroundColor: '#E5F0FF',
  },
  {
    id: '3',
    title: 'Novidades',
    subtitle: 'Recém chegados',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=400&fit=crop',
    backgroundColor: '#F0E5FF',
  },
  {
    id: '4',
    title: 'Moda Sustentável',
    subtitle: 'Consciente e estilosa',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=400&fit=crop',
    backgroundColor: '#E8F5E9',
  },
];

// Item type for display
interface DisplayItem {
  id: string;
  title: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category?: string;
  size?: string;
  color?: string;
  condition: string;
  description?: string;
  seller?: {
    id: string;
    name: string;
    avatar?: string;
    rating?: number;
    city?: string;
  };
}

export default function HomeScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('1');
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerScrollRef = useRef<FlatList>(null);

  // Verificar auth antes de vender
  const handleSellPress = async () => {
    const token = await loadToken();
    if (token) {
      navigation.navigate('NewItem');
    } else {
      navigation.navigate('Login');
    }
  };

  // Carregar produtos da API
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

  // Carregar produtos ao montar
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(false);
  }, [fetchProducts]);

  // Converter produtos da API para o formato de exibição
  const allItems: DisplayItem[] = useMemo(() => {
    return products.map(product => {
      // Garantir que price é um número válido
      const price = typeof product.price === 'string'
        ? parseFloat(product.price)
        : (product.price || 0);
      const originalPrice = product.original_price
        ? (typeof product.original_price === 'string'
            ? parseFloat(product.original_price)
            : product.original_price)
        : undefined;

      return {
        id: product.id,
        title: product.title || 'Sem título',
        brand: product.brand,
        price: isNaN(price) ? 0 : price,
        originalPrice: originalPrice && !isNaN(originalPrice) ? originalPrice : undefined,
        images: product.images?.map(img => img.image_url) ||
                (product.image_url ? [product.image_url] : ['https://via.placeholder.com/400']),
        category: product.category_name,
        size: product.size,
        color: product.color,
        condition: product.condition || 'usado',
        description: product.description,
        seller: {
          id: product.seller_id,
          name: product.seller_name || 'Vendedor',
          avatar: product.seller_avatar,
          rating: product.seller_rating,
          city: product.seller_city,
        },
      };
    });
  }, [products]);

  const formatPrice = (price: number | string | undefined | null) => {
    if (price === undefined || price === null) return 'R$ 0,00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'R$ 0,00';
    return `R$ ${numPrice.toFixed(2).replace('.', ',')}`;
  };

  // Filtrar produtos por categoria
  const getFilteredItems = () => {
    if (selectedCategory === '1') return allItems; // Tudo
    if (selectedCategory === '2') return allItems.slice(0, 6); // Pra você
    if (selectedCategory === '3') return allItems.filter(i => i.originalPrice && ((i.originalPrice - i.price) / i.originalPrice) >= 0.5); // Black Friday
    if (selectedCategory === '4') return allItems.slice(6, 10); // Só nesse finde
    if (selectedCategory === '5') return allItems.slice(10, 16); // Chegou a hora
    if (selectedCategory === '6') return allItems.filter(i => i.category === 'feminino' || i.category === 'masculino'); // Roupas
    if (selectedCategory === '7') return allItems.filter(i => i.category === 'calcados'); // Calçados
    if (selectedCategory === '8') return allItems.filter(i => i.category === 'bolsas'); // Bolsas
    if (selectedCategory === '9') return allItems.filter(i => i.category === 'acessorios'); // Acessórios
    return allItems;
  };

  const filteredItems = getFilteredItems();

  // Auto-scroll banners
  React.useEffect(() => {
    const interval = setInterval(() => {
      const nextBanner = (currentBanner + 1) % BANNERS.length;
      setCurrentBanner(nextBanner);
      bannerScrollRef.current?.scrollToOffset({
        offset: nextBanner * width,
        animated: true,
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentBanner]);

  const renderBanner = ({ item, index }: { item: typeof BANNERS[0]; index: number }) => (
    <View style={styles.bannerWrapper}>
      <TouchableOpacity
        style={[styles.banner, { backgroundColor: item.backgroundColor }]}
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.image }} style={styles.bannerImage} />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>{item.title}</Text>
          <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: DisplayItem }) => {
    // Calcular desconto com proteção contra divisão por zero
    const discount = item.originalPrice && item.originalPrice > 0 && item.price > 0
      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => navigation.navigate('ItemDetail', { item })}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        <View style={styles.itemContent}>
          <Text style={styles.itemBrand} numberOfLines={1}>
            {item.brand || 'Marca'}
          </Text>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.priceContainer}>
            {item.originalPrice && (
              <Text style={styles.originalPrice}>
                {formatPrice(item.originalPrice)}
              </Text>
            )}
            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Estado vazio - mais atrativo
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      {/* Hero Section */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark || '#527363']}
        style={styles.emptyHero}
      >
        <Text style={styles.emptyHeroTitle}>bem-vinda ao apega desapega!</Text>
        <Text style={styles.emptyHeroSubtitle}>
          o brechó online de moda circular e consciente
        </Text>
      </LinearGradient>

      {/* Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresSectionTitle}>como funciona</Text>

        <View style={styles.featureCard}>
          <View style={styles.featureIconWrapper}>
            <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>fotografe suas peças</Text>
            <Text style={styles.featureDescription}>tire fotos bonitas das roupas que não usa mais</Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIconWrapper}>
            <Ionicons name="pricetag-outline" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>defina seu preço</Text>
            <Text style={styles.featureDescription}>você escolhe quanto cobrar pela peça</Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIconWrapper}>
            <Ionicons name="cash-outline" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>receba o pagamento</Text>
            <Text style={styles.featureDescription}>vendeu? o dinheiro cai na sua conta</Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleSellPress}
        >
          <Ionicons name="add-circle-outline" size={24} color={COLORS.white} />
          <Text style={styles.ctaButtonText}>desapegar minha primeira peça</Text>
        </TouchableOpacity>

        <Text style={styles.ctaHint}>é grátis e leva menos de 2 minutos</Text>
      </View>
    </View>
  );

  // Loading
  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader navigation={navigation} cartCount={0} notificationCount={0} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>carregando peças...</Text>
        </View>
        <BottomNavigation navigation={navigation} activeRoute="Home" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} cartCount={0} notificationCount={0} />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <FlatList
          ref={bannerScrollRef}
          data={BANNERS}
          renderItem={renderBanner}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="center"
          snapToInterval={width}
          decelerationRate="fast"
          pagingEnabled={false}
          contentContainerStyle={styles.bannersContainer}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentBanner(index);
          }}
          scrollEventThrottle={16}
          onScrollToIndexFailed={() => {}}
        />

        <View style={styles.bannerIndicators}>
          {BANNERS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentBanner === index && styles.indicatorActive,
              ]}
            />
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={category.icon as any}
                size={18}
                color={selectedCategory === category.id ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {allItems.length === 0 ? (
          renderEmptyState()
        ) : selectedCategory === '1' ? (
          <>
            {/* Novidades - produtos mais recentes */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>novidades</Text>
              <Text style={styles.sectionSubtitle}>{allItems.length} peças</Text>
            </View>
            <View style={styles.grid}>
              {allItems.slice(0, 6).map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  {renderItem({ item })}
                </View>
              ))}
            </View>

            {/* Ofertas - produtos com desconto */}
            {allItems.filter(i => i.originalPrice && ((i.originalPrice - i.price) / i.originalPrice) >= 0.2).length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>ofertas</Text>
                  <Text style={styles.sectionSubtitle}>{allItems.filter(i => i.originalPrice && ((i.originalPrice - i.price) / i.originalPrice) >= 0.2).length} peças</Text>
                </View>
                <View style={styles.grid}>
                  {allItems.filter(i => i.originalPrice && ((i.originalPrice - i.price) / i.originalPrice) >= 0.2).slice(0, 4).map((item) => (
                    <View key={item.id} style={styles.gridItem}>
                      {renderItem({ item })}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Mais peças */}
            {allItems.length > 6 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>mais peças</Text>
                  <Text style={styles.sectionSubtitle}>{allItems.slice(6).length} peças</Text>
                </View>
                <View style={styles.grid}>
                  {allItems.slice(6).map((item) => (
                    <View key={item.id} style={styles.gridItem}>
                      {renderItem({ item })}
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {CATEGORIES.find(c => c.id === selectedCategory)?.name.toLowerCase()}
              </Text>
              <Text style={styles.sectionSubtitle}>{filteredItems.length} peças</Text>
            </View>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyCategory}>
                <Text style={styles.emptyCategoryText}>nenhuma peça nesta categoria</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredItems.map((item) => (
                  <View key={item.id} style={styles.gridItem}>
                    {renderItem({ item })}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 45,
    paddingBottom: SPACING.lg,
    ...SHADOWS.lg,
    elevation: 12,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoTextContainer: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 22,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  logoSubtext: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    opacity: 0.95,
    lineHeight: 16,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bannersContainer: {
    paddingTop: SPACING.md,
    paddingBottom: 0,
  },
  bannerWrapper: {
    width: width,
    paddingHorizontal: SPACING.md,
  },
  banner: {
    width: '100%',
    height: BANNER_HEIGHT,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bannerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    fontWeight: '500',
  },
  bannerIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  indicatorActive: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
  categoriesContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginRight: SPACING.sm,
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.sm,
  },
  gridItem: {
    width: ITEM_WIDTH,
    paddingHorizontal: 6,
    marginBottom: SPACING.md,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  itemImage: {
    width: '100%',
    aspectRatio: 0.95,
    backgroundColor: COLORS.gray[200],
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  itemContent: {
    padding: SPACING.xs,
  },
  itemBrand: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray[600],
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.gray[500],
    textDecorationLine: 'line-through',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
  // New empty state styles
  emptyStateContainer: {
    flex: 1,
  },
  emptyHero: {
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.xl,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
  },
  emptyHeroTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptyHeroSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  featuresSectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  featureIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight || '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  ctaSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
    width: '100%',
  },
  ctaButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  ctaHint: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
  },
  emptyCategory: {
    paddingVertical: SPACING['2xl'],
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textTertiary,
  },
});
