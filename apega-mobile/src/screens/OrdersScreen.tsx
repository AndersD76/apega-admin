import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavigation, Tab, Button } from '../components';
import { getPurchases, type Order as ApiOrder } from '../services/orders';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;

type NormalizedStatus = 'pending' | 'in_transit' | 'delivered';

export default function OrdersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 768;
  const isTablet = isWeb && width > 480 && width <= 768;
  const [activeTab, setActiveTab] = useState<string>('all');
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'all', label: 'todos' },
    { id: 'pending', label: 'aguardando' },
    { id: 'transit', label: 'em transito' },
    { id: 'delivered', label: 'entregues' },
  ];

  const normalizeStatus = (status: ApiOrder['status']): NormalizedStatus => {
    if (status === 'in_transit' || status === 'shipped') {
      return 'in_transit';
    }
    if (status === 'delivered' || status === 'completed') {
      return 'delivered';
    }
    return 'pending';
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPurchases();
      if (response.orders) {
        setOrders(response.orders);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    const normalized = normalizeStatus(order.status);
    if (activeTab === 'pending') return normalized === 'pending';
    if (activeTab === 'transit') return normalized === 'in_transit';
    if (activeTab === 'delivered') return normalized === 'delivered';
    return true;
  });

  const getStatusLabel = (status: ApiOrder['status']) => {
    switch (normalizeStatus(status)) {
      case 'pending':
        return 'aguardando envio';
      case 'in_transit':
        return 'em transito';
      case 'delivered':
        return 'entregue';
      default:
        return 'aguardando envio';
    }
  };

  const getStatusColor = (status: ApiOrder['status']) => {
    switch (normalizeStatus(status)) {
      case 'pending':
        return COLORS.warning;
      case 'in_transit':
        return COLORS.info || '#3B82F6';
      case 'delivered':
        return COLORS.success;
      default:
        return COLORS.warning;
    }
  };

  const renderOrderCard = (order: ApiOrder) => (
    <TouchableOpacity
      key={order.id}
      style={[styles.orderCard, isDesktop && { padding: SPACING.lg }]}
      onPress={() => console.log('Order details', order.id)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <Text style={[styles.orderId, isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }]}>
          pedido #{order.order_number || order.id}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(order.status) },
              isDesktop && { fontSize: TYPOGRAPHY.sizes.sm },
            ]}
          >
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderProduct}>
        {order.product_image ? (
          <Image
            source={{ uri: order.product_image }}
            style={[styles.productImage, isDesktop && { width: 80, height: 80 }]}
          />
        ) : (
          <View style={[styles.productImage, isDesktop && { width: 80, height: 80 }]}>
            <Ionicons name="image" size={isDesktop ? 40 : 32} color={COLORS.textTertiary} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }]}>
            {order.product_title}
          </Text>
          {order.product_size && (
            <Text style={[styles.productSize, isDesktop && { fontSize: TYPOGRAPHY.sizes.base }]}>
              tamanho {order.product_size}
            </Text>
          )}
          <Text style={[styles.sellerName, isDesktop && { fontSize: TYPOGRAPHY.sizes.base }]}>
            vendedor: {order.seller_name || '---'}
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={[styles.orderDate, isDesktop && { fontSize: TYPOGRAPHY.sizes.sm }]}
          >
            {new Date(order.created_at).toLocaleDateString('pt-BR')}
          </Text>
          <Text style={[styles.orderAmount, isDesktop && { fontSize: TYPOGRAPHY.sizes.xl }]}
          >
            R$ {(order.total_amount || order.product_price || 0).toFixed(2)}
          </Text>
        </View>
        {normalizeStatus(order.status) === 'in_transit' && order.shipping_code && (
          <Button
            label="rastrear"
            variant="secondary"
            size="small"
            onPress={() => console.log('Track', order.shipping_code)}
          />
        )}
        {normalizeStatus(order.status) === 'delivered' && (
          <Button
            label="avaliar"
            variant="primary"
            size="small"
            onPress={() => navigation.navigate('Reviews' as any)}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
        <View style={{ width: 40 }} />
      </View>

      <Tab items={tabs} activeTab={activeTab} onTabPress={setActiveTab} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: isDesktop ? 60 : isTablet ? 40 : SPACING.md,
            maxWidth: isDesktop ? 800 : isTablet ? 600 : '100%',
          },
        ]}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.emptySubtitle}>carregando pedidos...</Text>
          </View>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={isDesktop ? 80 : 64} color={COLORS.textTertiary} />
            <Text style={[styles.emptyTitle, isDesktop && { fontSize: TYPOGRAPHY.sizes.xl }]}>nenhum pedido</Text>
            <Text style={[styles.emptySubtitle, isDesktop && { fontSize: TYPOGRAPHY.sizes.base }]}
            >
              seus pedidos aparecem aqui
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Profile" />
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  content: {
    padding: SPACING.md,
    alignSelf: 'center',
    width: '100%',
  },
  orderCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.xs,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  orderId: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  orderProduct: {
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
    marginBottom: 2,
  },
  productSize: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  sellerName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  orderAmount: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
