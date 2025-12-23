import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  Animated,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavigation } from '../components';
import { COLORS } from '../constants/theme';
import { getProducts, Product, getCategoryCounts } from '../services/products';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

// Banners full-width do carrossel - Gradientes elegantes
const CAROUSEL_BANNERS = [
  {
    title: 'Moda Circular',
    subtitle: 'Renove seu guarda-roupa com peças únicas',
    highlight: 'ATÉ 70% OFF',
    cta: 'Explorar',
    gradient: ['#4A7C59', '#2D5A27'] as [string, string],
  },
  {
    title: 'Peças Premium',
    subtitle: 'Farm, Animale, Zara e muito mais',
    highlight: 'EXCLUSIVO',
    cta: 'Ver coleção',
    gradient: ['#7B1FA2', '#4A148C'] as [string, string],
  },
  {
    title: 'Sustentabilidade',
    subtitle: 'Moda consciente que faz a diferença',
    highlight: 'ECO-FRIENDLY',
    cta: 'Saiba mais',
    gradient: ['#00695C', '#004D40'] as [string, string],
  },
  {
    title: 'Bolsas de Grife',
    subtitle: 'Louis Vuitton, Gucci, Prada',
    highlight: 'IMPERDÍVEL',
    cta: 'Conferir',
    gradient: ['#C9A227', '#8B6914'] as [string, string],
  },
];

// Categorias em destaque - imagens vêm dos produtos reais dos usuários
const FEATURED_CATEGORIES = [
  'Vestidos',
  'Bolsas',
  'Calcados',
  'Blusas',
  'Calcas',
  'Jaquetas',
  'Saias',
  'Casacos',
  'Shorts',
  'Blazers',
  'Acessorios',
  'Relogios',
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
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 1024;
  const isTablet = isWeb && width > 600 && width <= 1024;
  const isMobile = !isDesktop && !isTablet;
  const styles = useMemo(() => createStyles(isDesktop, isTablet, isMobile), [isDesktop, isTablet, isMobile]);
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

  // Onboarding modal state - multi-step flow
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [promoStatus, setPromoStatus] = useState<{
    showOnboarding: boolean;
    availableSlots: number;
    currentPromo: { type: string; name: string; slotsRemaining: number } | null;
  } | null>(null);
  const promoScaleAnim = useRef(new Animated.Value(0)).current;
  const promoOpacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Onboarding slides data
  const ONBOARDING_SLIDES = [
    {
      image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=90',
      icon: 'leaf-outline',
      iconColor: '#C9A227',
      title: 'Moda com propósito',
      subtitle: 'A plataforma brasileira de moda circular que valoriza suas peças e o planeta',
      highlight: 'NOVO',
      highlightColor: '#C9A227',
    },
    {
      image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200&q=90',
      icon: 'camera-outline',
      iconColor: '#2E7D32',
      title: 'Venda em segundos',
      subtitle: 'Nossa IA analisa suas peças, sugere preços competitivos e cria anúncios profissionais',
      highlight: 'TECNOLOGIA',
      highlightColor: '#2E7D32',
    },
    {
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=90',
      icon: 'pricetag-outline',
      iconColor: '#D32F2F',
      title: 'Taxa reduzida',
      subtitle: 'Apenas 5% de comissão para as primeiras 50 vendedoras. Outras plataformas cobram até 20%',
      highlight: 'EXCLUSIVO',
      highlightColor: '#D32F2F',
    },
    {
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=90',
      icon: 'diamond-outline',
      iconColor: '#7B1FA2',
      title: 'Premium grátis',
      subtitle: 'As 5 primeiras vendedoras recebem 1 ano de Premium: IA ilimitada, sem taxa e destaque nos resultados',
      highlight: 'ÚLTIMAS VAGAS',
      highlightColor: '#7B1FA2',
    },
  ];

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

  // Verificar vagas disponíveis ao carregar
  useEffect(() => {
    const checkPromoStatus = async () => {
      try {
        const response = await api.get('/promo/status');
        setPromoStatus(response);
        // Mostrar onboarding apenas se houver vagas e usuário não estiver logado
        if (response.showOnboarding && !isAuthenticated) {
          setShowPromoPopup(true);
        }
      } catch (error) {
        console.log('Erro ao verificar promo status:', error);
        // Em caso de erro, não mostra o onboarding
      }
    };
    checkPromoStatus();
  }, [isAuthenticated]);

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

  // Avançar para próximo slide do onboarding
  const nextOnboardingSlide = () => {
    if (onboardingStep < ONBOARDING_SLIDES.length - 1) {
      // Animar saída
      Animated.timing(slideAnim, {
        toValue: -1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setOnboardingStep(prev => prev + 1);
        slideAnim.setValue(1);
        // Animar entrada
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Último slide - ir para cadastro
      closePromoPopup();
      navigation.navigate('Login', { redirectTo: 'NewItem' });
    }
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

  const handleSellPress = () => {
    if (isAuthenticated) {
      (navigation as any).navigate('NewItem');
    } else {
      navigation.navigate('Login', { redirectTo: 'NewItem' });
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

      {/* Modal de Onboarding - Multi-step com transições */}
      <Modal
        visible={showPromoPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={closePromoPopup}
      >
        <View style={styles.onboardingOverlay}>
          <Animated.View
            style={[
              styles.onboardingModal,
              {
                opacity: promoOpacityAnim,
                transform: [
                  { scale: promoScaleAnim },
                  { translateX: slideAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-100, 0, 100],
                  })},
                ],
              },
            ]}
          >
            {/* Background Image */}
            <Image
              source={{ uri: ONBOARDING_SLIDES[onboardingStep].image }}
              style={styles.onboardingBgImage}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
              style={styles.onboardingGradient}
            />

            {/* Content */}
            <View style={styles.onboardingContent}>
              {/* Progress dots */}
              <View style={styles.onboardingDots}>
                {ONBOARDING_SLIDES.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.onboardingDot,
                      index === onboardingStep && styles.onboardingDotActive,
                      index < onboardingStep && styles.onboardingDotCompleted,
                    ]}
                  />
                ))}
              </View>

              {/* Logo marca */}
              <View style={styles.onboardingLogo}>
                <Text style={styles.onboardingLogoText}>apega</Text>
                <Text style={styles.onboardingLogoAccent}>desapega</Text>
              </View>

              <View style={styles.onboardingCard}>
                {/* Icon */}
                <View style={[styles.onboardingIconBox, { backgroundColor: `${ONBOARDING_SLIDES[onboardingStep].iconColor}26` }]}>
                  <Ionicons
                    name={ONBOARDING_SLIDES[onboardingStep].icon as any}
                    size={52}
                    color={ONBOARDING_SLIDES[onboardingStep].iconColor}
                  />
                </View>

                {/* Badge */}
                <View style={[styles.onboardingBadge, { backgroundColor: `${ONBOARDING_SLIDES[onboardingStep].highlightColor}22` }]}>
                  <Text style={[styles.onboardingBadgeText, { color: ONBOARDING_SLIDES[onboardingStep].highlightColor }]}>
                    {ONBOARDING_SLIDES[onboardingStep].highlight}
                  </Text>
                </View>

                {/* Title */}
                <Text style={styles.onboardingTitle}>
                  {ONBOARDING_SLIDES[onboardingStep].title}
                </Text>

                {/* Subtitle */}
                <Text style={styles.onboardingSubtitle}>
                  {ONBOARDING_SLIDES[onboardingStep].subtitle}
                </Text>

                {/* CTA Button */}
                <TouchableOpacity
                  style={styles.onboardingCTA}
                  onPress={nextOnboardingSlide}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#D4AF37', '#C9A227', '#B8860B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.onboardingCTAGradient}
                  >
                    <Text style={styles.onboardingCTAText}>
                      {onboardingStep === ONBOARDING_SLIDES.length - 1 ? 'Garantir minha vaga' : 'Próximo'}
                    </Text>
                    <Ionicons name="chevron-forward" size={22} color="#1a1a1a" />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Step counter */}
                <Text style={styles.onboardingStepText}>
                  {onboardingStep + 1} de {ONBOARDING_SLIDES.length}
                </Text>
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
              <View style={[styles.headerUserAvatar, user.isPremium && styles.headerUserAvatarPremium]}>
                <Text style={styles.headerUserInitial}>{user.name?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
              <View style={styles.headerUserInfo}>
                <Text style={styles.headerUserName} numberOfLines={1}>{user.name || 'Usuario'}</Text>
                <View style={[styles.headerUserBadge, user.isPremium ? styles.headerUserBadgePremium : styles.headerUserBadgeFree]}>
                  <Text style={[styles.headerUserBadgeText, user.isPremium && styles.headerUserBadgeTextPremium]}>
                    {user.isPremium ? 'PREMIUM' : 'FREE'}
                  </Text>
                </View>
              </View>
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
            <LinearGradient
              colors={CAROUSEL_BANNERS[currentImageIndex % CAROUSEL_BANNERS.length].gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBannerGradientFull}
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

        {/* Peças em Destaque */}
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
            {FEATURED_CATEGORIES.map((category, index) => {
              const count = categoryCounts[category] || 0;
              // Busca o primeiro produto da categoria para usar a imagem real
              const categoryProduct = products.find(
                p => p.category?.toLowerCase() === category.toLowerCase()
              );
              const imageUrl = categoryProduct?.images?.[0] || null;

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.featuredPieceCard}
                  onPress={() => navigation.navigate('Search')}
                >
                  <View style={styles.featuredPieceImageWrapper}>
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.featuredPieceImage}
                      />
                    ) : (
                      <View style={[styles.featuredPieceImage, styles.featuredPiecePlaceholder]}>
                        <Ionicons name="shirt-outline" size={40} color={COLORS.gray[400]} />
                      </View>
                    )}
                    <View style={styles.featuredPieceOverlay}>
                      <View style={styles.featuredPieceCountBadge}>
                        <Text style={styles.featuredPieceCount}>{count}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.featuredPieceCategory}>{category}</Text>
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

        {/* SEÇÀO DE MARCAS - mostra apenas marcas dos produtos cadastrados */}
        {(() => {
          // Extrai marcas únicas dos produtos
          const uniqueBrands = Array.from(
            new Set(products.filter(p => p.brand).map(p => p.brand!))
          ).slice(0, 12);

          if (uniqueBrands.length === 0) return null;

          return (
            <View style={styles.brandsSection}>
              <View style={styles.brandsTitleRow}>
                <Ionicons name="diamond" size={28} color={COLORS.primary} />
                <Text style={styles.brandsSectionTitle}>MARCAS EM DESTAQUE</Text>
              </View>
              <Text style={styles.brandsSectionSubtitle}>
                Marcas disponíveis no nosso brechó
              </Text>

              {/* Scroll horizontal de marcas */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.brandsScrollContainer}
              >
                {uniqueBrands.map((brandName, index) => {
                  // Encontra um produto dessa marca para usar a imagem
                  const brandProduct = products.find(p => p.brand === brandName);
                  const imageUrl = brandProduct?.images?.[0] || null;
                  const count = products.filter(p => p.brand === brandName).length;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.brandCard}
                      onPress={() => navigation.navigate('Search')}
                    >
                      <View style={styles.brandLogoContainer}>
                        {imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.brandLogoImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.brandLogoImage, styles.brandPlaceholder]}>
                            <Ionicons name="pricetag-outline" size={24} color={COLORS.gray[400]} />
                          </View>
                        )}
                        <View style={styles.brandCountBadge}>
                          <Text style={styles.brandCountText}>{count}</Text>
                        </View>
                      </View>
                      <Text style={styles.brandName} numberOfLines={1}>{brandName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.viewAllBrandsBtn}
                onPress={() => navigation.navigate('Search')}
              >
                <Text style={styles.viewAllBrandsText}>Ver todas as marcas</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          );
        })()}

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


        {/* Footer Estilo Enjoei */}
        <View style={styles.footerEnjoei}>
          {/* Banner Download App - Premium Design */}
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.footerAppBanner}
          >
            {/* Decorative Elements */}
            <View style={styles.bannerDecorCircle1} />
            <View style={styles.bannerDecorCircle2} />
            <View style={styles.bannerDecorCircle3} />

            <View style={styles.footerAppBannerContent}>
              {/* Badge de Lançamento */}
              <View style={styles.bannerLaunchBadge}>
                <Ionicons name="rocket" size={14} color="#fff" />
                <Text style={styles.bannerLaunchBadgeText}>EM BREVE NAS LOJAS</Text>
              </View>

              {/* Brand */}
              <View style={styles.bannerBrandRow}>
                <Text style={styles.bannerBrandApega}>apega</Text>
                <Text style={styles.bannerBrandDesapega}>desapega</Text>
              </View>

              <Text style={styles.footerAppBannerTitle}>
                O futuro da moda{'\n'}circular está chegando
              </Text>

              <Text style={styles.footerAppBannerSubtitle}>
                Cadastre-se agora e seja uma das primeiras a experimentar.{'\n'}
                <Text style={styles.bannerHighlight}>5 contas Premium grátis</Text> para as pioneiras!
              </Text>

              <View style={styles.footerAppButtons}>
                <TouchableOpacity style={styles.footerAppButtonGoogle}>
                  <View style={styles.storeButtonIcon}>
                    <Ionicons name="logo-google-playstore" size={20} color="#fff" />
                  </View>
                  <View style={styles.storeButtonTextContainer}>
                    <Text style={styles.storeButtonSmallText}>Disponível no</Text>
                    <Text style={styles.storeButtonMainText}>Google Play</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.footerAppButtonApple}>
                  <View style={styles.storeButtonIcon}>
                    <Ionicons name="logo-apple" size={22} color="#fff" />
                  </View>
                  <View style={styles.storeButtonTextContainer}>
                    <Text style={styles.storeButtonSmallText}>Baixe na</Text>
                    <Text style={styles.storeButtonMainText}>App Store</Text>
                  </View>
                </TouchableOpacity>
              </View>

            </View>

          </LinearGradient>

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

const createStyles = (isDesktop: boolean, isTablet: boolean, isMobile: boolean) => StyleSheet.create({
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
    maxWidth: 150,
  },
  headerUserAvatarPremium: {
    backgroundColor: '#7B1FA2',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  headerUserInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  headerUserBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  headerUserBadgeFree: {
    backgroundColor: COLORS.gray[200],
  },
  headerUserBadgePremium: {
    backgroundColor: '#FFD700',
  },
  headerUserBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.gray[600],
    letterSpacing: 0.5,
  },
  headerUserBadgeTextPremium: {
    color: '#7B1FA2',
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
  heroBannerGradientFull: {
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
  featuredPiecePlaceholder: {
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
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
    overflow: 'visible',
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
    borderRadius: 12,
  },
  brandPlaceholder: {
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandCountBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  brandCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
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
    flexDirection: 'column',
    marginHorizontal: isDesktop ? 60 : isTablet ? 32 : 16,
    borderRadius: 24,
    padding: isDesktop ? 32 : isTablet ? 28 : 24,
    marginBottom: 40,
    overflow: 'hidden',
    alignItems: 'center',
    position: 'relative',
  },
  // Decorative circles
  bannerDecorCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(201,162,39,0.08)',
    top: -100,
    right: -50,
  },
  bannerDecorCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(201,162,39,0.05)',
    bottom: -80,
    left: -60,
  },
  bannerDecorCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    top: '50%',
    left: '30%',
  },
  bannerLaunchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(201,162,39,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.4)',
  },
  bannerLaunchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C9A227',
    letterSpacing: 1,
  },
  bannerBrandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  bannerBrandApega: {
    fontSize: isDesktop ? 28 : 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  bannerBrandDesapega: {
    fontSize: isDesktop ? 28 : 22,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: -0.5,
  },
  footerAppBannerContent: {
    flex: 1,
    alignItems: 'center',
    zIndex: 1,
  },
  footerAppBannerTitle: {
    fontSize: isDesktop ? 28 : isTablet ? 24 : 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    lineHeight: isDesktop ? 36 : isTablet ? 32 : 30,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  footerAppBannerSubtitle: {
    fontSize: isDesktop ? 15 : 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: isDesktop ? 24 : 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  bannerHighlight: {
    color: '#C9A227',
    fontWeight: '700',
  },
  footerAppButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  footerAppButtonGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#414141',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  footerAppButtonApple: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  storeButtonIcon: {
    marginRight: 10,
  },
  storeButtonTextContainer: {
    alignItems: 'flex-start',
  },
  storeButtonSmallText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },
  storeButtonMainText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bannerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  bannerStatItem: {
    alignItems: 'center',
  },
  bannerStatNumber: {
    fontSize: isDesktop ? 24 : 20,
    fontWeight: '800',
    color: '#C9A227',
  },
  bannerStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginTop: 2,
  },
  bannerStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  // Phone Mockup
  phoneMockupContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneMockupGlow: {
    position: 'absolute',
    width: isDesktop ? 280 : 220,
    height: isDesktop ? 280 : 220,
    borderRadius: isDesktop ? 140 : 110,
  },
  phoneMockup: {
    width: isDesktop ? 180 : isTablet ? 160 : 140,
    height: isDesktop ? 360 : isTablet ? 320 : 280,
    backgroundColor: '#1a1a1a',
    borderRadius: 28,
    padding: 8,
    borderWidth: 3,
    borderColor: '#333',
    shadowColor: '#C9A227',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  phoneMockupNotch: {
    width: 60,
    height: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 4,
    zIndex: 10,
  },
  phoneMockupScreen: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  phoneMockupBottomBar: {
    width: 80,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
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

  // Onboarding Modal - Multi-step com transições
  onboardingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isDesktop ? 40 : 20,
  },
  onboardingModal: {
    width: '100%',
    maxWidth: isDesktop ? 680 : 500,
    height: isDesktop ? 750 : 700,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(201,162,39,0.4)',
    ...Platform.select({
      web: { boxShadow: '0 0 80px rgba(201,162,39,0.35), 0 30px 100px rgba(0,0,0,0.5)' },
      default: {
        shadowColor: '#C9A227',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 30,
      },
    }),
  },
  onboardingClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  onboardingBgImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  onboardingGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  onboardingContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: isDesktop ? 48 : 32,
    paddingBottom: isDesktop ? 48 : 40,
  },
  onboardingDots: {
    flexDirection: 'row',
    gap: 10,
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  onboardingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  onboardingDotActive: {
    backgroundColor: '#fff',
    width: 32,
  },
  onboardingDotCompleted: {
    backgroundColor: COLORS.primary,
  },
  onboardingLogo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  onboardingLogoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  onboardingLogoAccent: {
    fontSize: 28,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.5,
  },
  onboardingCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: isDesktop ? 30 : 24,
    paddingHorizontal: isDesktop ? 28 : 22,
    borderRadius: 28,
    backgroundColor: 'rgba(10,10,12,0.75)',
    ...Platform.select({
      web: { backdropFilter: 'blur(20px)' },
      default: {},
    }),
  },
  onboardingIconBox: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  onboardingBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 16,
  },
  onboardingBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  onboardingTitle: {
    fontSize: isDesktop ? 44 : 34,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: isDesktop ? 52 : 42,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  onboardingSubtitle: {
    fontSize: isDesktop ? 19 : 17,
    color: 'rgba(255,255,255,0.86)',
    textAlign: 'center',
    marginBottom: 26,
    lineHeight: 28,
    maxWidth: 420,
  },
  onboardingCTA: {
    width: '100%',
    maxWidth: 280,
    marginBottom: 18,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 6px 24px rgba(212,175,55,0.5)',
        transition: 'all 0.3s ease',
      },
      default: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
      },
    }),
  },
  onboardingCTAGradient: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
  },
  onboardingCTAText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  onboardingStepText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
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
