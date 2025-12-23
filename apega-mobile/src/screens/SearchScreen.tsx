import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { BottomNavigation, Header, MainHeader } from '../components';
import ProductCard from '../components/ProductCard';
import { getProducts, Product } from '../services/products';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
const CONDITIONS = [
  { id: 'novo', label: 'Novo' },
  { id: 'seminovo', label: 'Seminovo' },
  { id: 'usado', label: 'Usado' },
];
const SORTS = [
  { id: 'recent', label: 'Recentes' },
  { id: 'price_asc', label: 'Menor preco' },
  { id: 'price_desc', label: 'Maior preco' },
  { id: 'popular', label: 'Mais vistos' },
];

export default function SearchScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 1024;
  const isTablet = isWeb && width > 768 && width <= 1024;
  const numColumns = isDesktop ? 4 : isTablet ? 3 : 2;
  const contentPadding = isWeb ? 32 : 16;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<'recent' | 'price_asc' | 'price_desc' | 'popular'>('recent');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getProducts({
        search: searchQuery || undefined,
        condition: selectedCondition || undefined,
        size: selectedSize || undefined,
        sort: selectedSort,
        limit: 60,
      });
      setProducts(response.products || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCondition, selectedSize, selectedSort]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timeout);
  }, [fetchProducts]);

  const data = useMemo(() => products || [], [products]);

  const renderItem = ({ item }: { item: Product }) => {
    const imageUrl = item.image_url || (item.images && item.images[0]?.image_url) || '';
    const priceValue = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return (
      <ProductCard
        id={item.id}
        image={imageUrl}
        title={item.brand ? `${item.brand} - ${item.title}` : item.title}
        price={priceValue}
        originalPrice={item.original_price}
        size={item.size}
        condition={item.condition}
        numColumns={numColumns}
        onPress={() => navigation.navigate('ItemDetail', { item })}
      />
    );
  };

  const ListHeader = () => (
    <View style={{ paddingHorizontal: contentPadding }}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar pecas, marcas e tamanhos"
          placeholderTextColor={COLORS.textTertiary}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Tamanho</Text>
        <View style={styles.filterRow}>
          {SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.filterChip,
                selectedSize === size && styles.filterChipActive,
              ]}
              onPress={() => setSelectedSize(selectedSize === size ? null : size)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSize === size && styles.filterChipTextActive,
                ]}
              >
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.filterTitle}>Condicao</Text>
        <View style={styles.filterRow}>
          {CONDITIONS.map((cond) => (
            <TouchableOpacity
              key={cond.id}
              style={[
                styles.filterChip,
                selectedCondition === cond.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCondition(selectedCondition === cond.id ? null : cond.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCondition === cond.id && styles.filterChipTextActive,
                ]}
              >
                {cond.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.filterTitle}>Ordenar</Text>
        <View style={styles.filterRow}>
          {SORTS.map((sort) => (
            <TouchableOpacity
              key={sort.id}
              style={[
                styles.filterChip,
                selectedSort === sort.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedSort(sort.id as typeof selectedSort)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSort === sort.id && styles.filterChipTextActive,
                ]}
              >
                {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Resultados</Text>
        <Text style={styles.sectionMeta}>{products.length} pecas</Text>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="search-outline" size={44} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>Nenhum resultado</Text>
      <Text style={styles.emptySubtitle}>Ajuste os filtros ou tente outra busca.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isWeb ? (
        <MainHeader navigation={navigation} title="Buscar" />
      ) : (
        <Header navigation={navigation} title="Buscar" showBack={false} />
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Buscando pecas...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? { gap: 12, paddingHorizontal: contentPadding } : undefined}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: isWeb ? 40 : 120 }}
        />
      )}

      <BottomNavigation navigation={navigation} activeRoute="Search" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  filterSection: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryExtraLight,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionMeta: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
