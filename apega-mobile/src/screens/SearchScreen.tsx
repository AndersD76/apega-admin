import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavigation, AppHeader } from '../components';
import { getProducts, Product } from '../services/products';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 24) / 2;
// Força reload com logos remotas

const BRANDS = [
  {
    id: '1',
    name: 'ZARA',
    logo: 'https://logo.clearbit.com/zara.com',
    filter: 'Zara'
  },
  {
    id: '2',
    name: 'FARM',
    logo: 'https://logo.clearbit.com/farmrio.com.br',
    filter: 'Farm'
  },
  {
    id: '3',
    name: 'AREZZO',
    logo: 'https://logo.clearbit.com/arezzo.com.br',
    filter: 'Arezzo'
  },
  {
    id: '4',
    name: 'SCHUTZ',
    logo: 'https://logo.clearbit.com/schutz-shoes.com',
    filter: 'Schutz'
  },
];

const CATEGORIES = [
  { id: 'roupas', name: 'Roupas', icon: 'shirt-outline', filter: ['feminino', 'masculino'] },
  { id: 'calcados', name: 'Calçados', icon: 'footsteps-outline', filter: ['calcados'] },
  { id: 'bolsas', name: 'Bolsas', icon: 'bag-handle-outline', filter: ['bolsas'] },
  { id: 'acessorios', name: 'Acessórios', icon: 'watch-outline', filter: ['acessorios'] },
];

const PRICE_RANGES = [
  { id: 'all', label: 'Todos', min: 0, max: 999999 },
  { id: 'cheap', label: 'Até R$ 100', min: 0, max: 100 },
  { id: 'medium', label: 'R$ 100 - R$ 300', min: 100, max: 300 },
  { id: 'high', label: 'R$ 300 - R$ 500', min: 300, max: 500 },
  { id: 'premium', label: 'Acima de R$ 500', min: 500, max: 999999 },
];

const CONDITIONS = [
  { id: 'all', label: 'Todas' },
  { id: 'novo', label: 'Novo' },
  { id: 'seminovo', label: 'Seminovo' },
  { id: 'usado', label: 'Usado' },
];

const SIZES = [
  { id: 'all', label: 'Todos' },
  { id: 'PP', label: 'PP' },
  { id: 'P', label: 'P' },
  { id: 'M', label: 'M' },
  { id: 'G', label: 'G' },
  { id: 'GG', label: 'GG' },
];

const SORT_OPTIONS = [
  { id: 'recent', label: 'Mais recentes' },
  { id: 'price_asc', label: 'Menor preço' },
  { id: 'price_desc', label: 'Maior preço' },
  { id: 'popular', label: 'Mais populares' },
];

export default function SearchScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar produtos da API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const priceRange = PRICE_RANGES.find(p => p.id === selectedPrice);
      const response = await getProducts({
        search: searchQuery || undefined,
        brand: selectedBrand || undefined,
        condition: selectedCondition !== 'all' ? selectedCondition : undefined,
        size: selectedSize !== 'all' ? selectedSize : undefined,
        minPrice: priceRange && priceRange.id !== 'all' ? priceRange.min : undefined,
        maxPrice: priceRange && priceRange.id !== 'all' ? priceRange.max : undefined,
        sort: sortBy as any,
        limit: 50,
      });
      setProducts(response.products || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedBrand, selectedCondition, selectedSize, selectedPrice, sortBy]);

  // Carregar produtos ao iniciar e quando filtros mudarem
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const formatPrice = (price: number | string | undefined | null) => {
    if (price === undefined || price === null) return 'R$ 0,00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'R$ 0,00';
    return `R$ ${numPrice.toFixed(2).replace('.', ',')}`;
  };

  // Filtrar produtos (filtragem local adicional se necessário)
  const getFilteredProducts = () => {
    let filtered = products;

    // Filtrar por marca (se não foi feito na API)
    if (selectedBrand) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por marca
    if (selectedBrand) {
      filtered = filtered.filter(item =>
        item.brand?.toLowerCase() === selectedBrand.toLowerCase()
      );
    }

    // Filtrar por categoria
    if (selectedCategory) {
      const category = CATEGORIES.find(c => c.id === selectedCategory);
      if (category) {
        filtered = filtered.filter(item =>
          category.filter.includes(item.category)
        );
      }
    }

    // Filtrar por preço
    if (selectedPrice !== 'all') {
      const priceRange = PRICE_RANGES.find(p => p.id === selectedPrice);
      if (priceRange) {
        filtered = filtered.filter(item =>
          item.price >= priceRange.min && item.price <= priceRange.max
        );
      }
    }

    // Filtrar por condição
    if (selectedCondition !== 'all') {
      filtered = filtered.filter(item =>
        item.condition === selectedCondition
      );
    }

    // Filtrar por tamanho
    if (selectedSize !== 'all') {
      filtered = filtered.filter(item =>
        item.size === selectedSize
      );
    }

    // Ordenar
    if (sortBy === 'price_asc') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'popular') {
      filtered = [...filtered].sort((a, b) => (b.favorites || 0) - (a.favorites || 0));
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const activeFiltersCount = [
    selectedBrand,
    selectedCategory,
    selectedPrice !== 'all' ? selectedPrice : null,
    selectedCondition !== 'all' ? selectedCondition : null,
    selectedSize !== 'all' ? selectedSize : null,
  ].filter(Boolean).length;

  const handleBrandPress = (brand: typeof BRANDS[0]) => {
    setSelectedBrand(selectedBrand === brand.filter ? null : brand.filter);
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const clearAllFilters = () => {
    setSelectedBrand(null);
    setSelectedCategory(null);
    setSelectedPrice('all');
    setSelectedCondition('all');
    setSelectedSize('all');
    setSearchQuery('');
  };

  const renderProductCard = (item: Product) => {
    const discount = item.original_price
      ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
      : 0;

    // Usar image_url ou primeira imagem do array se disponível
    const imageUrl = item.image_url || (item.images && item.images[0]?.image_url) || null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.productCard}
        onPress={() => navigation.navigate('ItemDetail', { item: { ...item, images: [imageUrl] } })}
        activeOpacity={0.8}
      >
        <Image source={{ uri: imageUrl }} style={styles.productImage} />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        <View style={styles.productContent}>
          <Text style={styles.productBrand} numberOfLines={1}>
            {item.brand || 'Marca'}
          </Text>
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.priceContainer}>
            {item.original_price && (
              <Text style={styles.originalPrice}>
                {formatPrice(item.original_price)}
              </Text>
            )}
            <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader navigation={navigation} />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={22} color={COLORS.gray[500]} />
            <TextInput
              style={styles.searchInput}
              placeholder="busque por peças, marcas..."
              placeholderTextColor={COLORS.gray[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtros Ativos */}
        {activeFiltersCount > 0 && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedBrand && (
                <TouchableOpacity
                  style={styles.filterChip}
                  onPress={() => setSelectedBrand(null)}
                >
                  <Text style={styles.filterChipText}>{selectedBrand}</Text>
                  <Ionicons name="close" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              {selectedCategory && (
                <TouchableOpacity
                  style={styles.filterChip}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={styles.filterChipText}>
                    {CATEGORIES.find(c => c.id === selectedCategory)?.name}
                  </Text>
                  <Ionicons name="close" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              {selectedPrice !== 'all' && (
                <TouchableOpacity
                  style={styles.filterChip}
                  onPress={() => setSelectedPrice('all')}
                >
                  <Text style={styles.filterChipText}>
                    {PRICE_RANGES.find(p => p.id === selectedPrice)?.label}
                  </Text>
                  <Ionicons name="close" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              {selectedCondition !== 'all' && (
                <TouchableOpacity
                  style={styles.filterChip}
                  onPress={() => setSelectedCondition('all')}
                >
                  <Text style={styles.filterChipText}>
                    {CONDITIONS.find(c => c.id === selectedCondition)?.label}
                  </Text>
                  <Ionicons name="close" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              {selectedSize !== 'all' && (
                <TouchableOpacity
                  style={styles.filterChip}
                  onPress={() => setSelectedSize('all')}
                >
                  <Text style={styles.filterChipText}>{selectedSize}</Text>
                  <Ionicons name="close" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.clearAllChip}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearAllText}>limpar tudo</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Filtros Expandidos */}
        {showFilters && (
          <View style={styles.filtersSection}>
            {/* Preço */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Preço</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {PRICE_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.id}
                    style={[
                      styles.filterOption,
                      selectedPrice === range.id && styles.filterOptionActive
                    ]}
                    onPress={() => setSelectedPrice(range.id)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedPrice === range.id && styles.filterOptionTextActive
                    ]}>
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Condição */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Condição</Text>
              <View style={styles.filterOptionsRow}>
                {CONDITIONS.map((condition) => (
                  <TouchableOpacity
                    key={condition.id}
                    style={[
                      styles.filterOption,
                      selectedCondition === condition.id && styles.filterOptionActive
                    ]}
                    onPress={() => setSelectedCondition(condition.id)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedCondition === condition.id && styles.filterOptionTextActive
                    ]}>
                      {condition.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tamanho */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Tamanho</Text>
              <View style={styles.filterOptionsRow}>
                {SIZES.map((size) => (
                  <TouchableOpacity
                    key={size.id}
                    style={[
                      styles.filterOption,
                      selectedSize === size.id && styles.filterOptionActive
                    ]}
                    onPress={() => setSelectedSize(size.id)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedSize === size.id && styles.filterOptionTextActive
                    ]}>
                      {size.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Ordenação */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Ordenar por</Text>
              <View style={styles.filterOptionsRow}>
                {SORT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.filterOption,
                      sortBy === option.id && styles.filterOptionActive
                    ]}
                    onPress={() => setSortBy(option.id)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      sortBy === option.id && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>marcas em destaque</Text>
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <Text style={styles.seeAllText}>ver todas</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandsContainer}
          >
            {BRANDS.map((brand) => (
              <TouchableOpacity
                key={brand.id}
                style={styles.brandItem}
                activeOpacity={0.7}
                onPress={() => handleBrandPress(brand)}
              >
                <View style={[
                  styles.brandCircle,
                  selectedBrand === brand.filter && styles.brandCircleSelected
                ]}>
                  {!failedLogos.has(brand.id) ? (
                    <Image
                      source={{ uri: brand.logo }}
                      style={styles.brandLogo}
                      resizeMode="contain"
                      onError={() => {
                        setFailedLogos(prev => new Set(prev).add(brand.id));
                      }}
                    />
                  ) : (
                    <Text style={styles.brandLogoFallback}>{brand.name[0]}</Text>
                  )}
                </View>
                <Text style={styles.brandName}>{brand.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>categorias</Text>
          </View>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardSelected
                ]}
                activeOpacity={0.8}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={28}
                  color={selectedCategory === category.id ? COLORS.primary : COLORS.gray[600]}
                />
                <Text style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.categoryNameSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sempre mostrar resultados */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {loading ? 'Buscando...' : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'resultado' : 'resultados'}`}
            </Text>
            {(selectedBrand || selectedCategory || searchQuery) && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedBrand(null);
                  setSelectedCategory(null);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.clearFilters}>limpar filtros</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map(renderProductCard)}
            </View>
          ) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="search-outline" size={48} color={COLORS.textTertiary} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 12, textAlign: 'center' }}>
                Nenhum produto encontrado
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
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 50,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  section: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  brandsContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  },
  brandItem: {
    alignItems: 'center',
  },
  brandCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
    padding: SPACING.sm,
  },
  brandCircleSelected: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    ...SHADOWS.md,
  },
  brandLogo: {
    width: 56,
    height: 56,
  },
  brandLogoFallback: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
  brandName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  categoryCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    height: 100,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    ...SHADOWS.xs,
  },
  categoryCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginTop: SPACING.xs,
  },
  categoryNameSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  resultsSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resultsTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  clearFilters: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  productCard: {
    width: ITEM_WIDTH,
    paddingHorizontal: 6,
    marginBottom: SPACING.md,
  },
  productImage: {
    width: '100%',
    aspectRatio: 0.95,
    backgroundColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.lg,
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm + 6,
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
  productContent: {
    paddingTop: SPACING.xs,
  },
  productBrand: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray[600],
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  productTitle: {
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
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  activeFiltersContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    gap: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  clearAllChip: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filtersSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  filterGroup: {
    marginBottom: SPACING.md,
  },
  filterGroupTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  filterOption: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray[100],
    marginRight: SPACING.sm,
  },
  filterOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterOptionTextActive: {
    color: COLORS.primary,
  },
});
