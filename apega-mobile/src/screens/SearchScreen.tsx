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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { BottomNavigation } from '../components';
import { getProducts, Product } from '../services/products';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 768;
const CARD_WIDTH = isDesktop ? (width - 120) / 4 : (width - 36) / 2;

const CATEGORIES = [
  { id: 'all', name: 'Tudo', icon: 'sparkles', color: '#FF6B6B' },
  { id: 'vestidos', name: 'Vestidos', icon: 'shirt', color: '#4ECDC4' },
  { id: 'blusas', name: 'Blusas', icon: 'shirt-outline', color: '#45B7D1' },
  { id: 'calcas', name: 'Calças', icon: 'body', color: '#96CEB4' },
  { id: 'saias', name: 'Saias', icon: 'flower', color: '#FFEAA7' },
  { id: 'calcados', name: 'Calçados', icon: 'footsteps', color: '#DDA0DD' },
  { id: 'bolsas', name: 'Bolsas', icon: 'bag-handle', color: '#F0E68C' },
  { id: 'acessorios', name: 'Acessórios', icon: 'diamond', color: '#FFB6C1' },
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

  const renderProductCard = (item: Product, index: number) => {
    const imageHeight = index % 3 === 0 ? 240 : 180;
    const imageUrl = item.image_url || (item.images && item.images[0]?.image_url) || null;
    const hasDiscount = item.original_price && item.original_price > item.price;
    const discount = hasDiscount
      ? Math.round(((item.original_price! - item.price) / item.original_price!) * 100)
      : 0;

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
              colors={['#f0f0f0', '#e0e0e0']}
              style={[styles.productImage, styles.imagePlaceholder]}
            >
              <Ionicons name="image-outline" size={32} color="#bbb" />
            </LinearGradient>
          )}

          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}

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
          <Text style={styles.titleText} numberOfLines={1}>{item.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
            {hasDiscount && (
              <Text style={styles.originalPriceText}>{formatPrice(item.original_price)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar peças, marcas..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
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
            color={showFilters ? '#fff' : '#333'}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryItem,
                selectedCategory === cat.id && styles.categoryItemActive
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                <Ionicons name={cat.icon as any} size={20} color={cat.color} />
              </View>
              <Text style={[
                styles.categoryName,
                selectedCategory === cat.id && styles.categoryNameActive
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {loading ? 'Buscando...' : `${filteredProducts.length} peças`}
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
              <Text style={styles.loadingText}>Buscando peças...</Text>
            </View>
          ) : filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map((item, index) => renderProductCard(item, index))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={48} color="#ddd" />
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
    backgroundColor: '#fff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },

  // Filters
  filtersSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 8,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Scroll Content
  scrollContent: {
    paddingTop: 16,
  },

  // Categories
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  categoryItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
    minWidth: 80,
  },
  categoryItemActive: {
    backgroundColor: COLORS.primary + '15',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  categoryNameActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Results
  resultsSection: {
    paddingHorizontal: isDesktop ? 40 : 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  clearFilters: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
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
    marginBottom: 20,
  },
  imageContainer: {
    borderRadius: 16,
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
    top: 10,
    left: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  sizeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sizeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  cardInfo: {
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  brandText: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  originalPriceText: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
