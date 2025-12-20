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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { BottomNavigation } from '../components';
import { getProducts, Product } from '../services/products';
import { loadToken } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 768;
const CARD_WIDTH = isDesktop ? (width - 120) / 4 : (width - 36) / 2;

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

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

  const getDiscount = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100);
  };

  const renderProductCard = (item: DisplayItem, index: number) => {
    const imageHeight = index % 3 === 0 ? 260 : 200;
    const hasDiscount = item.originalPrice && item.originalPrice > item.price;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.productCard, { width: CARD_WIDTH }]}
        onPress={() => navigation.navigate('ItemDetail', { item })}
        activeOpacity={0.95}
      >
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          {item.images[0] ? (
            <Image source={{ uri: item.images[0] }} style={styles.productImage} />
          ) : (
            <LinearGradient
              colors={['#f0f0f0', '#e0e0e0']}
              style={[styles.productImage, styles.imagePlaceholder]}
            >
              <Ionicons name="image-outline" size={32} color="#bbb" />
            </LinearGradient>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{getDiscount(item.originalPrice!, item.price)}%
              </Text>
            </View>
          )}

          {/* Size Badge */}
          {item.size && (
            <View style={styles.sizeBadge}>
              <Text style={styles.sizeText}>{item.size}</Text>
            </View>
          )}
        </View>

        {/* Card Info */}
        <View style={styles.cardInfo}>
          {item.brand && (
            <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text>
          )}
          <Text style={styles.titleText} numberOfLines={1}>{item.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
            {hasDiscount && (
              <Text style={styles.originalPriceText}>{formatPrice(item.originalPrice!)}</Text>
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
          <View style={styles.loadingIcon}>
            <Ionicons name="leaf" size={32} color={COLORS.primary} />
          </View>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
          <Text style={styles.loadingText}>Carregando peças incríveis...</Text>
        </View>
        <BottomNavigation navigation={navigation} activeRoute="Home" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>Apega</Text>
            <Text style={styles.logoAccent}>Desapega</Text>
          </View>

          {/* Desktop Navigation */}
          {isDesktop && (
            <View style={styles.desktopNav}>
              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Search')}>
                <Text style={styles.navText}>Explorar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={handleSellPress}>
                <Text style={styles.navText}>Vender</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Favorites')}>
                <Text style={styles.navText}>Favoritos</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.headerActions}>
            {/* Search */}
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="search" size={20} color="#333" />
            </TouchableOpacity>

            {/* Profile/Login */}
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-circle-outline" size={28} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Sell Button Desktop */}
            {isDesktop && (
              <TouchableOpacity style={styles.sellButtonDesktop} onPress={handleSellPress}>
                <LinearGradient
                  colors={[COLORS.primary, '#4a7c59']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sellGradient}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.sellButtonText}>Anunciar</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Bar Mobile */}
        {!isDesktop && (
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={18} color="#999" />
            <Text style={styles.searchPlaceholder}>Buscar peças, marcas...</Text>
          </TouchableOpacity>
        )}
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
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTag}>NOVIDADE</Text>
              <Text style={styles.heroTitle}>Moda com história</Text>
              <Text style={styles.heroSubtitle}>
                Cada peça conta uma história.{'\n'}Qual vai ser a sua?
              </Text>
              <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate('Search')}>
                <Text style={styles.heroButtonText}>Descobrir</Text>
                <Ionicons name="arrow-forward" size={16} color="#764ba2" />
              </TouchableOpacity>
            </View>
            <View style={styles.heroDecor}>
              <Ionicons name="leaf" size={120} color="rgba(255,255,255,0.1)" />
            </View>
          </LinearGradient>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categorias</Text>
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
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'Acabou de chegar' : CATEGORIES.find(c => c.id === selectedCategory)?.name}
            </Text>
            <Text style={styles.productCount}>{filteredItems.length} peças</Text>
          </View>

          {filteredItems.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredItems.map((item, index) => renderProductCard(item, index))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="shirt-outline" size={48} color="#ddd" />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma peça ainda</Text>
              <Text style={styles.emptySubtitle}>Seja a primeira a anunciar!</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleSellPress}>
                <LinearGradient
                  colors={[COLORS.primary, '#4a7c59']}
                  style={styles.emptyButtonGradient}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Anunciar Agora</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <LinearGradient
            colors={['#f8f9fa', '#fff']}
            style={styles.aboutGradient}
          >
            <View style={styles.aboutHeader}>
              <Text style={styles.aboutTitle}>Sobre a Apega Desapega</Text>
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={14} color={COLORS.primary} />
                <Text style={styles.locationText}>Passo Fundo, RS</Text>
              </View>
            </View>

            <Text style={styles.aboutText}>
              Nascemos de uma lojinha física em Passo Fundo, Rio Grande do Sul.
              O que começou pequeno, com a paixão da Amanda Maier por moda sustentável,
              hoje é um dos brechós mais queridos do RS.
            </Text>

            <View style={styles.founderRow}>
              <View style={styles.founderImage}>
                <Ionicons name="person" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.founderInfo}>
                <Text style={styles.founderName}>Amanda Maier</Text>
                <Text style={styles.founderRole}>Fundadora</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="leaf" size={24} color="#4ECDC4" />
                <Text style={styles.statLabel}>Moda Circular</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={24} color="#FF6B6B" />
                <Text style={styles.statLabel}>Feito com Amor</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="globe" size={24} color="#45B7D1" />
                <Text style={styles.statLabel}>Sustentável</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

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
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f7f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },

  // Header
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
    paddingHorizontal: isDesktop ? 40 : 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: isDesktop ? 0 : 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  logoAccent: {
    fontSize: 24,
    fontWeight: '300',
    color: '#333',
    marginLeft: 4,
  },
  desktopNav: {
    flexDirection: 'row',
    gap: 32,
  },
  navItem: {
    paddingVertical: 8,
  },
  navText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    display: isDesktop ? 'flex' : 'none',
  },
  profileButton: {
    padding: 4,
  },
  sellButtonDesktop: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  sellGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 6,
  },
  sellButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchPlaceholder: {
    color: '#999',
    fontSize: 15,
  },

  // Scroll Content
  scrollContent: {
    paddingTop: 16,
  },

  // Hero Banner
  heroBanner: {
    marginHorizontal: isDesktop ? 40 : 16,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(102, 126, 234, 0.25)' },
      default: {
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  heroGradient: {
    padding: 24,
    minHeight: 180,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    maxWidth: 280,
  },
  heroTag: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 16,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#764ba2',
  },
  heroDecor: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.5,
  },

  // Categories
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginHorizontal: isDesktop ? 40 : 16,
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingHorizontal: isDesktop ? 40 : 16,
    gap: 12,
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

  // Products Section
  productsSection: {
    paddingHorizontal: isDesktop ? 40 : 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  productCount: {
    fontSize: 13,
    color: '#999',
  },
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
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // About Section
  aboutSection: {
    marginHorizontal: isDesktop ? 40 : 16,
    marginTop: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
  aboutGradient: {
    padding: 24,
  },
  aboutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
  },
  aboutText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 20,
  },
  founderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  founderImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f7f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  founderInfo: {
    flex: 1,
  },
  founderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  founderRole: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
