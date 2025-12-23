import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, FEES } from '../constants/theme';
import { getSales, getSalesStats, type Order as ApiOrder, type SalesStats } from '../services/orders';
import { BottomNavigation, Header, MainHeader, Tab, Button, Modal } from '../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Sales'>;

type TabItem = { id: string; label: string };

interface Sale {
  id: string;
  orderId: string;
  product: {
    name: string;
    size: string;
    image: string;
  };
  buyer: string;
  amount: number;
  sellerReceives: number;
  urgent?: boolean;
  status: 'pending_shipment' | 'in_transit' | 'delivered';
}

export default function SalesScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 900;

  const [activeTab, setActiveTab] = useState<string>('pending');
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const revenue = stats?.totalRevenue || 0;
  const salesCount = stats?.totalOrders || sales.length;

  const normalizeStatus = (status: ApiOrder['status']): Sale['status'] => {
    if (status === 'in_transit' || status === 'shipped') return 'in_transit';
    if (status === 'delivered' || status === 'completed') return 'delivered';
    return 'pending_shipment';
  };

  const mapOrderToSale = (order: ApiOrder): Sale => ({
    id: order.id,
    orderId: order.order_number || order.id,
    product: {
      name: order.product_title || '---',
      size: order.product_size || '',
      image: order.product_image || '',
    },
    buyer: order.buyer_name || '---',
    amount: order.product_price || 0,
    sellerReceives: order.seller_receives || 0,
    status: normalizeStatus(order.status),
  });

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const [salesResponse, statsResponse] = await Promise.all([
        getSales(),
        getSalesStats(),
      ]);
      if (salesResponse.orders) setSales(salesResponse.orders.map(mapOrderToSale));
      if (statsResponse.stats) setStats(statsResponse.stats);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales])
  );

  const pendingCount = sales.filter((s) => s.status === 'pending_shipment').length;
  const inTransitCount = sales.filter((s) => s.status === 'in_transit').length;

  const tabs: TabItem[] = [
    { id: 'pending', label: `aguardando (${pendingCount})` },
    { id: 'transit', label: `em transito (${inTransitCount})` },
    { id: 'delivered', label: 'entregues' },
  ];

  const filteredSales = sales.filter((sale) => {
    if (activeTab === 'pending') return sale.status === 'pending_shipment';
    if (activeTab === 'transit') return sale.status === 'in_transit';
    if (activeTab === 'delivered') return sale.status === 'delivered';
    return true;
  });

  const handleGenerateLabel = (sale: Sale) => {
    setSelectedSale(sale);
    setShowLabelModal(true);
  };

  const handleMarkShipped = (sale: Sale) => {
    setSelectedSale(sale);
    setShowShipModal(true);
  };

  const renderSaleCard = (sale: Sale) => (
    <View key={sale.id} style={styles.saleCard}>
      <Text style={styles.saleOrderId}>venda #{sale.orderId}</Text>
      <View style={styles.saleProduct}>
        {sale.product.image ? (
          <Image source={{ uri: sale.product.image }} style={styles.productImage} />
        ) : (
          <View style={styles.productImage}>
            <Ionicons name="image-outline" size={24} color={COLORS.textTertiary} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{sale.product.name}</Text>
          {sale.product.size ? <Text style={styles.productSize}>tam {sale.product.size}</Text> : null}
        </View>
      </View>

      <View style={styles.saleDetails}>
        <Text style={styles.saleLabel}>compradora: <Text style={styles.saleValue}>{sale.buyer}</Text></Text>
        <Text style={styles.saleLabel}>valor: <Text style={styles.saleValue}>R$ {(sale.amount || 0).toFixed(2)}</Text></Text>
        <Text style={styles.saleLabel}>comissao ({FEES.commissionPercentage}%): <Text style={styles.commissionValue}>- R$ {((sale.amount || 0) * FEES.commissionRate).toFixed(2)}</Text></Text>
        <Text style={styles.saleLabel}>voce recebe: <Text style={styles.saleValueHighlight}>R$ {(sale.sellerReceives || 0).toFixed(2)}</Text></Text>
      </View>

      {sale.status === 'pending_shipment' && (
        <View style={styles.saleActions}>
          <Button label="gerar etiqueta" variant="secondary" size="small" onPress={() => handleGenerateLabel(sale)} />
          <Button label="enviei" variant="primary" size="small" onPress={() => handleMarkShipped(sale)} />
        </View>
      )}

      {sale.status === 'in_transit' && (
        <View style={styles.saleActions}>
          <Button label="mensagem" variant="secondary" size="small" onPress={() => console.log('Message')} />
          <Button label="detalhes" variant="primary" size="small" onPress={() => console.log('Details')} />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {isWeb ? (
        <MainHeader navigation={navigation} title="Vendas" />
      ) : (
        <Header navigation={navigation} title="Vendas" />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.banner, isDesktop && styles.bannerDesktop]}>
          <Text style={styles.bannerLabel}>faturamento do mes</Text>
          <Text style={styles.bannerValue}>R$ {revenue.toFixed(2)}</Text>
          <Text style={styles.bannerMeta}>{salesCount} vendas</Text>
        </View>

        <Tab items={tabs} activeTab={activeTab} onTabPress={setActiveTab} />

        <View style={[styles.salesList, isDesktop && styles.salesListDesktop]}>
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.emptyText}>carregando vendas...</Text>
            </View>
          ) : filteredSales.length > 0 ? (
            filteredSales.map(renderSaleCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>nenhuma venda por aqui</Text>
            </View>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Sales" />

      <Modal visible={showLabelModal} onClose={() => setShowLabelModal(false)} title="Etiqueta de envio" type="bottom">
        <View style={styles.modalContent}>
          <Text style={styles.modalOrderId}>venda #{selectedSale?.orderId}</Text>
          <View style={styles.modalBlock}>
            <Text style={styles.modalLabel}>remetente</Text>
            <Text style={styles.modalValue}>maria silva</Text>
          </View>
          <View style={styles.modalBlock}>
            <Text style={styles.modalLabel}>destinatario</Text>
            <Text style={styles.modalValue}>{selectedSale?.buyer}</Text>
          </View>
          <Button label="gerar etiqueta" variant="primary" onPress={() => setShowLabelModal(false)} fullWidth />
        </View>
      </Modal>

      <Modal visible={showShipModal} onClose={() => setShowShipModal(false)} title="Confirmar envio" type="bottom">
        <View style={styles.modalContent}>
          <Text style={styles.modalOrderId}>venda #{selectedSale?.orderId}</Text>
          <Text style={styles.modalValue}>{selectedSale?.product.name}</Text>
          <Button label="confirmar envio" variant="primary" onPress={() => setShowShipModal(false)} fullWidth />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xl,
  },
  banner: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    margin: SPACING.md,
    ...SHADOWS.xs,
  },
  bannerDesktop: {
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
  },
  bannerLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  bannerValue: {
    fontSize: TYPOGRAPHY.sizes['3xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  bannerMeta: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  salesList: {
    padding: SPACING.md,
  },
  salesListDesktop: {
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
  },
  saleCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.xs,
  },
  saleOrderId: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  saleProduct: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  productSize: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  saleDetails: {
    marginBottom: SPACING.sm,
  },
  saleLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  saleValue: {
    color: COLORS.textPrimary,
  },
  saleValueHighlight: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  commissionValue: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  saleActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  emptyText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  modalContent: {
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  modalOrderId: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  modalBlock: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  modalLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
});
