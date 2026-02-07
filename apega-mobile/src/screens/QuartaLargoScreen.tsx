import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  useWindowDimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { productsService } from '../api';
import { formatPrice } from '../utils/format';

// ════════════════════════════════════════════════════════════
// DESIGN SYSTEM
// ════════════════════════════════════════════════════════════

const BRAND = {
  primary: '#C75C3A',
  primaryDark: '#A84B2E',
  primaryLight: '#D4816A',
  black: '#0F0F0F',
  white: '#FFFFFF',
  gray50: '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray900: '#18181B',
  success: '#22C55E',
  successLight: '#DCFCE7',
  // Using terracotta brand colors instead of purple
  accent: '#C75C3A',
  accentLight: '#F5E6E1',
};

// Check if today is Wednesday
const isWednesday = () => new Date().getDay() === 3;

// Get next Wednesday
const getNextWednesday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilWednesday = dayOfWeek <= 3 ? 3 - dayOfWeek : 10 - dayOfWeek;
  const nextWed = new Date(today);
  nextWed.setDate(today.getDate() + daysUntilWednesday);
  nextWed.setHours(10, 0, 0, 0);
  return nextWed;
};

// Countdown timer
const useCountdown = (targetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

export function QuartaLargoScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const cols = isMobile ? 2 : isTablet ? 3 : 4;
  const padding = isMobile ? 16 : 24;
  const gap = 12;
  const maxW = 1200;
  const containerW = Math.min(width, maxW);
  const cardW = (containerW - padding * 2 - gap * (cols - 1)) / cols;

  const isActive = isWednesday();
  const nextWed = getNextWednesday();
  const countdown = useCountdown(nextWed);
  const AUCTION_DURATION_HOURS = 1; // Leilão dura 1 hora máximo por peça

  const fetchProducts = useCallback(async () => {
    try {
      // In production, fetch only products participating in Quarta do Largô
      const res = await productsService.getProducts({ limit: 40 });
      // Add fake discount for demo
      const discountedProducts = (res.products || []).map((p: any) => ({
        ...p,
        originalPrice: p.price,
        price: Math.round(p.price * 0.7), // 30% off for demo
        quartaDiscount: 30,
      }));
      setProducts(discountedProducts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // Adicionar ao carrinho com preço do leilão
  const handleAddToCart = async (product: any) => {
    if (addingToCart) return;

    setAddingToCart(product.id);
    try {
      // TODO: Chamar API do carrinho com preço do leilão
      // await cartService.addToCart(product.id, { auctionPrice: product.price });

      // Por enquanto, navegar para detalhes
      navigation.navigate('ProductDetail', { productId: product.id });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[BRAND.primary, BRAND.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={[styles.headerContent, { maxWidth: maxW, paddingHorizontal: padding }]}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={BRAND.white} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Quarta do Largô</Text>
            <Text style={styles.headerSubtitle}>Leilão semanal de moda</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />
        }
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={[BRAND.primary, BRAND.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBanner, { marginHorizontal: padding }]}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroTag}>
              <Ionicons name="flash" size={14} color="#FDE047" />
              <Text style={styles.heroTagText}>TODA QUARTA-FEIRA</Text>
            </View>

            <Text style={styles.heroTitle}>
              Desapegue{'\n'}com desconto!
            </Text>

            <Text style={styles.heroDesc}>
              Peças selecionadas com 30% OFF.{'\n'}
              Cada peça fica disponível por apenas 1 hora!
            </Text>

            {/* Countdown */}
            {!isActive ? (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownLabel}>Próximo leilão em:</Text>
                <View style={styles.countdownBoxes}>
                  <View style={styles.countdownBox}>
                    <Text style={styles.countdownNumber}>{countdown.days}</Text>
                    <Text style={styles.countdownUnit}>dias</Text>
                  </View>
                  <View style={styles.countdownBox}>
                    <Text style={styles.countdownNumber}>{countdown.hours}</Text>
                    <Text style={styles.countdownUnit}>horas</Text>
                  </View>
                  <View style={styles.countdownBox}>
                    <Text style={styles.countdownNumber}>{countdown.minutes}</Text>
                    <Text style={styles.countdownUnit}>min</Text>
                  </View>
                  <View style={styles.countdownBox}>
                    <Text style={styles.countdownNumber}>{countdown.seconds}</Text>
                    <Text style={styles.countdownUnit}>seg</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>AO VIVO AGORA!</Text>
              </View>
            )}
          </View>

          {/* Decorative circles */}
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
        </LinearGradient>

        {/* Rules */}
        <View style={[styles.rulesSection, { paddingHorizontal: padding, maxWidth: maxW }]}>
          <Text style={styles.rulesTitle}>Como funciona?</Text>
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <View style={styles.ruleIcon}>
                <Ionicons name="calendar" size={20} color={BRAND.primary} />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Toda quarta-feira</Text>
                <Text style={styles.ruleDesc}>Das 10h às 22h</Text>
              </View>
            </View>

            <View style={styles.ruleItem}>
              <View style={styles.ruleIcon}>
                <Ionicons name="pricetag" size={20} color={BRAND.primary} />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Descontos exclusivos</Text>
                <Text style={styles.ruleDesc}>Vendedores baixam os preços</Text>
              </View>
            </View>

            <View style={styles.ruleItem}>
              <View style={styles.ruleIcon}>
                <Ionicons name="time" size={20} color={BRAND.primary} />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>1 hora por peça</Text>
                <Text style={styles.ruleDesc}>Cada peça fica disponível por 1 hora máximo</Text>
              </View>
            </View>

            <View style={styles.ruleItem}>
              <View style={styles.ruleIcon}>
                <Ionicons name="cart" size={20} color={BRAND.primary} />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Adicione ao carrinho</Text>
                <Text style={styles.ruleDesc}>Clique em "Pegar" e finalize no checkout</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Products */}
        <View style={[styles.productsSection, { paddingHorizontal: padding, maxWidth: maxW }]}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Peças participantes</Text>
            <Text style={styles.productCount}>{products.length} itens</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BRAND.primary} />
            </View>
          ) : (
            <View style={[styles.grid, { gap }]}>
              {products.map((item) => {
                const isAdding = addingToCart === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.card, { width: cardW }]}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                  >
                    <View style={[styles.cardImageWrap, { height: cardW * 1.3 }]}>
                      <Image
                        source={{ uri: item.image_url || item.image || 'https://via.placeholder.com/300' }}
                        style={styles.cardImage}
                        contentFit="cover"
                        transition={200}
                      />

                      {/* Discount Badge */}
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{item.quartaDiscount}%</Text>
                      </View>

                      {/* Timer Badge - 1 hora */}
                      {isActive && (
                        <View style={styles.timerBadge}>
                          <Ionicons name="time-outline" size={12} color={BRAND.white} />
                          <Text style={styles.timerText}>1h</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.cardBrand} numberOfLines={1}>
                        {item.brand || 'Sem marca'}
                      </Text>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.cardPrice}>R$ {formatPrice(item.price)}</Text>
                        <Text style={styles.cardOldPrice}>R$ {formatPrice(item.originalPrice)}</Text>
                      </View>

                      {/* Botão Pegar */}
                      {isActive && (
                        <Pressable
                          style={[styles.addToCartBtn, isAdding && styles.addToCartBtnDisabled]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                          disabled={isAdding}
                        >
                          <Ionicons name="bag-add-outline" size={16} color={BRAND.white} />
                          <Text style={styles.addToCartText}>
                            {isAdding ? 'Adicionando...' : 'Pegar'}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.gray50,
  },

  // Header
  header: {
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },

  // Hero Banner
  heroBanner: {
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  heroContent: {
    zIndex: 2,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 16,
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE047',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND.white,
    lineHeight: 38,
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: 20,
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    right: -50,
    top: -50,
  },
  heroCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    right: 80,
    bottom: -30,
  },

  // Countdown
  countdownContainer: {
    marginTop: 8,
  },
  countdownLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  countdownBoxes: {
    flexDirection: 'row',
    gap: 8,
  },
  countdownBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 56,
  },
  countdownNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.white,
  },
  countdownUnit: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // Live indicator
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.white,
  },
  liveText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.white,
  },

  // Rules
  rulesSection: {
    marginBottom: 24,
    alignSelf: 'center',
    width: '100%',
  },
  rulesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.gray900,
    marginBottom: 16,
  },
  rulesList: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ruleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.gray900,
  },
  ruleDesc: {
    fontSize: 12,
    color: BRAND.gray500,
    marginTop: 2,
  },

  // Products
  productsSection: {
    marginBottom: 24,
    alignSelf: 'center',
    width: '100%',
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.gray900,
  },
  productCount: {
    fontSize: 14,
    color: BRAND.gray500,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: BRAND.success,
  },
  cardImageWrap: {
    position: 'relative',
    backgroundColor: BRAND.gray100,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: BRAND.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.white,
  },
  timerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND.white,
  },
  cardInfo: {
    padding: 12,
  },
  cardBrand: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND.gray900,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.primary,
  },
  cardOldPrice: {
    fontSize: 12,
    color: BRAND.gray400,
    textDecorationLine: 'line-through',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  addToCartBtnDisabled: {
    opacity: 0.6,
  },
  addToCartText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.white,
  },
});

export default QuartaLargoScreen;
