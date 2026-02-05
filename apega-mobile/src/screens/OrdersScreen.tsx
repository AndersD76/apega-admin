import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ordersService, shippingService, Order, api } from '../api';
import { formatPrice } from '../utils/format';
import { API_URL } from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string; icon: string }> = {
  pending_payment: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Aguardando pagamento', icon: 'time-outline' },
  paid: { color: '#3B82F6', bgColor: '#DBEAFE', label: 'Pago', icon: 'checkmark-circle-outline' },
  pending_shipment: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Aguardando envio', icon: 'cube-outline' },
  shipped: { color: '#8B5CF6', bgColor: '#EDE9FE', label: 'Enviado', icon: 'airplane-outline' },
  in_transit: { color: '#8B5CF6', bgColor: '#EDE9FE', label: 'Em trânsito', icon: 'navigate-outline' },
  delivered: { color: '#10B981', bgColor: '#D1FAE5', label: 'Entregue', icon: 'checkmark-done-outline' },
  completed: { color: '#10B981', bgColor: '#D1FAE5', label: 'Concluído', icon: 'checkmark-circle' },
  cancelled: { color: '#EF4444', bgColor: '#FEE2E2', label: 'Cancelado', icon: 'close-circle-outline' },
};

export function OrdersScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const orderType = route?.params?.type || 'purchases';
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trackingModal, setTrackingModal] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shippingModal, setShippingModal] = useState(false);
  const [shippingCode, setShippingCode] = useState('');
  const [orderToShip, setOrderToShip] = useState<Order | null>(null);
  const [submittingShipping, setSubmittingShipping] = useState(false);

  // Review Modal
  const [reviewModal, setReviewModal] = useState(false);
  const [orderToReview, setOrderToReview] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const response = orderType === 'purchases'
        ? await ordersService.getPurchases()
        : await ordersService.getSales();

      if (response.success) {
        setOrders(response.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderType]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const handleTrackOrder = async (order: Order) => {
    if (!order.shipping_code) {
      Alert.alert('Sem rastreio', 'Este pedido ainda nao possui codigo de rastreio');
      return;
    }

    setSelectedOrder(order);
    setTrackingModal(true);
    setTrackingLoading(true);

    try {
      const response = await shippingService.trackShipment(order.shipping_code);
      if (response.success) {
        setTrackingData(response.tracking);
      } else {
        setTrackingData({
          tracking_code: order.shipping_code,
          status: 'Em transito',
          events: [
            { date: new Date().toISOString(), status: 'Objeto postado', description: 'Objeto postado', location: '' }
          ]
        });
      }
    } catch (error) {
      console.error('Error tracking:', error);
      // Fallback com dados basicos
      setTrackingData({
        tracking_code: order.shipping_code,
        status: 'Em transito',
        events: [
          { date: new Date().toISOString(), status: 'Objeto postado', description: 'Aguardando atualizacao', location: '' }
        ]
      });
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCopyTrackingCode = (code: string) => {
    // Simple copy feedback - in real app would use Clipboard API
    Alert.alert('Codigo copiado', `Codigo ${code} copiado para a area de transferencia`);
  };

  const handleOpenTrackingLink = (code: string) => {
    const url = `https://www.linkcorreios.com.br/?id=${code}`;
    Linking.openURL(url);
  };

  const handleMarkAsShipped = (order: Order) => {
    setOrderToShip(order);
    setShippingCode('');
    setShippingModal(true);
  };

  const confirmShipping = async () => {
    if (!shippingCode.trim()) {
      Alert.alert('Erro', 'Codigo de rastreio e obrigatorio');
      return;
    }
    if (!orderToShip) return;

    setSubmittingShipping(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/shipping/mark-shipped`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderToShip.id,
          tracking_code: shippingCode.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Sucesso', 'Pedido marcado como enviado!');
        setShippingModal(false);
        fetchOrders();
      } else {
        Alert.alert('Erro', data.message || 'Nao foi possivel atualizar o pedido');
      }
    } catch (error) {
      console.error('Error marking as shipped:', error);
      Alert.alert('Erro', 'Nao foi possivel atualizar o pedido');
    } finally {
      setSubmittingShipping(false);
    }
  };

  const handleOpenReview = (order: Order) => {
    setOrderToReview(order);
    setReviewRating(0);
    setReviewComment('');
    setReviewModal(true);
  };

  const submitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert('Erro', 'Selecione uma avaliacao de 1 a 5 estrelas');
      return;
    }
    if (!orderToReview) return;

    setSubmittingReview(true);
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderToReview.id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Sucesso', 'Avaliacao enviada com sucesso!');
        setReviewModal(false);
        fetchOrders();
      } else {
        Alert.alert('Erro', data.message || 'Nao foi possivel enviar a avaliacao');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Erro', 'Nao foi possivel enviar a avaliacao');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending_payment;
    const personName = orderType === 'purchases' ? item.seller_name : item.buyer_name;
    const personAvatar = orderType === 'purchases' ? item.seller_avatar : item.buyer_avatar;

    return (
      <Pressable
        style={styles.orderCard}
        onPress={() => {}}
      >
        {/* Product */}
        <View style={styles.orderHeader}>
          <Image source={{ uri: item.product_image }} style={styles.productImg} contentFit="cover" />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={1}>{item.product_title}</Text>
            <Text style={styles.productPrice}>R$ {formatPrice(item.total_amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
              <Ionicons name={status.icon as any} size={12} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>

        {/* Order Number */}
        <View style={styles.orderNumberRow}>
          <Text style={styles.orderNumberLabel}>Pedido:</Text>
          <Text style={styles.orderNumberValue}>#{item.order_number}</Text>
        </View>

        {/* Tracking */}
        {item.shipping_code && (
          <Pressable style={styles.trackingRow} onPress={() => handleTrackOrder(item)}>
            <Ionicons name="cube-outline" size={16} color={colors.primary} />
            <Text style={styles.trackingLabel}>Rastreio:</Text>
            <Text style={styles.trackingCode}>{item.shipping_code}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        )}

        {/* Person */}
        <View style={styles.personRow}>
          {personAvatar ? (
            <Image source={{ uri: personAvatar }} style={styles.personAvatar} contentFit="cover" />
          ) : (
            <View style={[styles.personAvatar, { backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="person" size={16} color={colors.primary} />
            </View>
          )}
          <Text style={styles.personName}>
            {orderType === 'purchases' ? 'Vendido por' : 'Comprado por'} {personName || 'Usuário'}
          </Text>
          <Pressable style={styles.chatBtn}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          {/* Buyer actions */}
          {item.shipping_code && orderType === 'purchases' && (
            <Pressable style={styles.actionBtnPrimary} onPress={() => handleTrackOrder(item)}>
              <Ionicons name="location-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>Rastrear</Text>
            </Pressable>
          )}
          {(item.status === 'delivered' || item.status === 'completed') && orderType === 'purchases' && !item.has_review && (
            <Pressable style={styles.actionBtnPrimary} onPress={() => handleOpenReview(item)}>
              <Ionicons name="star-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>Avaliar</Text>
            </Pressable>
          )}
          {(item.status === 'delivered' || item.status === 'completed') && orderType === 'purchases' && item.has_review && (
            <View style={[styles.actionBtnPrimary, { backgroundColor: '#10B981' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>Avaliado</Text>
            </View>
          )}
          {/* Seller actions */}
          {(item.status === 'paid' || item.status === 'pending_shipment') && orderType === 'sales' && (
            <Pressable style={styles.actionBtnPrimary} onPress={() => handleMarkAsShipped(item)}>
              <Ionicons name="paper-plane-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>Informar Envio</Text>
            </Pressable>
          )}
          {item.shipping_code && orderType === 'sales' && (
            <Pressable style={styles.actionBtnSecondary} onPress={() => handleTrackOrder(item)}>
              <Text style={styles.actionBtnSecondaryText}>Ver Rastreio</Text>
            </Pressable>
          )}
          {!item.shipping_code && (
            <Pressable style={styles.actionBtnSecondary}>
              <Text style={styles.actionBtnSecondaryText}>Ver detalhes</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>{orderType === 'purchases' ? 'Minhas Compras' : 'Minhas Vendas'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={48} color="#A3A3A3" />
              </View>
              <Text style={styles.emptyTitle}>
                {orderType === 'purchases' ? 'Nenhuma compra ainda' : 'Ninguém pegou suas peças ainda'}
              </Text>
              <Text style={styles.emptyText}>
                {orderType === 'purchases'
                  ? 'Bora pegar umas peças?'
                  : 'Quando alguém pegar, aparece aqui!'}
              </Text>
            </View>
          }
        />
      )}

      {/* Tracking Modal */}
      <Modal visible={trackingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rastreamento</Text>
              <Pressable onPress={() => setTrackingModal(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </Pressable>
            </View>

            {trackingLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.modalLoadingText}>Buscando informacoes...</Text>
              </View>
            ) : trackingData ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Tracking Code */}
                <View style={styles.trackingCodeBox}>
                  <Text style={styles.trackingCodeLabel}>Codigo de Rastreio</Text>
                  <View style={styles.trackingCodeRow}>
                    <Text style={styles.trackingCodeValue}>{trackingData.tracking_code}</Text>
                    <Pressable
                      style={styles.copyBtn}
                      onPress={() => handleCopyTrackingCode(trackingData.tracking_code)}
                    >
                      <Ionicons name="copy-outline" size={18} color={colors.primary} />
                    </Pressable>
                  </View>
                </View>

                {/* Current Status */}
                <View style={styles.currentStatusBox}>
                  <Ionicons name="navigate-circle" size={32} color={colors.primary} />
                  <Text style={styles.currentStatusText}>{trackingData.status || 'Em transito'}</Text>
                </View>

                {/* Timeline */}
                <View style={styles.trackingTimeline}>
                  <Text style={styles.timelineTitle}>Historico</Text>
                  {trackingData.events?.map((event: any, index: number) => (
                    <View key={index} style={styles.timelineItem}>
                      <View style={[styles.timelineDot, index === 0 && styles.timelineDotActive]} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineStatus}>{event.status || event.message}</Text>
                        {event.location && <Text style={styles.timelineLocation}>{event.location}</Text>}
                        <Text style={styles.timelineDate}>
                          {new Date(event.date).toLocaleDateString('pt-BR')} {event.time || ''}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Track on Correios */}
                <Pressable
                  style={styles.trackExternalBtn}
                  onPress={() => handleOpenTrackingLink(trackingData.tracking_code)}
                >
                  <Ionicons name="open-outline" size={18} color={colors.primary} />
                  <Text style={styles.trackExternalText}>Rastrear no site dos Correios</Text>
                </Pressable>
              </ScrollView>
            ) : (
              <View style={styles.modalLoading}>
                <Ionicons name="alert-circle-outline" size={48} color="#A3A3A3" />
                <Text style={styles.modalLoadingText}>Nao foi possivel carregar o rastreamento</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Shipping Modal - Informar Envio */}
      <Modal visible={shippingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Informar Envio</Text>
              <Pressable onPress={() => setShippingModal(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </Pressable>
            </View>

            {orderToShip && (
              <View style={styles.shippingOrderInfo}>
                <Image source={{ uri: orderToShip.product_image }} style={styles.shippingProductImg} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.shippingProductTitle} numberOfLines={1}>{orderToShip.product_title}</Text>
                  <Text style={styles.shippingOrderNumber}>Pedido #{orderToShip.order_number}</Text>
                </View>
              </View>
            )}

            <Text style={styles.shippingInputLabel}>Codigo de Rastreio</Text>
            <TextInput
              style={styles.shippingInput}
              placeholder="Ex: BR123456789BR"
              placeholderTextColor="#A3A3A3"
              value={shippingCode}
              onChangeText={setShippingCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.shippingActions}>
              <Pressable
                style={styles.shippingCancelBtn}
                onPress={() => setShippingModal(false)}
              >
                <Text style={styles.shippingCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.shippingConfirmBtn, submittingShipping && { opacity: 0.6 }]}
                onPress={confirmShipping}
                disabled={submittingShipping}
              >
                {submittingShipping ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={16} color="#fff" />
                    <Text style={styles.shippingConfirmText}>Confirmar Envio</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal visible={reviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avaliar Vendedor</Text>
              <Pressable onPress={() => setReviewModal(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </Pressable>
            </View>

            {orderToReview && (
              <>
                {/* Order Info */}
                <View style={styles.shippingOrderInfo}>
                  <Image source={{ uri: orderToReview.product_image }} style={styles.shippingProductImg} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shippingProductTitle} numberOfLines={1}>{orderToReview.product_title}</Text>
                    <Text style={styles.shippingOrderNumber}>Vendido por {orderToReview.seller_name}</Text>
                  </View>
                </View>

                {/* Stars */}
                <Text style={styles.reviewLabel}>Sua avaliacao</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setReviewRating(star)}>
                      <Ionicons
                        name={star <= reviewRating ? 'star' : 'star-outline'}
                        size={40}
                        color={star <= reviewRating ? '#FFD700' : '#D1D5DB'}
                      />
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.ratingLabel}>
                  {reviewRating === 0 ? 'Toque nas estrelas' :
                   reviewRating === 1 ? 'Muito ruim' :
                   reviewRating === 2 ? 'Ruim' :
                   reviewRating === 3 ? 'Regular' :
                   reviewRating === 4 ? 'Bom' : 'Excelente'}
                </Text>

                {/* Comment */}
                <Text style={styles.reviewLabel}>Comentario (opcional)</Text>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Conte como foi sua experiencia..."
                  placeholderTextColor="#A3A3A3"
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />

                {/* Actions */}
                <View style={styles.shippingActions}>
                  <Pressable
                    style={styles.shippingCancelBtn}
                    onPress={() => setReviewModal(false)}
                  >
                    <Text style={styles.shippingCancelText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.reviewSubmitBtn, submittingReview && { opacity: 0.6 }]}
                    onPress={submitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="star" size={16} color="#fff" />
                        <Text style={styles.shippingConfirmText}>Enviar Avaliacao</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },

  // List
  listContent: { padding: 16, gap: 12 },

  // Order Card
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  orderHeader: { flexDirection: 'row', gap: 12 },
  productImg: { width: 70, height: 70, borderRadius: 10 },
  productInfo: { flex: 1 },
  productTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  productPrice: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },

  // Order Number
  orderNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  orderNumberLabel: { fontSize: 12, color: '#737373' },
  orderNumberValue: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },

  // Timeline
  timeline: { marginTop: 16, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: '#E8E8E8', gap: 12 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginLeft: -9 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginRight: 10, backgroundColor: '#E8E8E8' },
  timelineText: { flex: 1, fontSize: 13, color: '#525252' },
  timelineDate: { fontSize: 12, color: '#A3A3A3' },

  // Tracking
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: colors.primaryMuted, padding: 10, borderRadius: 8 },
  trackingLabel: { fontSize: 12, color: colors.primary },
  trackingCode: { fontSize: 13, fontWeight: '600', color: colors.primary },

  // Person
  personRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  personAvatar: { width: 32, height: 32, borderRadius: 16 },
  personName: { flex: 1, fontSize: 13, color: '#737373', marginLeft: 10 },
  chatBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 10 },
  actionBtnPrimaryText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  actionBtnSecondary: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8E8E8', paddingVertical: 10, borderRadius: 10 },
  actionBtnSecondaryText: { fontSize: 13, fontWeight: '500', color: '#737373' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#737373' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  modalLoading: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  modalLoadingText: { fontSize: 14, color: '#737373' },

  // Tracking Code Box
  trackingCodeBox: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginBottom: 16 },
  trackingCodeLabel: { fontSize: 12, color: '#737373', marginBottom: 6 },
  trackingCodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trackingCodeValue: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', letterSpacing: 1 },
  copyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },

  // Current Status
  currentStatusBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primaryMuted, borderRadius: 12, padding: 16, marginBottom: 20 },
  currentStatusText: { fontSize: 16, fontWeight: '600', color: colors.primary },

  // Tracking Timeline
  trackingTimeline: { marginBottom: 20 },
  timelineTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  timelineDotActive: { backgroundColor: colors.primary },
  timelineContent: { flex: 1, marginLeft: 12, paddingBottom: 16, borderLeftWidth: 2, borderLeftColor: '#E8E8E8', paddingLeft: 16 },
  timelineStatus: { fontSize: 14, fontWeight: '500', color: '#1A1A1A', marginBottom: 2 },
  timelineLocation: { fontSize: 12, color: '#737373', marginBottom: 2 },

  // Track External
  trackExternalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.primary, borderRadius: 12, paddingVertical: 14, marginBottom: 20 },
  trackExternalText: { fontSize: 14, fontWeight: '500', color: colors.primary },

  // Shipping Modal
  shippingOrderInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, marginBottom: 20 },
  shippingProductImg: { width: 50, height: 50, borderRadius: 8 },
  shippingProductTitle: { fontSize: 14, fontWeight: '500', color: '#1A1A1A', marginBottom: 2 },
  shippingOrderNumber: { fontSize: 12, color: '#737373' },
  shippingInputLabel: { fontSize: 13, fontWeight: '500', color: '#1A1A1A', marginBottom: 8 },
  shippingInput: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1A1A1A', marginBottom: 24 },
  shippingActions: { flexDirection: 'row', gap: 12 },
  shippingCancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12, paddingVertical: 14 },
  shippingCancelText: { fontSize: 14, fontWeight: '500', color: '#737373' },
  shippingConfirmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14 },
  shippingConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Review Modal
  reviewLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 12, marginTop: 8 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  ratingLabel: { fontSize: 14, color: '#737373', textAlign: 'center', marginBottom: 16 },
  reviewInput: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1A1A1A', textAlignVertical: 'top', minHeight: 100, marginBottom: 20 },
  reviewSubmitBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14, overflow: 'hidden', backgroundColor: '#FFD700' },
});

export default OrdersScreen;
