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
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavigation, Header, MainHeader, Tab, Button } from '../components';
import { getPurchases, type Order as ApiOrder } from '../services/orders';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;

type NormalizedStatus = 'pending' | 'in_transit' | 'delivered';

export default function OrdersScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 900;

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
    if (status === 'in_transit' || status === 'shipped') return 'in_transit';
    if (status === 'delivered' || status === 'completed') return 'delivered';
    return 'pending';
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPurchases();
      if (response.orders) setOrders(response.orders);
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
      style={styles.orderCard}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>pedido #{order.order_number || order.id}</Text>
        <View style={[styles.statusBadge, { borderColor: getStatusColor(order.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderProduct}>
        {order.product_image ? (
          <Image source={{ uri: order.product_image }} style={styles.productImage} />
        ) : (
          <View style={styles.productImage}>
            <Ionicons name="image-outline" size={24} color={COLORS.textTertiary} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{order.product_title}</Text>
          {order.product_size && (
            <Text style={styles.productMeta}>tam {order.product_size}</Text>
          )}
          <Text style={styles.productMeta}>vendedor: {order.seller_name || '---'}</Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString('pt-BR')}</Text>
          <Text style={styles.orderAmount}>R$ {(order.total_amount || order.product_price || 0).toFixed(2)}</Text>
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
      {isWeb ? (
        <MainHeader navigation={navigation} title="Pedidos" />
      ) : (
        <Header navigation={navigation} title="Pedidos" />
      )}

      <Tab items={tabs} activeTab={activeTab} onTabPress={setActiveTab} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
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
            <Ionicons name="cube-outline" size={56} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>Nenhum pedido</Text>
            <Text style={styles.emptySubtitle}>Seus pedidos aparecem aqui.</Text>
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
  content: {
    padding: SPACING.md,
  },
  contentDesktop: {
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
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
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
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
  productMeta: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  note: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
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
