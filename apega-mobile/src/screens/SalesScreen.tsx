import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, FEES } from '../constants/theme';
import { getSales, getSalesStats, type Order as ApiOrder, type SalesStats } from '../services/orders';
import { BottomNavigation, Tab, Button, Modal } from '../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 768;

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
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const revenue = stats?.totalRevenue || 0;
  const salesCount = stats?.totalOrders || sales.length;
  const rating = 0;
  const goal = 10;
  const goalProgress = salesCount > 0 ? (salesCount / goal) * 100 : 0;

  const normalizeStatus = (status: ApiOrder['status']): Sale['status'] => {
    if (status === 'in_transit' || status === 'shipped') {
      return 'in_transit';
    }
    if (status === 'delivered' || status === 'completed') {
      return 'delivered';
    }
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

      if (salesResponse.orders) {
        setSales(salesResponse.orders.map(mapOrderToSale));
      }
      if (statsResponse.stats) {
        setStats(statsResponse.stats);
      }
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
    { id: 'pending', label: `aguardando envio (${pendingCount})` },
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

  const handleStats = () => {
    console.log('Show statistics');
  };

  const renderSaleCard = (sale: Sale) => (
    <View
      key={sale.id}
      style={[
        styles.saleCard,
        sale.urgent && styles.saleCardUrgent,
      ]}
    >
      {sale.urgent && (
        <View style={styles.urgentBanner}>
          <Ionicons name="warning" size={20} color={COLORS.warning} />
          <Text style={styles.urgentText}>envie até amanhÀ£</Text>
        </View>
      )}

      <Text style={styles.saleOrderId}>venda #{sale.orderId}</Text>

      <View style={styles.saleProduct}>
        {sale.product.image ? (
          <Image source={{ uri: sale.product.image }} style={styles.productImage} />
        ) : (
          <View style={styles.productImage}>
            <Ionicons name="image" size={32} color={COLORS.textTertiary} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{sale.product.name}</Text>
          {sale.product.size && (
            <Text style={styles.productSize}>tamanho {sale.product.size}</Text>
          )}
        </View>
      </View>

      <View style={styles.saleDetails}>
        <Text style={styles.saleLabel}>compradora: <Text style={styles.saleValue}>{sale.buyer}</Text></Text>
        <Text style={styles.saleLabel}>valor da venda: <Text style={styles.saleValue}>R$ {(sale?.amount || 0).toFixed(2)}</Text></Text>
        <Text style={styles.saleLabel}>comissão ({FEES.commissionPercentage}%): <Text style={styles.commissionValue}>- R$ {((sale?.amount || 0) * FEES.commissionRate).toFixed(2)}</Text></Text>
        <Text style={styles.saleLabel}>você recebe: <Text style={styles.saleValueHighlight}>R$ {(sale?.sellerReceives || 0).toFixed(2)}</Text></Text>
      </View>

      {sale.status === 'pending_shipment' && (
        <View style={styles.saleActions}>
          <Button
            label="gerar etiqueta"
            variant="secondary"
            size="small"
            onPress={() => handleGenerateLabel(sale)}
            style={styles.actionButton}
          />
          <Button
            label="enviei"
            variant="primary"
            size="small"
            onPress={() => handleMarkShipped(sale)}
            style={styles.actionButton}
          />
        </View>
      )}

      {sale.status === 'in_transit' && (
        <View style={styles.saleActions}>
          <Button
            label="mensagem"
            variant="secondary"
            size="small"
            onPress={() => console.log('Message')}
            style={styles.actionButton}
          />
          <Button
            label="detalhes"
            variant="primary"
            size="small"
            onPress={() => console.log('Details')}
            style={styles.actionButton}
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>minhas vendas</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Commission Info Banner */}
        <View style={styles.commissionBanner}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.commissionBannerText}>
            Taxa de {FEES.commissionPercentage}% por venda â€¢ Assinantes Premium têm taxa zero
          </Text>
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>faturamento este mês</Text>
          <Text style={styles.revenueAmount}>R$ {(revenue || 0).toFixed(2)}</Text>
          <Text style={styles.revenueGrowth}>comece a vender hoje!</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${goalProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{salesCount} vendas de {goal} (meta)</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>R${revenue}</Text>
            <Text style={styles.statLabel}>fatura</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{salesCount}</Text>
            <Text style={styles.statLabel}>vendas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{rating}â­</Text>
            <Text style={styles.statLabel}>nota</Text>
          </View>
        </View>

        {/* Tabs */}
        <Tab
          items={tabs}
          activeTab={activeTab}
          onTabPress={setActiveTab}
        />

        {/* Sales List */}
        <View style={styles.salesList}>
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

      {/* Generate Label Modal */}
      <Modal
        visible={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        title="etiqueta de envio"
        type="bottom"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalOrderId}>venda #{selectedSale?.orderId}</Text>

          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>remetente</Text>
            <Text style={styles.addressName}>maria silva</Text>
            <Text style={styles.addressText}>rua das flores, 123</Text>
            <Text style={styles.addressText}>passo fundo - rs</Text>
            <Text style={styles.addressText}>99010-000</Text>
          </View>

          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>destinatário</Text>
            <Text style={styles.addressName}>{selectedSale?.buyer}</Text>
            <Text style={styles.addressText}>av. ipiranga, 500</Text>
            <Text style={styles.addressText}>porto alegre - rs</Text>
            <Text style={styles.addressText}>90000-000</Text>
          </View>

          <Text style={styles.modalLabel}>método de envio</Text>
          <TouchableOpacity style={styles.radioOption}>
            <Ionicons name="radio-button-on" size={20} color={COLORS.primary} />
            <Text style={styles.radioText}>PAC (R$ 15,00 - 5-7 dias)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radioOption}>
            <Ionicons name="radio-button-off" size={20} color={COLORS.gray[400]} />
            <Text style={styles.radioText}>SEDEX (R$ 25,00 - 2-3 dias)</Text>
          </TouchableOpacity>

          <Text style={styles.modalInfo}>valor declarado: R$ {(selectedSale?.amount || 0).toFixed(2)}</Text>

          <Button
            label="gerar etiqueta"
            variant="primary"
            onPress={() => setShowLabelModal(false)}
            fullWidth
            style={{ marginTop: SPACING.lg }}
          />

          <Text style={styles.modalHint}>após gerar, imprima e cole na embalagem do produto</Text>
        </View>
      </Modal>

      {/* Mark as Shipped Modal */}
      <Modal
        visible={showShipModal}
        onClose={() => setShowShipModal(false)}
        title="confirmar envio"
        type="bottom"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalOrderId}>venda #{selectedSale?.orderId}</Text>
          <Text style={styles.modalProductName}>{selectedSale?.product.name}</Text>

          <Text style={styles.modalLabel}>código de rastreio</Text>
          <View style={styles.input}>
            <Text style={styles.inputText}>BR</Text>
          </View>
          <Text style={styles.inputHint}>ex: BR123456789BR</Text>

          <Text style={styles.modalLabel}>método de envio</Text>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownText}>PAC</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
          </View>

          <View style={styles.tipBanner}>
            <Text style={styles.tipIcon}>ðŸ’¡</Text>
            <Text style={styles.tipText}>
              a compradora será notificada automaticamente
            </Text>
          </View>

          <Button
            label="confirmar envio"
            variant="primary"
            onPress={() => {
              setShowShipModal(false);
              // Handle ship confirmation
            }}
            fullWidth
            style={{ marginTop: SPACING.lg }}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isDesktop ? 60 : SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  content: {
    paddingBottom: SPACING.xl,
    maxWidth: isDesktop ? 800 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  commissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: isDesktop ? 60 : SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  commissionBannerText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.info,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  revenueCard: {
    backgroundColor: COLORS.primary,
    marginVertical: SPACING.md,
    marginHorizontal: isDesktop ? 60 : SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.md,
  },
  revenueLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  revenueAmount: {
    fontSize: TYPOGRAPHY.sizes['4xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  revenueGrowth: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.lg,
  },
  progressContainer: {
    marginTop: SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: isDesktop ? 60 : SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.xs,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  salesList: {
    padding: SPACING.md,
    paddingHorizontal: isDesktop ? 60 : SPACING.md,
  },
  saleCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.xs,
  },
  saleCardUrgent: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  urgentText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#92400E',
    marginLeft: SPACING.sm,
  },
  saleOrderId: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  saleProduct: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  productImage: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: SPACING.md,
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
  actionButton: {
    flex: 1,
  },
  modalContent: {
    paddingBottom: SPACING.lg,
  },
  modalOrderId: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  modalProductName: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  addressCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  addressLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  addressName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  modalLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  radioText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  modalInfo: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  modalHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    justifyContent: 'center',
    marginBottom: 4,
  },
  inputText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
  },
  inputHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginBottom: SPACING.md,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    marginBottom: SPACING.md,
  },
  dropdownText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
  },
  tipBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  tipText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
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
});
