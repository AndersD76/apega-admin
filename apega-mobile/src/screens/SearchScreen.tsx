import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { productsService } from '../api';
import { formatPrice } from '../utils/format';
import { colors, spacing, getColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { ProductListSkeleton } from '../components/ProductListSkeleton';

// Garimpeiro mode color
const GARIMPEIRO_COLOR = '#D4A574';

const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: 'grid-outline' },
  { id: 'roupas', name: 'Roupas', icon: 'shirt-outline' },
  { id: 'bolsas', name: 'Bolsas', icon: 'bag-handle-outline' },
  { id: 'calcados', name: 'Calçados', icon: 'footsteps-outline' },
  { id: 'acessorios', name: 'Acessórios', icon: 'watch-outline' },
  { id: 'joias', name: 'Joias', icon: 'diamond-outline' },
];

const CONDITIONS = [
  { id: 'all', name: 'Todas' },
  { id: 'novo', name: 'Novo' },
  { id: 'seminovo', name: 'Seminovo' },
  { id: 'usado', name: 'Usado' },
  { id: 'vintage', name: 'Vintage' },
];

const SORT_OPTIONS = [
  { id: 'recent', name: 'Mais recentes' },
  { id: 'price_asc', name: 'Menor preço' },
  { id: 'price_desc', name: 'Maior preço' },
  { id: 'popular', name: 'Mais populares' },
];

export function SearchScreen({ navigation, route }: any) {
  const { categoryId, categoryName, collection, showOffers, garimpeiro } = route.params || {};
  const { width, gridColumns, productWidth, isMobile, isTablet, isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryId || 'all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedSort, setSelectedSort] = useState('recent');
  const [selectedCollection, setSelectedCollection] = useState(collection || '');
  const [onlyOffers, setOnlyOffers] = useState(showOffers || false);
  const [garimpeiroMode, setGarimpeiroMode] = useState(garimpeiro || false);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  // Apply filters when screen gains focus with new params
  useFocusEffect(
    useCallback(() => {
      // Apply params on focus
      setSelectedCategory(categoryId || 'all');
      setSelectedCollection(collection || '');
      setOnlyOffers(showOffers || false);
      setGarimpeiroMode(garimpeiro || false);
    }, [categoryId, collection, showOffers, garimpeiro])
  );

  // Responsive values from hook
  const numColumns = gridColumns;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 20, sort: selectedSort };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedCondition !== 'all') params.condition = selectedCondition;
      // Garimpeiro mode - only last 2 hours
      if (garimpeiroMode) params.created_after = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const res = await productsService.getProducts(params);
      setProducts(res.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedCondition, selectedSort, garimpeiroMode]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedCondition, selectedCollection, onlyOffers, selectedSort, garimpeiroMode, fetchProducts]);

  const handleSearch = () => {
    fetchProducts();
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedCondition('all');
    setSelectedSort('recent');
    setSelectedCollection('');
    setOnlyOffers(false);
    setGarimpeiroMode(false);
  };

  const activeFiltersCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedCondition !== 'all' ? 1 : 0) +
    (selectedSort !== 'recent' ? 1 : 0) +
    (selectedCollection ? 1 : 0) +
    (onlyOffers ? 1 : 0) +
    (garimpeiroMode ? 1 : 0);

  const imageHeight = productWidth * 1.2;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#A3A3A3" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar marcas, peças..."
            placeholderTextColor="#A3A3A3"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#A3A3A3" />
            </Pressable>
          )}
        </View>
        <Pressable
          style={styles.discoveryBtn}
          onPress={() => navigation.navigate('Discovery')}
        >
          <Ionicons name="play-circle" size={24} color="#fff" />
        </Pressable>
        <Pressable style={styles.filterBtn} onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={22} color={colors.primary} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesWrap} contentContainerStyle={styles.categoriesContent}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={selectedCategory === cat.id ? '#fff' : '#525252'}
            />
            <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Active Filters Tags */}
      {(onlyOffers || selectedCollection || garimpeiroMode) && (
        <View style={styles.activeFiltersRow}>
          {garimpeiroMode && (
            <Pressable style={styles.garimpeiroFilterTag} onPress={() => setGarimpeiroMode(false)}>
              <Ionicons name="time" size={14} color={GARIMPEIRO_COLOR} />
              <Text style={styles.garimpeiroFilterText}>Garimpando</Text>
              <Ionicons name="close-circle" size={16} color={GARIMPEIRO_COLOR} />
            </Pressable>
          )}
          {onlyOffers && (
            <Pressable style={styles.activeFilterTag} onPress={() => setOnlyOffers(false)}>
              <Ionicons name="pricetag" size={14} color="#FF6B6B" />
              <Text style={styles.activeFilterText}>Ofertas</Text>
              <Ionicons name="close-circle" size={16} color="#A3A3A3" />
            </Pressable>
          )}
          {selectedCollection && (
            <Pressable style={styles.activeFilterTag} onPress={() => setSelectedCollection('')}>
              <Ionicons name="albums" size={14} color={colors.primary} />
              <Text style={styles.activeFilterText}>{selectedCollection}</Text>
              <Ionicons name="close-circle" size={16} color="#A3A3A3" />
            </Pressable>
          )}
        </View>
      )}

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{products.length} resultados</Text>
        <Pressable style={styles.sortBtn} onPress={() => setShowFilters(true)}>
          <Text style={styles.sortText}>{SORT_OPTIONS.find(s => s.id === selectedSort)?.name}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
        </Pressable>
      </View>

      {/* Products Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsGrid}
      >
        {loading ? (
          <ProductListSkeleton count={6} />
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#E8E8E8" />
            <Text style={styles.emptyTitle}>Ninguém largou isso ainda...</Text>
            <Text style={styles.emptyText}>Tenta buscar por outro termo ou remove os filtros</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {products.map((item) => {
              const discount = item.original_price
                ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
                : 0;

              return (
                <Pressable
                  key={item.id}
                  style={[styles.productCard, { width: productWidth }]}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                >
                  <View style={[styles.productImgWrap, { height: imageHeight }]}>
                    <Image source={{ uri: item.image || item.image_url }} style={styles.productImg} contentFit="cover" />
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
                    {item.condition && (
                      <View style={styles.conditionTag}>
                        <Text style={styles.conditionText}>{item.condition}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productBrand}>{item.brand || 'Marca'}</Text>
                    <Text style={styles.productName} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>R$ {formatPrice(item.price)}</Text>
                      {item.original_price && <Text style={styles.oldPrice}>R$ {formatPrice(item.original_price)}</Text>}
                    </View>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color="#A3A3A3" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {[item.city || item.seller_city, item.state || item.seller_state].filter(Boolean).join(', ') || 'Brasil'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Filters Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Garimpeiro Mode */}
              <View style={styles.garimpeiroSection}>
                <View style={styles.garimpeiroHeader}>
                  <Ionicons name="time" size={20} color={GARIMPEIRO_COLOR} />
                  <Text style={styles.garimpeiroTitle}>MODO GARIMPEIRO</Text>
                </View>
                <View style={styles.garimpeiroContent}>
                  <View style={styles.garimpeiroToggleRow}>
                    <Text style={styles.garimpeiroToggleText}>So ultimas 2 horas</Text>
                    <Switch
                      value={garimpeiroMode}
                      onValueChange={setGarimpeiroMode}
                      trackColor={{ false: '#E8E8E8', true: GARIMPEIRO_COLOR }}
                      thumbColor={garimpeiroMode ? '#fff' : '#f4f3f4'}
                    />
                  </View>
                  <Text style={styles.garimpeiroHint}>
                    Ative para ver apenas pecas recem-largadas!
                  </Text>
                </View>
              </View>

              {/* Condition */}
              <Text style={styles.filterLabel}>Condicao</Text>
              <View style={styles.filterOptions}>
                {CONDITIONS.map((cond) => (
                  <Pressable
                    key={cond.id}
                    style={[styles.filterOption, selectedCondition === cond.id && styles.filterOptionActive]}
                    onPress={() => setSelectedCondition(cond.id)}
                  >
                    <Text style={[styles.filterOptionText, selectedCondition === cond.id && styles.filterOptionTextActive]}>
                      {cond.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Sort */}
              <Text style={styles.filterLabel}>Ordenar por</Text>
              <View style={styles.filterOptions}>
                {SORT_OPTIONS.map((sort) => (
                  <Pressable
                    key={sort.id}
                    style={[styles.filterOption, selectedSort === sort.id && styles.filterOptionActive]}
                    onPress={() => setSelectedSort(sort.id)}
                  >
                    <Text style={[styles.filterOptionText, selectedSort === sort.id && styles.filterOptionTextActive]}>
                      {sort.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Limpar filtros</Text>
              </Pressable>
              <Pressable style={styles.applyBtn} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyBtnText}>Aplicar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: '#FAFAFA' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8, borderWidth: 1, borderColor: '#E8E8E8', minWidth: 0 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A1A', minWidth: 0 },
  discoveryBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  filterBadge: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  // Categories
  categoriesWrap: { flexGrow: 0, marginBottom: 4 },
  categoriesContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E8E8' },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: 14, fontWeight: '500', color: '#525252' },
  categoryChipTextActive: { color: '#fff' },

  // Active Filters
  activeFiltersRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8, flexWrap: 'wrap' },
  activeFilterTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E8E8' },
  activeFilterText: { fontSize: 13, fontWeight: '500', color: '#525252' },
  garimpeiroFilterTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#FDF6EE', borderWidth: 1, borderColor: '#D4A574' },
  garimpeiroFilterText: { fontSize: 13, fontWeight: '600', color: '#D4A574' },

  // Results
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  resultsCount: { fontSize: 14, color: '#737373' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontSize: 14, fontWeight: '500', color: colors.primary },

  // Products
  productsGrid: { paddingHorizontal: 16, paddingBottom: 100 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 4 },
  productImgWrap: { position: 'relative', overflow: 'hidden', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  productImg: { width: '100%', height: '100%' },
  heartBtn: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  discountTag: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FF6B6B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  conditionTag: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  conditionText: { fontSize: 10, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  productInfo: { padding: 10 },
  productBrand: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  productName: { fontSize: 13, fontWeight: '500', color: '#1A1A1A', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  price: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  oldPrice: { fontSize: 12, color: '#A3A3A3', textDecorationLine: 'line-through' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: 11, color: '#A3A3A3' },

  // Empty
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#737373', marginTop: 8, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  filterLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginTop: 16, marginBottom: 12 },
  filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F5F5F5' },
  filterOptionActive: { backgroundColor: colors.primary },
  filterOptionText: { fontSize: 14, fontWeight: '500', color: '#525252' },
  filterOptionTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  clearBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E8E8E8', alignItems: 'center' },
  clearBtnText: { fontSize: 15, fontWeight: '600', color: '#737373' },
  applyBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  applyBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // Garimpeiro Mode
  garimpeiroSection: { backgroundColor: '#FDF6EE', borderRadius: 16, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#D4A574' },
  garimpeiroHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  garimpeiroTitle: { fontSize: 14, fontWeight: '700', color: '#D4A574', letterSpacing: 0.5 },
  garimpeiroContent: {},
  garimpeiroToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  garimpeiroToggleText: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  garimpeiroHint: { fontSize: 13, color: '#8B7355', marginTop: 8, fontStyle: 'italic' },
});

export default SearchScreen;
