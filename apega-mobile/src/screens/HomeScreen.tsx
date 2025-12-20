import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { BottomNavigation } from '../components';
import { getProducts, Product } from '../services/products';
import { loadToken } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CARD_WIDTH = isWeb && width > 768 ? (width - 80) / 4 : (width - 48) / 2;

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const CATEGORIES = [
  { id: 'all', name: 'tudo' },
  { id: 'vestidos', name: 'vestidos' },
  { id: 'blusas', name: 'blusas' },
  { id: 'calcas', name: 'calças' },
  { id: 'saias', name: 'saias' },
  { id: 'calcados', name: 'calçados' },
  { id: 'bolsas', name: 'bolsas' },
  { id: 'acessorios', name: 'acessórios' },
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
}

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
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
      };
    });
  }, [products]);

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(0)}`;
  };

  const getFilteredItems = () => {
    let items = allItems;
    if (selectedCategory !== 'all') {
      items = items.filter(i => i.category?.toLowerCase() === selectedCategory);
    }
    return items;
  };

  const filteredItems = getFilteredItems();

  const renderProductCard = (item: DisplayItem, index: number) => {
    // Masonry effect - vary heights
    const isLarge = index % 5 === 0;
    const imageHeight = isLarge ? 280 : 200;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.productCard, { width: CARD_WIDTH }]}
        onPress={() => navigation.navigate('ItemDetail', { item })}
        activeOpacity={0.9}
      >
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          {item.images[0] ? (
            <Image source={{ uri: item.images[0] }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={32} color="#ddd" />
            </View>
          )}

          {/* Price Tag - Enjoei style */}
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
            {item.originalPrice && item.originalPrice > item.price && (
              <Text style={styles.originalPrice}>{formatPrice(item.originalPrice)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>carregando...</Text>
        </View>
        <BottomNavigation navigation={navigation} activeRoute="Home" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header - Web Premium */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.logo}>apegadesapega</Text>

          {/* Search Bar */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={18} color="#999" />
            <Text style={styles.searchPlaceholder}>busque "nike"</Text>
          </TouchableOpacity>

          {/* Categories - Desktop style */}
          <View style={styles.navLinks}>
            {CATEGORIES.slice(0, 5).map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={styles.navLink}
              >
                <Text style={[
                  styles.navLinkText,
                  selectedCategory === cat.id && styles.navLinkActive
                ]}>
                  {cat.name}
                </Text>
                {selectedCategory === cat.id && <View style={styles.navUnderline} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.headerLink}>entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sellButton} onPress={handleSellPress}>
              <Text style={styles.sellButtonText}>quero vender</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>favoritas até 70% off</Text>
          <Text style={styles.heroSubtitle}>seu closet agradece essas novidades</Text>
        </View>

        {/* Products Grid - Masonry */}
        <View style={styles.productsGrid}>
          {filteredItems.map((item, index) => renderProductCard(item, index))}
        </View>

        {filteredItems.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>nenhuma peça ainda</Text>
            <Text style={styles.emptySubtitle}>seja a primeira a desapegar!</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleSellPress}>
              <Text style={styles.emptyButtonText}>anuncie e venda</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Section Divider */}
        {filteredItems.length > 0 && (
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>mais que queridos, queridíssimos</Text>
            <Text style={styles.sectionSubtitle}>falamos desses yeyezados, claro</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllLink}>não vai perder</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Second Grid */}
        {filteredItems.length > 6 && (
          <View style={styles.productsGrid}>
            {filteredItems.slice(6, 12).map((item, index) => renderProductCard(item, index + 6))}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },

  // Header
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: isWeb && width > 768 ? 'row' : 'column',
    alignItems: isWeb && width > 768 ? 'center' : 'stretch',
    paddingHorizontal: 20,
    gap: 16,
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: isWeb && width > 768 ? 1 : undefined,
    maxWidth: isWeb && width > 768 ? 300 : undefined,
    gap: 8,
  },
  searchPlaceholder: {
    color: '#999',
    fontSize: 14,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    display: isWeb && width > 768 ? 'flex' : 'none',
  },
  navLink: {
    paddingVertical: 8,
    position: 'relative',
  },
  navLinkText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  navLinkActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  navUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    display: isWeb && width > 768 ? 'flex' : 'none',
  },
  headerLink: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  sellButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  sellButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Scroll Content
  scrollContent: {
    paddingTop: 20,
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#666',
  },

  // Products Grid
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },

  // Product Card
  productCard: {
    marginHorizontal: 8,
    marginBottom: 16,
  },
  imageContainer: {
    borderRadius: 8,
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
  priceTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },

  // Section Divider
  sectionDivider: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  seeAllLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
