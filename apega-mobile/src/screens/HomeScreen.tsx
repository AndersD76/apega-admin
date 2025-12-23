import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, BottomNavigation, MainHeader } from '../components';
import ProductCard from '../components/ProductCard';
import { COLORS, CATEGORIES } from '../constants/theme';
import { getProducts, Product } from '../services/products';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 1024;
  const isTablet = isWeb && width > 768 && width <= 1024;
  const numColumns = isDesktop ? 4 : isTablet ? 3 : 2;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const contentPadding = isWeb ? 32 : 16;

  const fetchProducts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await getProducts({
        search: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        limit: 40,
        sort: 'recent',
      });
      setProducts(response.products || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timeout);
  }, [fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(false);
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
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Ache pecas com historia</Text>
        <Text style={styles.heroSubtitle}>Moda circular com curadoria e preco justo.</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por marca, peca, tamanho..."
          placeholderTextColor={COLORS.textTertiary}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Text style={styles.sectionAction}>Ver tudo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat.id && styles.categoryTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Destaques</Text>
        <Text style={styles.sectionMeta}>{products.length} pecas</Text>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="search-outline" size={44} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>Nada por aqui ainda</Text>
      <Text style={styles.emptySubtitle}>Tente outra busca ou categoria.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isWeb ? (
        <MainHeader navigation={navigation} />
      ) : (
        <AppHeader navigation={navigation} />
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando pecas...</Text>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: isWeb ? 40 : 120 }}
        />
      )}

      <BottomNavigation navigation={navigation} activeRoute="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hero: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
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
  sectionAction: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  categoryChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryExtraLight,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: COLORS.primary,
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
