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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';

// ════════════════════════════════════════════════════════════
// DESIGN SYSTEM
// ════════════════════════════════════════════════════════════

const BRAND = {
  primary: '#C75C3A',
  primaryLight: '#E8845A',
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
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
};

type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered';
type TabType = 'received' | 'sent';

interface Offer {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  productPrice: number;
  offerAmount: number;
  counterAmount?: number;
  status: OfferStatus;
  buyerName: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
}

// Mock data for demo
const MOCK_OFFERS: Offer[] = [
  {
    id: '1',
    productId: 'p1',
    productTitle: 'Vestido Farm Floral',
    productImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200',
    productPrice: 189,
    offerAmount: 150,
    status: 'pending',
    buyerName: 'Maria Silva',
    buyerId: 'u1',
    sellerId: 'me',
    createdAt: '2024-01-15T10:30:00',
  },
  {
    id: '2',
    productId: 'p2',
    productTitle: 'Bolsa Arezzo Couro',
    productImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200',
    productPrice: 320,
    offerAmount: 250,
    counterAmount: 280,
    status: 'countered',
    buyerName: 'Ana Costa',
    buyerId: 'u2',
    sellerId: 'me',
    createdAt: '2024-01-14T15:45:00',
  },
  {
    id: '3',
    productId: 'p3',
    productTitle: 'Blazer Zara Oversized',
    productImage: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200',
    productPrice: 199,
    offerAmount: 180,
    status: 'accepted',
    buyerName: 'Carla Dias',
    buyerId: 'u3',
    sellerId: 'me',
    createdAt: '2024-01-13T09:20:00',
  },
];

export function OffersScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [tab, setTab] = useState<TabType>('received');
  const [offers, setOffers] = useState<Offer[]>(MOCK_OFFERS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isMobile = width < 640;
  const padding = isMobile ? 16 : 24;
  const maxW = 800;

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.replace('Login');
    }
  }, [isAuthenticated]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Fetch offers from API
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleAccept = async (offerId: string) => {
    setOffers(prev => prev.map(o =>
      o.id === offerId ? { ...o, status: 'accepted' as OfferStatus } : o
    ));
  };

  const handleReject = async (offerId: string) => {
    setOffers(prev => prev.map(o =>
      o.id === offerId ? { ...o, status: 'rejected' as OfferStatus } : o
    ));
  };

  const handleCounter = async (offerId: string, amount: number) => {
    setOffers(prev => prev.map(o =>
      o.id === offerId ? { ...o, status: 'countered' as OfferStatus, counterAmount: amount } : o
    ));
  };

  const getStatusConfig = (status: OfferStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Aguardando', color: BRAND.warning, bg: BRAND.warningLight, icon: 'time-outline' };
      case 'accepted':
        return { label: 'Aceita', color: BRAND.success, bg: BRAND.successLight, icon: 'checkmark-circle' };
      case 'rejected':
        return { label: 'Recusada', color: BRAND.error, bg: BRAND.errorLight, icon: 'close-circle' };
      case 'countered':
        return { label: 'Contra-proposta', color: '#3B82F6', bg: '#DBEAFE', icon: 'swap-horizontal' };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const filteredOffers = offers; // Filter by tab in real app

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={[styles.headerContent, { maxWidth: maxW, paddingHorizontal: padding }]}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={BRAND.gray900} />
          </Pressable>
          <Text style={styles.headerTitle}>Minhas Ofertas</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { paddingHorizontal: padding }]}>
        <View style={[styles.tabs, { maxWidth: maxW }]}>
          <Pressable
            style={[styles.tab, tab === 'received' && styles.tabActive]}
            onPress={() => setTab('received')}
          >
            <Ionicons
              name="arrow-down-circle-outline"
              size={18}
              color={tab === 'received' ? BRAND.primary : BRAND.gray500}
            />
            <Text style={[styles.tabText, tab === 'received' && styles.tabTextActive]}>
              Recebidas
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'sent' && styles.tabActive]}
            onPress={() => setTab('sent')}
          >
            <Ionicons
              name="arrow-up-circle-outline"
              size={18}
              color={tab === 'sent' ? BRAND.primary : BRAND.gray500}
            />
            <Text style={[styles.tabText, tab === 'sent' && styles.tabTextActive]}>
              Enviadas
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: padding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND.primary} />
          </View>
        ) : filteredOffers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={64} color={BRAND.gray400} />
            <Text style={styles.emptyTitle}>Nenhuma oferta</Text>
            <Text style={styles.emptyText}>
              {tab === 'received'
                ? 'Você ainda não recebeu ofertas nos seus produtos'
                : 'Você ainda não fez ofertas em produtos'}
            </Text>
          </View>
        ) : (
          <View style={[styles.offersList, { maxWidth: maxW }]}>
            {filteredOffers.map((offer) => {
              const statusConfig = getStatusConfig(offer.status);
              return (
                <View key={offer.id} style={styles.offerCard}>
                  {/* Product Info */}
                  <Pressable
                    style={styles.productInfo}
                    onPress={() => navigation.navigate('ProductDetail', { productId: offer.productId })}
                  >
                    <Image
                      source={{ uri: offer.productImage }}
                      style={styles.productImage}
                      contentFit="cover"
                    />
                    <View style={styles.productDetails}>
                      <Text style={styles.productTitle} numberOfLines={1}>{offer.productTitle}</Text>
                      <Text style={styles.productPrice}>Preço: R$ {formatPrice(offer.productPrice)}</Text>
                      <Text style={styles.buyerName}>
                        <Ionicons name="person-outline" size={12} color={BRAND.gray500} />
                        {' '}{offer.buyerName}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Offer Info */}
                  <View style={styles.offerInfo}>
                    <View style={styles.offerRow}>
                      <Text style={styles.offerLabel}>Oferta:</Text>
                      <Text style={styles.offerAmount}>R$ {formatPrice(offer.offerAmount)}</Text>
                    </View>

                    {offer.counterAmount && (
                      <View style={styles.offerRow}>
                        <Text style={styles.offerLabel}>Contra-proposta:</Text>
                        <Text style={[styles.offerAmount, { color: '#3B82F6' }]}>
                          R$ {formatPrice(offer.counterAmount)}
                        </Text>
                      </View>
                    )}

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>

                    <Text style={styles.offerDate}>{formatDate(offer.createdAt)}</Text>
                  </View>

                  {/* Actions for Pending Offers */}
                  {tab === 'received' && offer.status === 'pending' && (
                    <View style={styles.actions}>
                      <Pressable
                        style={[styles.actionBtn, styles.acceptBtn]}
                        onPress={() => handleAccept(offer.id)}
                      >
                        <Ionicons name="checkmark" size={18} color={BRAND.white} />
                        <Text style={styles.acceptBtnText}>Aceitar</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.actionBtn, styles.counterBtn]}
                        onPress={() => {/* Open counter modal */}}
                      >
                        <Ionicons name="swap-horizontal" size={18} color="#3B82F6" />
                        <Text style={styles.counterBtnText}>Negociar</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => handleReject(offer.id)}
                      >
                        <Ionicons name="close" size={18} color={BRAND.error} />
                      </Pressable>
                    </View>
                  )}

                  {/* Checkout for Accepted */}
                  {offer.status === 'accepted' && tab === 'sent' && (
                    <Pressable
                      style={styles.checkoutBtn}
                      onPress={() => navigation.navigate('Checkout', { offerId: offer.id })}
                    >
                      <Ionicons name="bag-check-outline" size={18} color={BRAND.white} />
                      <Text style={styles.checkoutBtnText}>
                        Finalizar compra - R$ {formatPrice(offer.counterAmount || offer.offerAmount)}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}
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
    backgroundColor: BRAND.white,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.gray200,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.gray900,
  },

  // Tabs
  tabsContainer: {
    backgroundColor: BRAND.white,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.gray200,
    paddingVertical: 12,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
    width: '100%',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: BRAND.gray100,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#FEE2E2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.gray500,
  },
  tabTextActive: {
    color: BRAND.primary,
  },

  // Content
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.gray900,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: BRAND.gray500,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },

  // Offers List
  offersList: {
    gap: 16,
    alignSelf: 'center',
    width: '100%',
  },
  offerCard: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.gray200,
  },

  // Product Info
  productInfo: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.gray100,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: BRAND.gray100,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.gray900,
  },
  productPrice: {
    fontSize: 13,
    color: BRAND.gray500,
    marginTop: 2,
  },
  buyerName: {
    fontSize: 12,
    color: BRAND.gray500,
    marginTop: 4,
  },

  // Offer Info
  offerInfo: {
    paddingTop: 12,
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerLabel: {
    fontSize: 14,
    color: BRAND.gray500,
  },
  offerAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  offerDate: {
    fontSize: 12,
    color: BRAND.gray400,
    marginTop: 8,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BRAND.gray100,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: BRAND.success,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.white,
  },
  counterBtn: {
    flex: 1,
    backgroundColor: '#DBEAFE',
  },
  counterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  rejectBtn: {
    width: 48,
    backgroundColor: BRAND.errorLight,
  },

  // Checkout
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.success,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.white,
  },
});

export default OffersScreen;
