import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { formatPrice } from '../utils/format';
import { addressesService, shippingService, Address, ShippingOption } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const PAYMENT_METHODS = [
  { id: 'pix', name: 'PIX', icon: 'qr-code-outline', desc: 'Aprovacao instantanea' },
  { id: 'credit', name: 'Cartao de Credito', icon: 'card-outline', desc: 'Ate 12x sem juros' },
];

export function CheckoutScreen({ route, navigation }: any) {
  const { product } = route.params || {};
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState('1');
  const [loading, setLoading] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

  // Use product from route or fallback to mock
  const productData = product || {
    id: '1',
    title: 'Vestido Floral Farm',
    price: 189,
    image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
    images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400'],
  };

  const productImage = productData.images?.[0]?.image_url || productData.images?.[0] || productData.image_url || productData.image || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400';
  const subtotal = typeof productData.price === 'string' ? parseFloat(productData.price) : (productData.price || 189);
  const shipping = selectedShipping?.price || 0;
  const total = subtotal + shipping;

  // Fetch default address when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchDefaultAddress();
      } else {
        setLoadingAddress(false);
      }
    }, [isAuthenticated])
  );

  // Calculate shipping when address changes
  useEffect(() => {
    if (address?.zipcode && productData.id) {
      calculateShipping();
    }
  }, [address?.zipcode, productData.id]);

  const fetchDefaultAddress = async () => {
    setLoadingAddress(true);
    try {
      const response = await addressesService.getDefaultAddress();
      if (response.success && response.address) {
        setAddress(response.address);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    } finally {
      setLoadingAddress(false);
    }
  };

  const calculateShipping = async () => {
    if (!address?.zipcode) return;

    setLoadingShipping(true);
    try {
      const response = await shippingService.calculateForProduct(productData.id, address.zipcode) as any;
      const options = response.services || response.options || [];
      if (response.success && options.length > 0) {
        setShippingOptions(options);
        // Select cheapest by default
        if (response.cheapest) {
          setSelectedShipping(response.cheapest);
        } else if (options.length > 0) {
          setSelectedShipping(options[0]);
        }
      } else {
        // Fallback to fixed shipping if calculation fails
        setSelectedShipping({
          id: 0,
          name: 'Frete Padrao',
          price: 25,
          currency: 'BRL',
          delivery_time: 7,
          delivery_range: { min: 5, max: 10 },
          company: { id: 0, name: 'Padrao', picture: '' },
          packages: []
        } as ShippingOption);
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      // Fallback to fixed shipping
      setSelectedShipping({
        id: 0,
        name: 'Frete Padrao',
        price: 25,
        currency: 'BRL',
        delivery_time: 7,
        delivery_range: { min: 5, max: 10 },
        company: { id: 0, name: 'Padrao', picture: '' },
        packages: []
      } as ShippingOption);
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleChangeAddress = () => {
    navigation.navigate('Addresses');
  };

  const handleConfirmPayment = async () => {
    if (!address) {
      Alert.alert('Endereco necessario', 'Adicione um endereco de entrega para continuar');
      return;
    }

    if (!selectedShipping) {
      Alert.alert('Frete necessario', 'Aguarde o calculo do frete ou selecione uma opcao');
      return;
    }

    if (paymentMethod === 'credit') {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        Alert.alert('Dados incompletos', 'Preencha todos os dados do cartao');
        return;
      }
    }

    setLoading(true);

    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Pedido Confirmado!',
        'Seu pedido foi realizado com sucesso. Voce recebera atualizacoes por email.',
        [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
      );
    }, 2000);
  };

  const canConfirm = address && selectedShipping && !loadingShipping;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Pagamento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
          <View style={styles.orderItem}>
            <Image source={{ uri: productImage }} style={styles.orderItemImg} contentFit="cover" />
            <View style={styles.orderItemInfo}>
              <Text style={styles.orderItemTitle} numberOfLines={1}>{productData.title}</Text>
              <Text style={styles.orderItemPrice}>R$ {formatPrice(subtotal)}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Endereco de Entrega</Text>
            <Pressable onPress={handleChangeAddress}>
              <Text style={styles.changeLink}>Alterar</Text>
            </Pressable>
          </View>
          {loadingAddress ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando endereco...</Text>
            </View>
          ) : address ? (
            <View style={styles.addressCard}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressStreet}>{address.street}, {address.number}</Text>
                <Text style={styles.addressCity}>
                  {address.neighborhood}, {address.city} - {address.state}
                </Text>
                <Text style={styles.addressZip}>CEP: {address.zipcode}</Text>
              </View>
            </View>
          ) : (
            <Pressable style={styles.addAddressBtn} onPress={handleChangeAddress}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.addAddressText}>Adicionar endereco de entrega</Text>
            </Pressable>
          )}
        </View>

        {/* Shipping Options */}
        {address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opcoes de Frete</Text>
            {loadingShipping ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Calculando frete...</Text>
              </View>
            ) : shippingOptions.length > 0 ? (
              shippingOptions.slice(0, 3).map((option) => (
                <Pressable
                  key={option.id}
                  style={[styles.shippingOption, selectedShipping?.id === option.id && styles.shippingOptionActive]}
                  onPress={() => setSelectedShipping(option)}
                >
                  <View style={styles.shippingRadio}>
                    {selectedShipping?.id === option.id && <View style={styles.shippingRadioInner} />}
                  </View>
                  <View style={styles.shippingInfo}>
                    <Text style={styles.shippingName}>{option.company?.name || option.name}</Text>
                    <Text style={styles.shippingTime}>
                      {option.delivery_range?.min === option.delivery_range?.max
                        ? `${option.delivery_range?.min} dias uteis`
                        : `${option.delivery_range?.min}-${option.delivery_range?.max} dias uteis`}
                    </Text>
                  </View>
                  <Text style={styles.shippingPrice}>R$ {formatPrice(option.price)}</Text>
                </Pressable>
              ))
            ) : selectedShipping ? (
              <View style={styles.shippingOption}>
                <Ionicons name="cube-outline" size={20} color={colors.primary} />
                <View style={styles.shippingInfo}>
                  <Text style={styles.shippingName}>{selectedShipping.name}</Text>
                  <Text style={styles.shippingTime}>{selectedShipping.delivery_range?.min}-{selectedShipping.delivery_range?.max} dias uteis</Text>
                </View>
                <Text style={styles.shippingPrice}>R$ {formatPrice(selectedShipping.price)}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
          {PAYMENT_METHODS.map((method) => (
            <Pressable
              key={method.id}
              style={[styles.paymentOption, paymentMethod === method.id && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <View style={styles.paymentRadio}>
                {paymentMethod === method.id && <View style={styles.paymentRadioInner} />}
              </View>
              <Ionicons name={method.icon as any} size={24} color={paymentMethod === method.id ? colors.primary : '#525252'} />
              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentName, paymentMethod === method.id && styles.paymentNameActive]}>
                  {method.name}
                </Text>
                <Text style={styles.paymentDesc}>{method.desc}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Credit Card Form */}
        {paymentMethod === 'credit' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dados do Cartão</Text>
            <View style={styles.cardForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Número do Cartão</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#A3A3A3"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome no Cartão</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Como está no cartão"
                  placeholderTextColor="#A3A3A3"
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Validade</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/AA"
                    placeholderTextColor="#A3A3A3"
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="000"
                    placeholderTextColor="#A3A3A3"
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Parcelas</Text>
                <Pressable style={styles.selectInput}>
                  <Text style={styles.selectText}>{installments}x de R$ {formatPrice(total / parseInt(installments))} sem juros</Text>
                  <Ionicons name="chevron-down" size={20} color="#737373" />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* PIX Info */}
        {paymentMethod === 'pix' && (
          <View style={styles.section}>
            <View style={styles.pixInfo}>
              <Ionicons name="flash" size={24} color={colors.primary} />
              <Text style={styles.pixText}>
                Ao confirmar, você receberá um QR Code para pagamento instantâneo
              </Text>
            </View>
          </View>
        )}

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valores</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>R$ {formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Frete</Text>
            {loadingShipping ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.priceValue}>R$ {formatPrice(shipping)}</Text>
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R$ {formatPrice(total)}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={handleConfirmPayment} disabled={loading || !canConfirm}>
          <LinearGradient
            colors={canConfirm ? [colors.primary, colors.primaryDark] : ['#A3A3A3', '#8A8A8A']}
            style={styles.confirmBtn}
          >
            {loading ? (
              <Text style={styles.confirmBtnText}>Processando...</Text>
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.confirmBtnText}>
                  {!address ? 'Adicione um endereco' : !selectedShipping ? 'Calculando frete...' : 'Confirmar Pagamento'}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
        <View style={styles.securityRow}>
          <Ionicons name="shield-checkmark" size={14} color="#737373" />
          <Text style={styles.securityText}>Pagamento 100% seguro</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { paddingHorizontal: 16 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },

  // Section
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  changeLink: { fontSize: 14, fontWeight: '500', color: colors.primary },

  // Order Item
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  orderItemImg: { width: 60, height: 60, borderRadius: 8 },
  orderItemInfo: { flex: 1, marginLeft: 12 },
  orderItemTitle: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  orderItemPrice: { fontSize: 15, fontWeight: '600', color: colors.primary, marginTop: 4 },

  // Address
  addressCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12 },
  addressInfo: { flex: 1 },
  addressStreet: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  addressCity: { fontSize: 13, color: '#737373', marginTop: 2 },
  addressZip: { fontSize: 12, color: '#A3A3A3', marginTop: 2 },
  addAddressBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E8E8E8', borderStyle: 'dashed' },
  addAddressText: { fontSize: 14, fontWeight: '500', color: colors.primary },
  loadingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, backgroundColor: '#F5F5F5', borderRadius: 12 },
  loadingText: { fontSize: 14, color: '#737373' },

  // Shipping
  shippingOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#F5F5F5', marginBottom: 8 },
  shippingOptionActive: { backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary },
  shippingRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D4D4D4', alignItems: 'center', justifyContent: 'center' },
  shippingRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  shippingInfo: { flex: 1 },
  shippingName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  shippingTime: { fontSize: 12, color: '#737373', marginTop: 2 },
  shippingPrice: { fontSize: 15, fontWeight: '700', color: colors.primary },

  // Payment
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#F5F5F5', marginBottom: 8 },
  paymentOptionActive: { backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary },
  paymentRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D4D4D4', alignItems: 'center', justifyContent: 'center' },
  paymentRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  paymentInfo: { flex: 1 },
  paymentName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  paymentNameActive: { color: colors.primary },
  paymentDesc: { fontSize: 12, color: '#737373', marginTop: 2 },

  // Card Form
  cardForm: { gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: '#525252' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A1A' },
  inputRow: { flexDirection: 'row', gap: 12 },
  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  selectText: { fontSize: 15, color: '#1A1A1A' },

  // PIX
  pixInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primaryMuted, borderRadius: 12, padding: 14 },
  pixText: { flex: 1, fontSize: 13, color: colors.primary, lineHeight: 18 },

  // Price
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: '#737373' },
  priceValue: { fontSize: 14, color: '#1A1A1A' },
  discountLabel: { fontSize: 14, color: '#10B981' },
  discountValue: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  divider: { height: 1, backgroundColor: '#E8E8E8', marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },

  // Bottom
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  securityText: { fontSize: 12, color: '#737373' },
});

export default CheckoutScreen;
