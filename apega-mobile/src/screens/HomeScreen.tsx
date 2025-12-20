import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavigation } from '../components';
import { COLORS } from '../constants/theme';
import { getProducts, Product } from '../services/products';
import { loadToken } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 900;

// Imagens do carrossel
const CAROUSEL_IMAGES = [
  { uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80', label: 'Vestidos' },
  { uri: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80', label: 'Moda' },
  { uri: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80', label: 'Bolsas' },
  { uri: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&q=80', label: 'Calçados' },
  { uri: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80', label: 'Blusas' },
];

// Logos das marcas (servirão como filtros)
const BRAND_LOGOS = [
  { name: 'Zara', logo: 'https://logo.clearbit.com/zara.com' },
  { name: 'Farm', logo: 'https://logo.clearbit.com/farmrio.com.br' },
  { name: 'Animale', logo: 'https://logo.clearbit.com/animale.com.br' },
  { name: 'Renner', logo: 'https://logo.clearbit.com/lojasrenner.com.br' },
  { name: 'C&A', logo: 'https://logo.clearbit.com/cea.com.br' },
  { name: 'Forever21', logo: 'https://logo.clearbit.com/forever21.com' },
  { name: 'Hering', logo: 'https://logo.clearbit.com/hering.com.br' },
  { name: 'Marisa', logo: 'https://logo.clearbit.com/marisa.com.br' },
  { name: 'Shoulder', logo: 'https://logo.clearbit.com/shoulder.com.br' },
  { name: 'Le Lis', logo: 'https://logo.clearbit.com/lelis.com.br' },
  { name: 'Arezzo', logo: 'https://logo.clearbit.com/arezzo.com.br' },
  { name: 'Schutz', logo: 'https://logo.clearbit.com/schutz.com.br' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface DisplayItem {
  id: string;
  title: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  size?: string;
  condition?: string;
}

// Função para estilo da tag de condição
const getConditionStyle = (condition: string | undefined) => {
  const cond = condition?.toLowerCase() || '';
  if (cond.includes('novo') && !cond.includes('semi')) return { bg: '#10B981', label: 'Novo' };
  if (cond.includes('seminovo') || cond.includes('semi')) return { bg: COLORS.primary, label: 'Seminovo' };
  return { bg: '#F59E0B', label: 'Usado' };
};

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [fadeAnim]);

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
        condition: product.condition,
      };
    });
  }, [products]);

  const formatPrice = (price: number) => `R$ ${price.toFixed(0)}`;

  // Loading
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF9F7" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F7" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.logo}>apega<Text style={styles.logoLight}>desapega</Text></Text>
        </TouchableOpacity>

        {isDesktop && (
          <View style={styles.navDesktop}>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.navLink}>Explorar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSellPress}>
              <Text style={styles.navLink}>Venda conosco</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
              <Text style={styles.navLink}>Favoritos</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleSellPress}>
            <Ionicons name="pricetag-outline" size={18} color={COLORS.primary} />
            <Text style={styles.headerBtnText}>Venda conosco</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtnFilled} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.headerBtnFilledText}>Entrar</Text>
          </TouchableOpacity>
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
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Renove e{'\n'}desapegue no{'\n'}
              <Text style={styles.heroTitleHighlight}>Apega{'\n'}Desapega</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              O Apega Desapega nasceu do sonho de pessoas que acreditam na possibilidade de{' '}
              <Text style={styles.heroSubtitleBold}>construir um mundo melhor</Text> através da economia e moda circular!
            </Text>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Text style={styles.heroButtonText}>Explorar peças</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.heroImageArea}>
            <View style={styles.heroImageBg} />
            {/* Imagem principal com carrossel */}
            <Animated.View style={[styles.heroImageWrapper, { opacity: fadeAnim }]}>
              <Image
                source={{ uri: CAROUSEL_IMAGES[currentImageIndex].uri }}
                style={styles.heroImage}
              />
              <View style={styles.carouselLabel}>
                <Text style={styles.carouselLabelText}>{CAROUSEL_IMAGES[currentImageIndex].label}</Text>
              </View>
            </Animated.View>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80' }}
              style={styles.heroImageSecondary}
            />
            {/* Dots do carrossel */}
            <View style={styles.carouselDots}>
              {CAROUSEL_IMAGES.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, currentImageIndex === index && styles.dotActive]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Seção de Marcas */}
        <View style={styles.brandsSection}>
          <Text style={styles.brandsSectionTitle}>Marcas que você encontra aqui</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandsScroll}
          >
            {BRAND_LOGOS.map((brand, index) => (
              <TouchableOpacity
                key={index}
                style={styles.brandCircle}
                onPress={() => navigation.navigate('Search')}
              >
                <Image
                  source={{ uri: brand.logo }}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
                <Text style={styles.brandName}>{brand.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Como Funciona */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>Como funciona</Text>
          <Text style={styles.sectionSubtitle}>
            Venda seus desapegos em <Text style={styles.textHighlight}>3 passos simples:</Text>
          </Text>

          <View style={styles.stepsContainer}>
            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>1</Text>
              <View style={styles.stepIconContainer}>
                <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.stepTitle}>Fotografe suas peças</Text>
              <Text style={styles.stepText}>
                Tire fotos bonitas das suas peças. Simples assim!
              </Text>
            </View>

            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>2</Text>
              <View style={styles.stepIconContainer}>
                <Ionicons name="shirt-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.stepTitle}>Nós avaliamos</Text>
              <Text style={styles.stepText}>
                Selecionamos as peças de acordo com a demanda e conservação.
              </Text>
            </View>

            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>3</Text>
              <View style={styles.stepIconContainer}>
                <Ionicons name="wallet-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.stepTitle}>Desapegou, vendeu!</Text>
              <Text style={styles.stepText}>
                Seu pagamento é feito assim que a peça for vendida.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSellPress}>
            <Text style={styles.secondaryButtonText}>Quero vender minhas peças</Text>
          </TouchableOpacity>
        </View>

        {/* Categorias */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Pensou em renovar? A gente tem de tudo.</Text>
          <Text style={styles.sectionSubtitle}>
            De roupas a acessórios, desapegue e <Text style={styles.textHighlight}>renove aqui</Text>.
          </Text>

          <View style={styles.categoriesGrid}>
            {[
              { name: 'Feminino', desc: 'O sonho de toda mulher, armário sempre renovado.', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80' },
              { name: 'Bolsas', desc: 'Bolsas para todos os estilos e ocasiões.', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80' },
              { name: 'Calçados', desc: 'Do casual ao elegante, encontre seu par.', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80' },
              { name: 'Acessórios', desc: 'Acessórios para completar seu look.', image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&q=80' },
            ].map((cat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryCard}
                onPress={() => navigation.navigate('Search')}
              >
                <Text style={styles.categoryTitle}>{cat.name}</Text>
                <Text style={styles.categoryDesc}>{cat.desc}</Text>
                <View style={styles.categoryImageWrapper}>
                  <View style={styles.categoryGeometry} />
                  <Image source={{ uri: cat.image }} style={styles.categoryImage} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Produtos */}
        {allItems.length > 0 && (
          <View style={styles.productsSection}>
            <View style={styles.productsSectionHeader}>
              <Text style={styles.sectionTitle}>Novidades</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Text style={styles.seeAllLink}>Ver tudo →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.productsGrid}>
              {allItems.slice(0, 8).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.productCard}
                  onPress={() => navigation.navigate('ItemDetail', { item })}
                >
                  <View style={styles.productImageContainer}>
                    {item.images[0] ? (
                      <Image source={{ uri: item.images[0] }} style={styles.productImage} />
                    ) : (
                      <View style={[styles.productImage, styles.productImagePlaceholder]}>
                        <Ionicons name="image-outline" size={32} color="#ccc" />
                      </View>
                    )}
                    {/* Tag de condição */}
                    <View style={[styles.conditionBadge, { backgroundColor: getConditionStyle(item.condition).bg }]}>
                      <Text style={styles.conditionText}>{getConditionStyle(item.condition).label}</Text>
                    </View>
                    {item.size && (
                      <View style={styles.productSizeBadge}>
                        <Text style={styles.productSizeText}>{item.size}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    {item.brand && (
                      <Text style={styles.productBrand}>{item.brand}</Text>
                    )}
                    <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                    <TouchableOpacity style={styles.buyButton}>
                      <Text style={styles.buyButtonText}>COMPRAR</Text>
                      <Ionicons name="bag-outline" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Estatísticas */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Nosso impacto</Text>
          <Text style={styles.sectionSubtitle}>
            Uma parceria que favorece o mundo, baseada em princípios
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="shirt-outline" size={32} color={COLORS.primary} />
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>peças reutilizadas</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={32} color={COLORS.primary} />
              <Text style={styles.statNumber}>100+</Text>
              <Text style={styles.statLabel}>vendedores ativos</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="leaf-outline" size={32} color={COLORS.primary} />
              <Text style={styles.statNumber}>1000kg</Text>
              <Text style={styles.statLabel}>CO₂ evitado</Text>
            </View>
          </View>
        </View>

        {/* Empty State */}
        {allItems.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={64} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>Nenhuma peça ainda</Text>
            <Text style={styles.emptySubtitle}>Seja a primeira a anunciar!</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSellPress}>
              <Text style={styles.primaryButtonText}>Anunciar peça</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>apega<Text style={styles.footerLogoLight}>desapega</Text></Text>
          <Text style={styles.footerText}>
            Nascemos em Passo Fundo, RS.{'\n'}
            Fundado por Amanda Maier.
          </Text>
          <View style={styles.footerSocial}>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-instagram" size={24} color={COLORS.gray[600]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Ionicons name="logo-whatsapp" size={24} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.footerMotto}>Moda circular é nosso modo de mudar o mundo 🌱</Text>
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
    backgroundColor: '#FAF9F7',
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
    color: COLORS.gray[500],
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
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: '#fff',
  },
  headerBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  headerBtnFilled: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
  },
  headerBtnFilledText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Scroll
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero
  hero: {
    flexDirection: isDesktop ? 'row' : 'column',
    paddingHorizontal: isDesktop ? 60 : 20,
    paddingVertical: isDesktop ? 60 : 32,
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
    maxWidth: isDesktop ? 500 : '100%',
  },
  heroTitle: {
    fontSize: isDesktop ? 54 : 42,
    fontWeight: '300',
    color: COLORS.gray[800],
    lineHeight: isDesktop ? 64 : 50,
    marginBottom: 24,
  },
  heroTitleHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: 18,
    color: COLORS.gray[600],
    lineHeight: 28,
    marginBottom: 32,
  },
  heroSubtitleBold: {
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  heroButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  heroImageArea: {
    position: 'relative',
    width: isDesktop ? 400 : '100%',
    height: isDesktop ? 400 : 300,
    marginTop: isDesktop ? 0 : 32,
  },
  heroImageBg: {
    position: 'absolute',
    right: 0,
    top: 20,
    width: '80%',
    height: '90%',
    backgroundColor: COLORS.primary,
    borderRadius: 24,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  heroImageSecondary: {
    position: 'absolute',
    right: 10,
    bottom: 0,
    width: '50%',
    height: '60%',
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#FAF9F7',
  },
  heroImageWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '65%',
    height: '80%',
  },
  carouselLabel: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  carouselLabelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  carouselDots: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray[300],
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },

  // Brands Section
  brandsSection: {
    paddingHorizontal: isDesktop ? 60 : 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  brandsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  brandsScroll: {
    paddingHorizontal: 10,
    gap: 16,
    justifyContent: 'center',
  },
  brandCircle: {
    alignItems: 'center',
    width: 70,
  },
  brandLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  brandName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginTop: 6,
    textAlign: 'center',
  },

  // Section Title
  sectionTitle: {
    fontSize: isDesktop ? 36 : 30,
    fontWeight: '800',
    color: COLORS.gray[800],
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 18,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 26,
  },
  textHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // How It Works
  howItWorks: {
    paddingHorizontal: isDesktop ? 60 : 20,
    paddingVertical: 60,
    backgroundColor: '#fff',
  },
  stepsContainer: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 24,
    marginBottom: 32,
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#FAF9F7',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    top: 16,
    left: 20,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stepIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray[800],
    textAlign: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  secondaryButton: {
    alignSelf: 'center',
    backgroundColor: COLORS.gray[800],
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Categories
  categoriesSection: {
    paddingHorizontal: isDesktop ? 60 : 20,
    paddingVertical: 60,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  categoryCard: {
    width: isDesktop ? '23%' : '47%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  categoryDesc: {
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  categoryImageWrapper: {
    position: 'relative',
    width: 100,
    height: 130,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  categoryGeometry: {
    position: 'absolute',
    top: 0,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.4,
  },
  categoryImage: {
    width: 90,
    height: 110,
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
  },

  // Products
  productsSection: {
    paddingHorizontal: isDesktop ? 60 : 16,
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productCard: {
    width: isDesktop ? '25%' : '50%',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  productImageContainer: {
    aspectRatio: 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
    marginBottom: 0,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productSizeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  productSizeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  productInfo: {
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  productBrand: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 8,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  buyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Stats
  statsSection: {
    paddingHorizontal: isDesktop ? 60 : 20,
    paddingVertical: 60,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: isDesktop ? 80 : 32,
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: isDesktop ? 48 : 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: 4,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.gray[500],
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginTop: 40,
  },
  footerLogo: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
  },
  footerLogoLight: {
    fontWeight: '400',
    color: COLORS.gray[400],
  },
  footerText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  footerSocial: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FAF9F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerMotto: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
    textAlign: 'center',
  },
});
