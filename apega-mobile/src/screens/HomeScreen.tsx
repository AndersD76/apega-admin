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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavigation } from '../components';
import { getProducts, Product } from '../services/products';
import { loadToken } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 900;

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface DisplayItem {
  id: string;
  title: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  size?: string;
}

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      const response = await getProducts({ limit: 20, sort: 'recent' });
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
        title: product.title || '',
        brand: product.brand,
        price: isNaN(price) ? 0 : price,
        originalPrice: originalPrice && !isNaN(originalPrice) ? originalPrice : undefined,
        images: product.images?.map(img => img.image_url) || (product.image_url ? [product.image_url] : []),
        size: product.size,
      };
    });
  }, [products]);

  const formatPrice = (price: number) => `R$ ${price.toFixed(0)}`;

  // Loading
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAF8" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#1a1a1a" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAF8" />

      {/* Header Minimalista */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.logo}>apega</Text>
        </TouchableOpacity>

        {isDesktop && (
          <View style={styles.navDesktop}>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.navLink}>explorar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSellPress}>
              <Text style={styles.navLink}>vender</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
              <Text style={styles.navLink}>salvos</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.navLink}>entrar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1a1a1a"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Editorial */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Moda circular{'\n'}para quem{'\n'}tem estilo</Text>
          <Text style={styles.heroSubtitle}>
            Peças únicas com história.{'\n'}De Passo Fundo para o seu closet.
          </Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.heroButtonText}>Ver coleção</Text>
          </TouchableOpacity>
        </View>

        {/* Grid Principal - Editorial Style */}
        {allItems.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Novidades</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Text style={styles.sectionLink}>Ver tudo</Text>
              </TouchableOpacity>
            </View>

            {/* Featured - Item Grande */}
            {allItems[0] && (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => navigation.navigate('ItemDetail', { item: allItems[0] })}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: allItems[0].images[0] }}
                  style={styles.featuredImage}
                />
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredBrand}>{allItems[0].brand || 'Marca'}</Text>
                  <Text style={styles.featuredTitle} numberOfLines={1}>{allItems[0].title}</Text>
                  <Text style={styles.featuredPrice}>{formatPrice(allItems[0].price)}</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Grid 2 colunas */}
            <View style={styles.grid}>
              {allItems.slice(1, 7).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridItem}
                  onPress={() => navigation.navigate('ItemDetail', { item })}
                  activeOpacity={0.9}
                >
                  <View style={styles.gridImageContainer}>
                    {item.images[0] ? (
                      <Image source={{ uri: item.images[0] }} style={styles.gridImage} />
                    ) : (
                      <View style={[styles.gridImage, styles.placeholder]} />
                    )}
                  </View>
                  <View style={styles.gridInfo}>
                    <Text style={styles.gridBrand}>{item.brand || ''}</Text>
                    <Text style={styles.gridPrice}>{formatPrice(item.price)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* CTA Vender */}
            <View style={styles.ctaSection}>
              <Text style={styles.ctaTitle}>Desapegue do que{'\n'}não usa mais</Text>
              <Text style={styles.ctaSubtitle}>
                Venda suas peças e dê uma nova vida para elas
              </Text>
              <TouchableOpacity style={styles.ctaButton} onPress={handleSellPress}>
                <Text style={styles.ctaButtonText}>Começar a vender</Text>
              </TouchableOpacity>
            </View>

            {/* Mais itens */}
            {allItems.length > 7 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Mais peças</Text>
                </View>
                <View style={styles.grid}>
                  {allItems.slice(7, 15).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.gridItem}
                      onPress={() => navigation.navigate('ItemDetail', { item })}
                      activeOpacity={0.9}
                    >
                      <View style={styles.gridImageContainer}>
                        {item.images[0] ? (
                          <Image source={{ uri: item.images[0] }} style={styles.gridImage} />
                        ) : (
                          <View style={[styles.gridImage, styles.placeholder]} />
                        )}
                      </View>
                      <View style={styles.gridInfo}>
                        <Text style={styles.gridBrand}>{item.brand || ''}</Text>
                        <Text style={styles.gridPrice}>{formatPrice(item.price)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* Empty State */}
        {allItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhuma peça ainda</Text>
            <Text style={styles.emptySubtitle}>Seja a primeira a anunciar</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleSellPress}>
              <Text style={styles.emptyButtonText}>Anunciar peça</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>apega desapega</Text>
          <Text style={styles.footerText}>
            Nascemos em Passo Fundo, RS.{'\n'}
            Fundado por Amanda Maier.
          </Text>
          <Text style={styles.footerMotto}>Moda com propósito.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isDesktop ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#FAFAF8',
  },
  logo: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28,
    fontWeight: '400',
    color: '#1a1a1a',
    letterSpacing: -1,
  },
  navDesktop: {
    flexDirection: 'row',
    gap: 40,
  },
  navLink: {
    fontSize: 14,
    color: '#666',
    letterSpacing: 0.5,
  },

  // Scroll
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero
  hero: {
    paddingHorizontal: isDesktop ? 60 : 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  heroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: isDesktop ? 64 : 42,
    fontWeight: '400',
    color: '#1a1a1a',
    lineHeight: isDesktop ? 72 : 48,
    letterSpacing: -2,
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  heroButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  heroButtonText: {
    fontSize: 14,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isDesktop ? 60 : 20,
    marginBottom: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 24,
    fontWeight: '400',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  sectionLink: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },

  // Featured
  featuredCard: {
    marginHorizontal: isDesktop ? 60 : 20,
    marginBottom: 24,
  },
  featuredImage: {
    width: '100%',
    height: isDesktop ? 500 : 400,
    backgroundColor: '#f0f0f0',
  },
  featuredInfo: {
    paddingTop: 16,
  },
  featuredBrand: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  featuredTitle: {
    fontSize: 18,
    color: '#1a1a1a',
    marginBottom: 6,
  },
  featuredPrice: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    color: '#1a1a1a',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: isDesktop ? 52 : 12,
  },
  gridItem: {
    width: isDesktop ? '25%' : '50%',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  gridImageContainer: {
    aspectRatio: 0.75,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#e8e8e8',
  },
  gridInfo: {
    gap: 4,
  },
  gridBrand: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridPrice: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 16,
    color: '#1a1a1a',
  },

  // CTA
  ctaSection: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: isDesktop ? 60 : 20,
    marginVertical: 40,
    padding: isDesktop ? 60 : 32,
  },
  ctaTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: isDesktop ? 36 : 28,
    fontWeight: '400',
    color: '#fff',
    lineHeight: isDesktop ? 44 : 36,
    letterSpacing: -1,
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 28,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  ctaButtonText: {
    fontSize: 14,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 24,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 32,
  },
  emptyButton: {
    borderWidth: 1,
    borderColor: '#1a1a1a',
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyButtonText: {
    fontSize: 14,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    marginTop: 40,
    marginHorizontal: isDesktop ? 60 : 20,
  },
  footerLogo: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    color: '#1a1a1a',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  footerMotto: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
