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

// Imagens do carrossel com informações detalhadas dos produtos
const CAROUSEL_IMAGES = [
  {
    uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
    label: 'Vestidos',
    title: 'Vestidos Elegantes',
    description: 'Peças únicas para todas as ocasiões',
    highlight: 'Até 70% OFF',
    pieces: '+150 peças'
  },
  {
    uri: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80',
    label: 'Moda',
    title: 'Tendências 2024',
    description: 'As melhores marcas do mercado',
    highlight: 'Novidades',
    pieces: '+300 peças'
  },
  {
    uri: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
    label: 'Bolsas',
    title: 'Bolsas de Grife',
    description: 'Louis Vuitton, Gucci, Prada e mais',
    highlight: 'Premium',
    pieces: '+80 peças'
  },
  {
    uri: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&q=80',
    label: 'Calçados',
    title: 'Sapatos & Tênis',
    description: 'Do casual ao sofisticado',
    highlight: 'Exclusivo',
    pieces: '+200 peças'
  },
  {
    uri: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80',
    label: 'Blusas',
    title: 'Blusas & Tops',
    description: 'Peças para compor seu look perfeito',
    highlight: 'Imperdível',
    pieces: '+250 peças'
  },
];

// Logos das marcas (usando logo.clearbit.com para melhor compatibilidade)
// Peças em destaque - Fotos de produtos para seção de scroll horizontal
const FEATURED_PIECES = [
  {
    category: 'Vestidos',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&q=80',
    count: '+150'
  },
  {
    category: 'Bolsas',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80',
    count: '+80'
  },
  {
    category: 'Calçados',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&q=80',
    count: '+200'
  },
  {
    category: 'Blusas',
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=300&q=80',
    count: '+250'
  },
  {
    category: 'Acessórios',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=300&q=80',
    count: '+120'
  },
  {
    category: 'Jaquetas',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80',
    count: '+90'
  },
  {
    category: 'Saias',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0uj1a4?w=300&q=80',
    count: '+70'
  },
  {
    category: 'Casacos',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80',
    count: '+60'
  },
];

const BRAND_LOGOS = [
  { name: 'Zara', logo: 'https://logo.clearbit.com/zara.com' },
  { name: 'Farm', logo: 'https://logo.clearbit.com/farmrio.com.br' },
  { name: 'Animale', logo: 'https://logo.clearbit.com/animale.com.br' },
  { name: 'Renner', logo: 'https://logo.clearbit.com/lojasrenner.com.br' },
  { name: 'C&A', logo: 'https://logo.clearbit.com/cea.com.br' },
  { name: 'Forever 21', logo: 'https://logo.clearbit.com/forever21.com' },
  { name: 'H&M', logo: 'https://logo.clearbit.com/hm.com' },
  { name: 'Gucci', logo: 'https://logo.clearbit.com/gucci.com' },
  { name: 'Louis Vuitton', logo: 'https://logo.clearbit.com/louisvuitton.com' },
  { name: 'Prada', logo: 'https://logo.clearbit.com/prada.com' },
  { name: 'Chanel', logo: 'https://logo.clearbit.com/chanel.com' },
  { name: 'Dior', logo: 'https://logo.clearbit.com/dior.com' },
  { name: 'Michael Kors', logo: 'https://logo.clearbit.com/michaelkors.com' },
  { name: 'Tommy', logo: 'https://logo.clearbit.com/tommy.com' },
  { name: 'Calvin Klein', logo: 'https://logo.clearbit.com/calvinklein.com' },
  { name: 'Lacoste', logo: 'https://logo.clearbit.com/lacoste.com' },
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
  const infoSlideAnim = useRef(new Animated.Value(0)).current;
  const infoOpacityAnim = useRef(new Animated.Value(1)).current;

  // Premium banner state
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  const premiumBannerAnim = useRef(new Animated.Value(0)).current;
  const premiumShineAnim = useRef(new Animated.Value(0)).current;

  // Auto-rotate carousel com transição mais suave
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out animação paralela (imagem + info)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(infoOpacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(infoSlideAnim, {
          toValue: -30,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
        infoSlideAnim.setValue(30);
        // Fade in animação paralela
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(infoOpacityAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(infoSlideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [fadeAnim, infoSlideAnim, infoOpacityAnim]);

  // Mostrar banner premium após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPremiumBanner(true);
      Animated.parallel([
        Animated.spring(premiumBannerAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(premiumShineAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(premiumShineAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }, 5000);
    return () => clearTimeout(timer);
  }, [premiumBannerAnim, premiumShineAnim]);

  const dismissPremiumBanner = () => {
    Animated.timing(premiumBannerAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowPremiumBanner(false));
  };

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

          {/* Área do carrossel */}
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

            {/* Painel de informações animado */}
            <Animated.View
              style={[
                styles.carouselInfoPanel,
                {
                  opacity: infoOpacityAnim,
                  transform: [{ translateY: infoSlideAnim }],
                },
              ]}
            >
              <View style={styles.carouselInfoHighlight}>
                <Ionicons name="flash" size={12} color="#fff" />
                <Text style={styles.carouselInfoHighlightText}>
                  {CAROUSEL_IMAGES[currentImageIndex].highlight}
                </Text>
              </View>
              <Text style={styles.carouselInfoTitle}>
                {CAROUSEL_IMAGES[currentImageIndex].title}
              </Text>
              <Text style={styles.carouselInfoDescription}>
                {CAROUSEL_IMAGES[currentImageIndex].description}
              </Text>
              <View style={styles.carouselInfoStats}>
                <Ionicons name="layers-outline" size={16} color={COLORS.primary} />
                <Text style={styles.carouselInfoPieces}>
                  {CAROUSEL_IMAGES[currentImageIndex].pieces}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.carouselInfoButton}
                onPress={() => navigation.navigate('Search')}
              >
                <Text style={styles.carouselInfoButtonText}>Ver coleção</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </Animated.View>

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

        {/* Peças em Destaque - Scroll Horizontal */}
        <View style={styles.featuredPiecesSection}>
          <Text style={styles.featuredPiecesTitle}>PEÇAS EM DESTAQUE</Text>
          <Text style={styles.featuredPiecesSubtitle}>
            Explore nossas categorias mais procuradas
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredPiecesScroll}
          >
            {FEATURED_PIECES.map((piece, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featuredPieceCard}
                onPress={() => navigation.navigate('Search')}
              >
                <View style={styles.featuredPieceImageWrapper}>
                  <Image
                    source={{ uri: piece.image }}
                    style={styles.featuredPieceImage}
                  />
                  <View style={styles.featuredPieceOverlay}>
                    <View style={styles.featuredPieceCountBadge}>
                      <Text style={styles.featuredPieceCount}>{piece.count}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.featuredPieceCategory}>{piece.category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.featuredPiecesCTA}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.featuredPiecesCTAText}>Ver todas as peças</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
          </TouchableOpacity>
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
                <Ionicons name="sparkles" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.stepTitle}>Avaliação Inteligente</Text>
              <Text style={styles.stepText}>
                Nossa IA avalia suas peças automaticamente.
              </Text>
              <View style={styles.premiumBadgeSmall}>
                <Ionicons name="diamond" size={12} color="#FFD700" />
                <Text style={styles.premiumBadgeSmallText}>Premium</Text>
              </View>
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

        {/* SEÇÃO DE MARCAS - Grande e Impactante */}
        <View style={styles.brandsSection}>
          <View style={styles.brandsTitleRow}>
            <Ionicons name="diamond" size={28} color={COLORS.primary} />
            <Text style={styles.brandsSectionTitle}>MARCAS EXCLUSIVAS</Text>
          </View>
          <Text style={styles.brandsSectionSubtitle}>
            Encontre peças das melhores marcas do mundo
          </Text>

          {/* Scroll horizontal de marcas */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandsScrollContainer}
          >
            {BRAND_LOGOS.map((brand, index) => (
              <TouchableOpacity
                key={index}
                style={styles.brandCard}
                onPress={() => navigation.navigate('Search')}
              >
                <Animated.View style={styles.brandLogoContainer}>
                  <Image
                    source={{ uri: brand.logo }}
                    style={styles.brandLogo}
                    resizeMode="contain"
                  />
                </Animated.View>
                <Text style={styles.brandName}>{brand.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.viewAllBrandsBtn}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.viewAllBrandsText}>Ver todas as marcas</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
          </TouchableOpacity>
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

        {/* Premium Banner */}
        {showPremiumBanner && (
          <Animated.View
            style={[
              styles.premiumBanner,
              {
                opacity: premiumBannerAnim,
                transform: [
                  {
                    translateY: premiumBannerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                  {
                    scale: premiumBannerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Dismiss button */}
            <TouchableOpacity style={styles.premiumDismiss} onPress={dismissPremiumBanner}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>

            {/* Crown icon animado */}
            <Animated.View
              style={[
                styles.premiumCrown,
                {
                  transform: [
                    {
                      scale: premiumShineAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.15, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons name="diamond" size={28} color="#FFD700" />
            </Animated.View>

            {/* Conteúdo principal */}
            <View style={styles.premiumContent}>
              <Text style={styles.premiumTitle}>Seja PREMIUM</Text>
              <Text style={styles.premiumSubtitle}>
                Acesso exclusivo às melhores peças antes de todo mundo
              </Text>

              {/* Fotos de produtos premium */}
              <View style={styles.premiumProductsRow}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&q=80' }}
                  style={styles.premiumProductImg}
                />
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=80' }}
                  style={styles.premiumProductImg}
                />
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=200&q=80' }}
                  style={styles.premiumProductImg}
                />
              </View>

              {/* Benefícios */}
              <View style={styles.premiumBenefits}>
                <View style={styles.premiumBenefit}>
                  <Ionicons name="flash" size={14} color="#FFD700" />
                  <Text style={styles.premiumBenefitText}>Acesso antecipado</Text>
                </View>
                <View style={styles.premiumBenefit}>
                  <Ionicons name="pricetag" size={14} color="#FFD700" />
                  <Text style={styles.premiumBenefitText}>Descontos exclusivos</Text>
                </View>
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity style={styles.premiumCTA} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.premiumCTAText}>Quero ser Premium</Text>
              <Ionicons name="arrow-forward" size={16} color="#1a1a1a" />
            </TouchableOpacity>
          </Animated.View>
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

  // Hero Products Area - Grid de imagens à direita
  heroProductsArea: {
    flexDirection: 'row',
    gap: isDesktop ? 20 : 12,
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '100%',
    marginTop: isDesktop ? 0 : 32,
  },
  heroMainColumn: {
    flex: isDesktop ? 1 : undefined,
    width: isDesktop ? undefined : '55%',
  },
  heroMainImageWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    aspectRatio: isDesktop ? 0.75 : 0.8,
    position: 'relative',
  },
  heroMainImage: {
    width: '100%',
    height: '100%',
  },
  heroMainLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroMainLabelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  heroMainLabelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  heroMainLabelTitle: {
    fontSize: isDesktop ? 18 : 14,
    fontWeight: '700',
    color: '#fff',
  },
  heroSecondaryColumn: {
    flex: isDesktop ? 0.8 : undefined,
    width: isDesktop ? undefined : '42%',
    gap: 12,
  },
  heroInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  heroInfoTitle: {
    fontSize: isDesktop ? 16 : 14,
    fontWeight: '800',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  heroInfoDesc: {
    fontSize: isDesktop ? 12 : 11,
    color: COLORS.gray[500],
    marginBottom: 8,
    lineHeight: 16,
  },
  heroInfoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroInfoPieces: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  heroMiniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroMiniCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  heroMiniImage: {
    width: '100%',
    height: '100%',
  },
  heroMiniOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroMiniLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  heroSecCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#fff',
  },
  heroSecCTAText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Legacy hero styles (keeping for compatibility)
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

  // Featured Pieces Section - Scroll horizontal de peças
  featuredPiecesSection: {
    paddingVertical: 50,
    backgroundColor: '#fff',
  },
  featuredPiecesTitle: {
    fontSize: isDesktop ? 36 : 28,
    fontWeight: '800',
    color: COLORS.gray[800],
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  featuredPiecesSubtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 32,
  },
  featuredPiecesScroll: {
    paddingHorizontal: isDesktop ? 60 : 20,
    gap: 16,
  },
  featuredPieceCard: {
    width: isDesktop ? 180 : 140,
    alignItems: 'center',
  },
  featuredPieceImageWrapper: {
    width: isDesktop ? 160 : 130,
    height: isDesktop ? 200 : 170,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: '0 6px 20px rgba(0,0,0,0.12)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  featuredPieceImage: {
    width: '100%',
    height: '100%',
  },
  featuredPieceOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'flex-start',
  },
  featuredPieceCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  featuredPieceCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  featuredPieceCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray[700],
    textAlign: 'center',
  },
  featuredPiecesCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignSelf: 'center',
  },
  featuredPiecesCTAText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Painel de informações do carrossel
  carouselInfoPanel: {
    position: 'absolute',
    right: isDesktop ? -20 : 10,
    top: isDesktop ? 40 : 10,
    width: isDesktop ? 200 : 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: isDesktop ? 20 : 14,
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.12)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  carouselInfoHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    marginBottom: 12,
  },
  carouselInfoHighlightText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  carouselInfoTitle: {
    fontSize: isDesktop ? 18 : 15,
    fontWeight: '800',
    color: COLORS.gray[800],
    marginBottom: 6,
    lineHeight: isDesktop ? 22 : 18,
  },
  carouselInfoDescription: {
    fontSize: isDesktop ? 13 : 11,
    color: COLORS.gray[500],
    marginBottom: 12,
    lineHeight: isDesktop ? 18 : 15,
  },
  carouselInfoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  carouselInfoPieces: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  carouselInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  carouselInfoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Brands Section - Grande e Impactante
  brandsSection: {
    paddingHorizontal: isDesktop ? 60 : 20,
    paddingVertical: 60,
    backgroundColor: '#fff',
  },
  brandsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  brandsSectionTitle: {
    fontSize: isDesktop ? 42 : 28,
    fontWeight: '800',
    color: COLORS.gray[800],
    textAlign: 'center',
    letterSpacing: 2,
  },
  brandsScrollContainer: {
    paddingHorizontal: isDesktop ? 60 : 20,
    gap: 20,
    paddingVertical: 10,
  },
  brandsSectionSubtitle: {
    fontSize: 18,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 40,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: isDesktop ? 32 : 20,
    marginBottom: 32,
  },
  brandCard: {
    width: isDesktop ? 160 : 100,
    alignItems: 'center',
  },
  brandLogoContainer: {
    width: isDesktop ? 120 : 85,
    height: isDesktop ? 120 : 85,
    borderRadius: isDesktop ? 60 : 42,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(107,144,128,0.2)',
        transition: 'all 0.3s ease',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  brandLogo: {
    width: isDesktop ? 75 : 55,
    height: isDesktop ? 75 : 55,
  },
  brandInitials: {
    fontSize: isDesktop ? 24 : 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  brandName: {
    fontSize: isDesktop ? 14 : 11,
    fontWeight: '700',
    color: COLORS.gray[700],
    textAlign: 'center',
  },
  viewAllBrandsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignSelf: 'center',
  },
  viewAllBrandsText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
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
  premiumBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
  },
  premiumBadgeSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B8860B',
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

  // Premium Banner
  premiumBanner: {
    marginHorizontal: isDesktop ? 60 : 16,
    marginBottom: 32,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  premiumDismiss: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  premiumCrown: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,215,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    maxWidth: 280,
  },
  premiumProductsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  premiumProductImg: {
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  premiumBenefits: {
    flexDirection: 'row',
    gap: 16,
  },
  premiumBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  premiumBenefitText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  premiumCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  premiumCTAText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
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
