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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavigation } from '../components';
import { COLORS } from '../constants/theme';
import { getProducts, Product, getCategoryCounts } from '../services/products';
import { loadToken } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 1024;
const isTablet = isWeb && width > 600 && width <= 1024;
const isMobile = !isDesktop && !isTablet;

// Banners full-width do carrossel
const CAROUSEL_BANNERS = [
  {
    uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80',
    title: 'Moda Circular',
    subtitle: 'Renove seu guarda-roupa com peças únicas',
    highlight: 'ATÉ 70% OFF',
    cta: 'Explorar',
    gradient: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)'],
  },
  {
    uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
    title: 'Peças Premium',
    subtitle: 'Farm, Animale, Zara e muito mais',
    highlight: 'EXCLUSIVO',
    cta: 'Ver coleção',
    gradient: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)'],
  },
  {
    uri: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=80',
    title: 'Sustentabilidade',
    subtitle: 'Moda consciente que faz a diferença',
    highlight: 'ECO-FRIENDLY',
    cta: 'Saiba mais',
    gradient: ['rgba(45,90,39,0.3)', 'rgba(0,0,0,0.7)'],
  },
  {
    uri: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=80',
    title: 'Bolsas de Grife',
    subtitle: 'Louis Vuitton, Gucci, Prada',
    highlight: 'IMPERDÍVEL',
    cta: 'Conferir',
    gradient: ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)'],
  },
];

// Logos das marcas (usando logo.clearbit.com para melhor compatibilidade)
// Peças em destaque - Fotos de produtos para seção de scroll horizontal
const FEATURED_PIECES = [
  {
    category: 'Vestidos',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80',
    count: '+150'
  },
  {
    category: 'Bolsas',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
    count: '+80'
  },
  {
    category: 'Calçados',
    image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=80',
    count: '+200'
  },
  {
    category: 'Blusas',
    image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&q=80',
    count: '+250'
  },
  {
    category: 'Acessórios',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80',
    count: '+120'
  },
  {
    category: 'Jaquetas',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
    count: '+90'
  },
  {
    category: 'Saias',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaee?w=400&q=80',
    count: '+70'
  },
  {
    category: 'Casacos',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80',
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
  { name: 'Michael Kors', logo: 'https://logo.clearbit.com/michaelkors.com' },
  { name: 'Tommy Hilfiger', logo: 'https://logo.clearbit.com/tommy.com' },
  { name: 'Calvin Klein', logo: 'https://logo.clearbit.com/calvinklein.com' },
  { name: 'Lacoste', logo: 'https://logo.clearbit.com/lacoste.com' },
  { name: 'Nike', logo: 'https://logo.clearbit.com/nike.com' },
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
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const infoSlideAnim = useRef(new Animated.Value(0)).current;
  const infoOpacityAnim = useRef(new Animated.Value(1)).current;

  // Premium banner state - DESATIVADO TEMPORARIAMENTE
  const [showPremiumBanner, setShowPremiumBanner] = useState(false);
  const premiumBannerAnim = useRef(new Animated.Value(0)).current;
  const premiumShineAnim = useRef(new Animated.Value(0)).current;

  // Secret bypass - sequência de teclas para pular modal
  const [secretSequence, setSecretSequence] = useState('');

  // Category counts state
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({});

  // Promo popup state - mostra na primeira visita
  const [showPromoPopup, setShowPromoPopup] = useState(true);
  const promoScaleAnim = useRef(new Animated.Value(0)).current;
  const promoOpacityAnim = useRef(new Animated.Value(0)).current;

  // Scroll animations
  const scrollY = useRef(new Animated.Value(0)).current;

  // Parallax effect for hero
  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, 300],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.1, 1],
    extrapolate: 'clamp',
  });

  // Fade in effect for sections
  const featuredOpacity = scrollY.interpolate({
    inputRange: [100, 250],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const featuredTranslateY = scrollY.interpolate({
    inputRange: [100, 250],
    outputRange: [50, 0],
    extrapolate: 'clamp',
  });

  const howItWorksOpacity = scrollY.interpolate({
    inputRange: [400, 550],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const howItWorksTranslateY = scrollY.interpolate({
    inputRange: [400, 550],
    outputRange: [50, 0],
    extrapolate: 'clamp',
  });

  const brandsOpacity = scrollY.interpolate({
    inputRange: [700, 850],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const productsOpacity = scrollY.interpolate({
    inputRange: [900, 1050],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const productsTranslateY = scrollY.interpolate({
    inputRange: [900, 1050],
    outputRange: [30, 0],
    extrapolate: 'clamp',
  });

  // Animar popup de promoção ao abrir
  useEffect(() => {
    if (showPromoPopup) {
      Animated.parallel([
        Animated.spring(promoScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(promoOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showPromoPopup, promoScaleAnim, promoOpacityAnim]);

  const closePromoPopup = () => {
    Animated.parallel([
      Animated.timing(promoScaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(promoOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowPromoPopup(false));
  };

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
        setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_BANNERS.length);
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

  // Premium banner DESATIVADO temporariamente
  // useEffect(() => {
  //   const timer = setTimeout(() => setShowPremiumBanner(true), 5000);
  //   return () => clearTimeout(timer);
  // }, []);

  const dismissPremiumBanner = () => setShowPremiumBanner(false);

  // Secret bypass - digitar "apega" para pular o modal de lançamento
  useEffect(() => {
    if (!isWeb) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const newSequence = (secretSequence + e.key.toLowerCase()).slice(-5);
      setSecretSequence(newSequence);

      // Sequência secreta: "apega"
      if (newSequence === 'apega') {
        setShowPromoPopup(false);
        setSecretSequence('');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [secretSequence]);

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
      const [response, counts] = await Promise.all([
        getProducts({ limit: 20, sort: 'recent' }),
        getCategoryCounts()
      ]);
      setProducts(response.products || []);
      setCategoryCounts(counts);
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

      {/* Modal de Lançamento - Design Premium */}
      <Modal
        visible={showPromoPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={closePromoPopup}
      >
        <View style={styles.launchOverlay}>
          <Animated.View
            style={[
              styles.launchModal,
              {
                opacity: promoOpacityAnim,
                transform: [{ scale: promoScaleAnim }],
              },
            ]}
          >
            {/* Left Side - Image */}
            <View style={styles.launchImageSide}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80' }}
                style={styles.launchImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.launchImageGradient}
              />
              <View style={styles.launchImageContent}>
                <View style={styles.launchQuoteBox}>
                  <Text style={styles.launchQuote}>"A moda mais consciente do Brasil"</Text>
                  <View style={styles.launchStars}>
                    {[1,2,3,4,5].map(i => (
                      <Ionicons key={i} name="star" size={14} color="#FFD700" />
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Right Side - Content */}
            <View style={styles.launchContentSide}>
              {/* Logo */}
              <Text style={styles.launchLogo}>
                apega<Text style={styles.launchLogoLight}>desapega</Text>
              </Text>

              {/* Badge */}
              <View style={styles.launchBadge}>
                <Ionicons name="gift" size={14} color={COLORS.primary} />
                <Text style={styles.launchBadgeText}>LANÇAMENTO EXCLUSIVO</Text>
              </View>

              {/* Title */}
              <Text style={styles.launchTitle}>
                Seja uma das primeiras
              </Text>
              <Text style={styles.launchSubtitle}>
                Garanta benefícios que nunca mais serão oferecidos
              </Text>

              {/* Benefits Cards */}
              <View style={styles.launchBenefitsGrid}>
                <View style={styles.launchBenefitCard}>
                  <View style={styles.launchBenefitIconLarge}>
                    <Ionicons name="pricetag" size={28} color="#4CAF50" />
                  </View>
                  <Text style={styles.launchBenefitNumber}>100</Text>
                  <Text style={styles.launchBenefitLabel}>vagas</Text>
                  <Text style={styles.launchBenefitDesc}>0% comissão para sempre</Text>
                </View>

                <View style={[styles.launchBenefitCard, styles.launchBenefitCardGold]}>
                  <View style={[styles.launchBenefitIconLarge, { backgroundColor: 'rgba(255,193,7,0.15)' }]}>
                    <Ionicons name="diamond" size={28} color="#F59E0B" />
                  </View>
                  <Text style={[styles.launchBenefitNumber, { color: '#F59E0B' }]}>10</Text>
                  <Text style={styles.launchBenefitLabel}>vagas</Text>
                  <Text style={styles.launchBenefitDesc}>Premium grátis por 1 ano</Text>
                </View>
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={styles.launchCTA}
                onPress={() => {
                  closePromoPopup();
                  navigation.navigate('Login', { redirectTo: 'NewItem' });
                }}
              >
                <Text style={styles.launchCTAText}>Quero garantir minha vaga</Text>
                <View style={styles.launchCTAArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.launchFooterRow}>
                <View style={styles.launchFooterItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.launchFooterText}>Cadastro em 30 segundos</Text>
                </View>
                <View style={styles.launchFooterItem}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.launchFooterText}>Sem compromisso</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Premium Popup Modal */}
      <Modal
        visible={showPremiumBanner}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissPremiumBanner}
      >
        <View style={styles.premiumModalOverlay}>
          <Animated.View
            style={[
              styles.premiumModalContent,
              {
                opacity: premiumBannerAnim,
                transform: [{ scale: premiumBannerAnim }],
              },
            ]}
          >
            <TouchableOpacity style={styles.premiumModalClose} onPress={dismissPremiumBanner}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.premiumModalIcon,
                {
                  transform: [{
                    scale: premiumShineAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.15, 1],
                    }),
                  }],
                },
              ]}
            >
              <Ionicons name="diamond" size={40} color="#FFD700" />
            </Animated.View>

            <Text style={styles.premiumModalTitle}>Seja PREMIUM</Text>
            <Text style={styles.premiumModalSubtitle}>
              Acesso exclusivo às melhores peças antes de todo mundo
            </Text>

            <View style={styles.premiumModalBenefits}>
              <View style={styles.premiumModalBenefit}>
                <Ionicons name="flash" size={18} color="#FFD700" />
                <Text style={styles.premiumModalBenefitText}>Acesso antecipado</Text>
              </View>
              <View style={styles.premiumModalBenefit}>
                <Ionicons name="pricetag" size={18} color="#FFD700" />
                <Text style={styles.premiumModalBenefitText}>Descontos exclusivos</Text>
              </View>
              <View style={styles.premiumModalBenefit}>
                <Ionicons name="star" size={18} color="#FFD700" />
                <Text style={styles.premiumModalBenefitText}>Suporte prioritário</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.premiumModalCTA}
              onPress={() => {
                dismissPremiumBanner();
                navigation.navigate('Subscription');
              }}
            >
              <Text style={styles.premiumModalCTAText}>Quero ser Premium</Text>
              <Ionicons name="arrow-forward" size={18} color="#1a1a1a" />
            </TouchableOpacity>

            <TouchableOpacity onPress={dismissPremiumBanner}>
              <Text style={styles.premiumModalSkip}>Agora não</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

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
          {isAuthenticated && user ? (
            <TouchableOpacity style={styles.headerUserBtn} onPress={() => navigation.navigate('Profile')}>
              <View style={styles.headerUserAvatar}>
                <Text style={styles.headerUserInitial}>{user.name?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
              <Text style={styles.headerUserName} numberOfLines={1}>{user.name?.split(' ')[0] || 'Usuário'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.headerBtnFilled} onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.headerBtnFilledText}>Entrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Banner Carousel - Full Width */}
        <View style={styles.heroBannerContainer}>
          <Animated.View style={[styles.heroBannerWrapper, { opacity: fadeAnim }]}>
            <Image
              source={{ uri: CAROUSEL_BANNERS[currentImageIndex % CAROUSEL_BANNERS.length].uri }}
              style={styles.heroBannerImage}
            />
            <LinearGradient
              colors={CAROUSEL_BANNERS[currentImageIndex % CAROUSEL_BANNERS.length].gradient as [string, string]}
              style={styles.heroBannerGradient}
            />

            {/* Conteúdo do Banner */}
            <Animated.View
              style={[
                styles.heroBannerContent,
                {
                  opacity: infoOpacityAnim,
                  transform: [{ translateY: infoSlideAnim }],
                },
              ]}
            >
              <View style={styles.heroBannerBadge}>
                <Ionicons name="flash" size={14} color="#fff" />
                <Text style={styles.heroBannerBadgeText}>
                  {CAROUSEL_BANNERS[currentImageIndex % CAROUSEL_BANNERS.length].highlight}
                </Text>
              </View>

              <Text style={styles.heroBannerTitle}>
                {CAROUSEL_BANNERS[currentImageIndex % CAROUSEL_BANNERS.length].title}
              </Text>

              <Text style={styles.heroBannerSubtitle}>
                {CAROUSEL_BANNERS[currentImageIndex % CAROUSEL_BANNERS.length].subtitle}
              </Text>

              <TouchableOpacity
                style={styles.heroBannerButton}
                onPress={() => navigation.navigate('Search')}
              >
                <Text style={styles.heroBannerButtonText}>
                  {CAROUSEL_BANNERS[currentImageIndex % CAROUSEL_BANNERS.length].cta}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Dots do carrossel */}
          <View style={styles.heroBannerDots}>
            {CAROUSEL_BANNERS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.heroBannerDot,
                  currentImageIndex % CAROUSEL_BANNERS.length === index && styles.heroBannerDotActive
                ]}
              />
            ))}
          </View>
        </View>

        {/* Peças em Destaque - Scroll Horizontal with Fade In */}
        <Animated.View style={[
          styles.featuredPiecesSection,
          {
            opacity: featuredOpacity,
            transform: [{ translateY: featuredTranslateY }]
          }
        ]}>
          <Text style={styles.featuredPiecesTitle}>PEÇAS EM DESTAQUE</Text>
          <Text style={styles.featuredPiecesSubtitle}>
            Explore nossas categorias mais procuradas
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredPiecesScroll}
          >
            {FEATURED_PIECES.map((piece, index) => {
              const count = categoryCounts[piece.category] || 0;
              return (
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
                        <Text style={styles.featuredPieceCount}>
                          {count > 0 ? `${count}` : piece.count}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.featuredPieceCategory}>{piece.category}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.featuredPiecesCTA}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.featuredPiecesCTAText}>Ver todas as peças</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Como Funciona with Fade In */}
        <Animated.View style={[
          styles.howItWorks,
          {
            opacity: howItWorksOpacity,
            transform: [{ translateY: howItWorksTranslateY }]
          }
        ]}>
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
        </Animated.View>

        {/* SEÇÃO DE MARCAS - Grande e Impactante with Fade In */}
        <Animated.View style={[styles.brandsSection, { opacity: brandsOpacity }]}>
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
                <View style={styles.brandLogoContainer}>
                  <Image
                    source={{ uri: brand.logo }}
                    style={styles.brandLogoImage}
                    resizeMode="contain"
                  />
                </View>
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
        </Animated.View>

        {/* Produtos with Fade In */}
        {allItems.length > 0 && (
          <Animated.View style={[
            styles.productsSection,
            {
              opacity: productsOpacity,
              transform: [{ translateY: productsTranslateY }]
            }
          ]}>
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
          </Animated.View>
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


        {/* Footer Estilo Enjoei */}
        <View style={styles.footerEnjoei}>
          {/* Banner Download App */}
          <View style={styles.footerAppBanner}>
            <View style={styles.footerAppBannerContent}>
              <Text style={styles.footerAppBannerTitle}>BAIXE AGORA O APP</Text>
              <Text style={styles.footerAppBannerSubtitle}>
                Moda circular na palma da sua mão.{'\n'}Desapegue de onde estiver!
              </Text>
              <View style={styles.footerAppButtons}>
                <TouchableOpacity style={styles.footerAppButton}>
                  <Ionicons name="logo-google-playstore" size={18} color="#fff" />
                  <Text style={styles.footerAppButtonText}>Google Play</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerAppButton}>
                  <Ionicons name="logo-apple" size={18} color="#fff" />
                  <Text style={styles.footerAppButtonText}>App Store</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&q=80' }}
              style={styles.footerAppImage}
            />
          </View>

          {/* Links do Footer */}
          <View style={styles.footerLinksContainer}>
            {/* Categorias */}
            <View style={styles.footerLinkColumn}>
              <Text style={styles.footerLinkTitle}>categorias</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>moda feminina</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>bolsas</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>calçados</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>acessórios</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>ver tudo</Text></TouchableOpacity>
            </View>

            {/* Destaques */}
            <View style={styles.footerLinkColumn}>
              <Text style={styles.footerLinkTitle}>destaques</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>novidades</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>mais vendidos</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>marcas premium</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>promoções</Text></TouchableOpacity>
            </View>

            {/* Marcas */}
            <View style={styles.footerLinkColumn}>
              <Text style={styles.footerLinkTitle}>marcas populares</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>zara</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>farm</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>gucci</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>louis vuitton</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>ver todas</Text></TouchableOpacity>
            </View>

            {/* Utilidades */}
            <View style={styles.footerLinkColumn}>
              <Text style={styles.footerLinkTitle}>utilidades</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Help')}><Text style={styles.footerLink}>ajuda</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSellPress}><Text style={styles.footerLink}>como vender</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.footerLink}>como comprar</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Terms')}><Text style={styles.footerLink}>termos de uso</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Terms')}><Text style={styles.footerLink}>privacidade</Text></TouchableOpacity>
            </View>

            {/* Minha Conta */}
            <View style={styles.footerLinkColumn}>
              <Text style={styles.footerLinkTitle}>minha conta</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}><Text style={styles.footerLink}>meu perfil</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Sales')}><Text style={styles.footerLink}>minhas vendas</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Orders')}><Text style={styles.footerLink}>minhas compras</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Favorites')}><Text style={styles.footerLink}>favoritos</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}><Text style={styles.footerLink}>configurações</Text></TouchableOpacity>
            </View>

            {/* Redes Sociais */}
            <View style={styles.footerLinkColumn}>
              <Text style={styles.footerLinkTitle}>siga a gente</Text>
              <TouchableOpacity style={styles.footerSocialLink}>
                <Ionicons name="logo-instagram" size={16} color={COLORS.primary} />
                <Text style={styles.footerLink}>instagram</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerSocialLink}>
                <Ionicons name="logo-tiktok" size={16} color={COLORS.primary} />
                <Text style={styles.footerLink}>tiktok</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerSocialLink}>
                <Ionicons name="logo-whatsapp" size={16} color={COLORS.primary} />
                <Text style={styles.footerLink}>whatsapp</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Copyright */}
          <View style={styles.footerCopyright}>
            <Text style={styles.footerLogo}>apega<Text style={styles.footerLogoLight}>desapega</Text></Text>
            <Text style={styles.footerCopyrightText}>
              Nascemos em Passo Fundo, RS • Fundado por Amanda Maier
            </Text>
            <Text style={styles.footerMotto}>Moda circular é nosso modo de mudar o mundo 🌱</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

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
    paddingHorizontal: isDesktop ? 60 : isTablet ? 32 : 16,
    paddingBottom: 12,
    backgroundColor: '#FAF9F7',
  },
  logo: {
    fontSize: isDesktop ? 34 : 28,
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
  headerUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: COLORS.primaryExtraLight,
  },
  headerUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUserInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  headerUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    maxWidth: 100,
  },

  // Scroll
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero Banner Carousel - Full Width
  heroBannerContainer: {
    width: '100%',
    height: isDesktop ? 500 : isTablet ? 400 : 320,
    position: 'relative',
    marginBottom: 0,
  },
  heroBannerWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroBannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroBannerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: isDesktop ? 60 : isTablet ? 40 : 24,
    paddingBottom: isDesktop ? 80 : isTablet ? 60 : 50,
  },
  heroBannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  heroBannerBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  heroBannerTitle: {
    fontSize: isDesktop ? 48 : isTablet ? 38 : 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroBannerSubtitle: {
    fontSize: isDesktop ? 20 : isTablet ? 18 : 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
    maxWidth: 500,
  },
  heroBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: isDesktop ? 28 : 22,
    paddingVertical: isDesktop ? 16 : 14,
    borderRadius: 28,
  },
  heroBannerButtonText: {
    fontSize: isDesktop ? 16 : 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  heroBannerDots: {
    position: 'absolute',
    bottom: isDesktop ? 30 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  heroBannerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  heroBannerDotActive: {
    backgroundColor: '#fff',
    width: 28,
  },

  // Hero (legacy - keeping for compatibility)
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
    width: isDesktop ? 400 : isTablet ? 350 : '100%',
    height: isDesktop ? 400 : isTablet ? 350 : 280,
    marginTop: isDesktop ? 0 : 24,
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
    backgroundColor: '#FAF9F7',
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
    paddingHorizontal: isDesktop ? 60 : isTablet ? 32 : 16,
    paddingVertical: isDesktop ? 60 : isTablet ? 48 : 40,
    backgroundColor: '#F5F3F0',
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
    width: isDesktop ? 180 : isTablet ? 150 : 110,
    alignItems: 'center',
  },
  brandLogoContainer: {
    width: isDesktop ? 100 : isTablet ? 80 : 70,
    height: isDesktop ? 100 : isTablet ? 80 : 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
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
    fontSize: isDesktop ? 36 : isTablet ? 30 : 24,
    fontWeight: '800',
    color: COLORS.gray[800],
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: isDesktop ? 18 : isTablet ? 16 : 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: isDesktop ? 36 : 24,
    lineHeight: isDesktop ? 26 : 22,
  },
  textHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // How It Works
  howItWorks: {
    paddingHorizontal: isDesktop ? 60 : isTablet ? 32 : 16,
    paddingVertical: isDesktop ? 70 : isTablet ? 56 : 48,
    backgroundColor: '#fff',
  },
  stepsContainer: {
    flexDirection: isDesktop ? 'row' : isTablet ? 'row' : 'column',
    flexWrap: isTablet ? 'wrap' : 'nowrap',
    gap: isDesktop ? 32 : 20,
    marginBottom: 40,
    justifyContent: 'center',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  stepCard: {
    flex: isDesktop ? 1 : undefined,
    flexBasis: isTablet ? '45%' : undefined,
    minWidth: isMobile ? '100%' : 220,
    maxWidth: isDesktop ? 360 : undefined,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: isDesktop ? 32 : 24,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E8E5E1',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
  },
  stepNumber: {
    position: 'absolute',
    top: 20,
    left: 24,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  stepIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryExtraLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  stepTitle: {
    fontSize: isDesktop ? 18 : 16,
    fontWeight: '700',
    color: COLORS.gray[800],
    textAlign: 'center',
    marginBottom: 10,
  },
  stepText: {
    fontSize: isDesktop ? 15 : 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 22,
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
    width: isDesktop ? '25%' : isTablet ? '33.33%' : '50%',
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
    paddingHorizontal: isDesktop ? 60 : isTablet ? 32 : 16,
    paddingVertical: isDesktop ? 60 : isTablet ? 48 : 40,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: isDesktop ? 80 : isTablet ? 48 : 24,
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: isDesktop ? 48 : isTablet ? 40 : 32,
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

  // Premium Banner Fixo - Cookie Notice Style
  premiumBannerFixed: {
    position: 'absolute',
    bottom: isWeb ? 0 : 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: isDesktop ? 40 : 16,
    paddingVertical: 16,
    gap: 16,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  premiumDismissFixed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumIconFixed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,215,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumContentFixed: {
    flex: 1,
  },
  premiumTitleFixed: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 1,
  },
  premiumSubtitleFixed: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  premiumCTAFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  premiumCTATextFixed: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Promo Popup Styles
  promoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  promoPopup: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  promoClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryExtraLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  promoEmoji: {
    fontSize: 40,
  },
  promoTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  promoSubtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  promoOffers: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 16,
    width: '100%',
    marginBottom: 24,
  },
  promoOfferCard: {
    flex: 1,
    backgroundColor: '#FAF9F7',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  promoOfferCardPremium: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FFD700',
  },
  promoOfferBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  promoOfferBadgePremium: {
    backgroundColor: '#FFD700',
  },
  promoOfferBadgeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  promoOfferTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray[800],
    textAlign: 'center',
    marginBottom: 4,
  },
  promoOfferDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  promoOfferHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  promoOfferHighlightText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  promoCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
  },
  promoCTAText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  promoDisclaimer: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 16,
  },

  // Premium Banner Scroll (dentro do ScrollView)
  premiumBannerScroll: {
    marginHorizontal: isDesktop ? 60 : 16,
    marginBottom: 32,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  premiumDismissScroll: {
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
  premiumIconScroll: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,215,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumContentScroll: {
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumTitleScroll: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  premiumSubtitleScroll: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    maxWidth: 280,
  },
  premiumBenefitsScroll: {
    flexDirection: 'row',
    gap: 16,
  },
  premiumBenefitScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  premiumBenefitTextScroll: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  premiumCTAScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  premiumCTATextScroll: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Premium Modal Popup Styles
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  premiumModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    maxWidth: 380,
    width: '100%',
    position: 'relative',
  },
  premiumModalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  premiumModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,215,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumModalTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 3,
    marginBottom: 12,
    textAlign: 'center',
  },
  premiumModalSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 300,
  },
  premiumModalBenefits: {
    width: '100%',
    marginBottom: 28,
    gap: 12,
  },
  premiumModalBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
  },
  premiumModalBenefitText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  premiumModalCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 28,
    width: '100%',
    marginBottom: 16,
  },
  premiumModalCTAText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  premiumModalSkip: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },

  // Footer Enjoei Style
  footerEnjoei: {
    backgroundColor: '#fff',
    marginTop: 40,
  },
  footerAppBanner: {
    flexDirection: isDesktop ? 'row' : isTablet ? 'row' : 'column',
    backgroundColor: COLORS.primary,
    marginHorizontal: isDesktop ? 60 : isTablet ? 32 : 16,
    borderRadius: 24,
    padding: isDesktop ? 40 : isTablet ? 32 : 24,
    marginBottom: 40,
    overflow: 'hidden',
    alignItems: 'center',
  },
  footerAppBannerContent: {
    flex: 1,
    marginRight: isDesktop ? 40 : 0,
    marginBottom: isDesktop ? 0 : 20,
  },
  footerAppBannerTitle: {
    fontSize: isDesktop ? 32 : 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: 1,
  },
  footerAppBannerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
    marginBottom: 20,
  },
  footerAppButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  footerAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  footerAppButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  footerAppImage: {
    width: isDesktop ? 200 : 150,
    height: isDesktop ? 200 : 150,
    borderRadius: 20,
  },
  footerLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: isDesktop ? 60 : 20,
    gap: isDesktop ? 40 : 20,
    paddingBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  footerLinkColumn: {
    minWidth: isDesktop ? 140 : '45%',
    marginBottom: 20,
  },
  footerLinkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginBottom: 16,
    fontStyle: 'italic',
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 10,
  },
  footerSocialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  footerCopyright: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerCopyrightText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 8,
  },

  // Launch Modal - Design Premium Grande
  launchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isDesktop ? 40 : 16,
  },
  launchModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: isDesktop ? 900 : 500,
    flexDirection: isDesktop ? 'row' : 'column',
    ...Platform.select({
      web: { boxShadow: '0 25px 80px rgba(0,0,0,0.5)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 25,
      },
    }),
  },
  launchImageSide: {
    width: isDesktop ? '45%' : '100%',
    height: isDesktop ? 'auto' : 200,
    minHeight: isDesktop ? 500 : 200,
    position: 'relative',
  },
  launchImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  launchImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  launchImageContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  launchQuoteBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
  },
  launchQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#333',
    marginBottom: 8,
  },
  launchStars: {
    flexDirection: 'row',
    gap: 2,
  },
  launchContentSide: {
    flex: 1,
    padding: isDesktop ? 48 : 32,
    justifyContent: 'center',
  },
  launchLogo: {
    fontSize: isDesktop ? 28 : 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  launchLogoLight: {
    fontWeight: '400',
    color: '#999',
  },
  launchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryExtraLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  launchBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  launchTitle: {
    fontSize: isDesktop ? 36 : 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: isDesktop ? 44 : 36,
  },
  launchSubtitle: {
    fontSize: isDesktop ? 18 : 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 26,
  },
  launchBenefitsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  launchBenefitCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  launchBenefitCardGold: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  launchBenefitIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(76,175,80,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  launchBenefitNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: '#4CAF50',
    lineHeight: 44,
  },
  launchBenefitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  launchBenefitDesc: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  launchCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    gap: 12,
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(107,144,128,0.4)',
        transition: 'all 0.3s ease',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  launchCTAText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  launchCTAArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  launchFooterRow: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 16,
  },
  launchFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  launchFooterText: {
    fontSize: 14,
    color: '#666',
  },
  // Promo Screen styles (legacy, keeping for compatibility)
  promoScreen: {
    flex: 1,
    backgroundColor: '#FAF9F7',
  },
  promoScreenContent: {
    paddingBottom: 40,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isDesktop ? 60 : 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  promoSkipBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  promoSkipText: {
    fontSize: 16,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  promoHero: {
    flexDirection: isDesktop ? 'row' : 'column',
    paddingHorizontal: isDesktop ? 60 : 20,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 32,
  },
  promoHeroLeft: {
    flex: 1,
    maxWidth: isDesktop ? 500 : '100%',
  },
  promoHeroTitle: {
    fontSize: isDesktop ? 52 : 38,
    fontWeight: '300',
    color: COLORS.gray[800],
    lineHeight: isDesktop ? 60 : 46,
    marginBottom: 20,
  },
  promoHeroTitleHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  promoHeroSubtitle: {
    fontSize: 18,
    color: COLORS.gray[600],
    lineHeight: 28,
  },
  promoHeroImage: {
    width: isDesktop ? 450 : '100%',
    height: isDesktop ? 350 : 250,
    borderRadius: 24,
  },
  promoCardsRow: {
    flexDirection: isDesktop ? 'row' : 'column',
    paddingHorizontal: isDesktop ? 60 : 20,
    gap: 20,
    marginBottom: 40,
  },
  promoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  promoCardGold: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  promoCardImage: {
    width: '100%',
    height: 180,
  },
  promoCardContent: {
    padding: 24,
    alignItems: 'center',
  },
  promoCardNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
  },
  promoCardNumberGold: {
    color: '#B8860B',
  },
  promoCardLabel: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 12,
  },
  promoCardBenefit: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  promoCardBenefitGold: {
    color: '#B8860B',
  },
  promoCardDetail: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  promoCTAButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: isDesktop ? 60 : 20,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  promoCTAButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
