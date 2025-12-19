import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  ActivityIndicator,
  Linking,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Modal } from '../components';
import api from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

interface Address {
  id: number;
  name: string;
  recipient_name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  is_default?: boolean;
}

interface ShippingOption {
  id: number;
  name: string;
  company: {
    id: number;
    name: string;
    picture: string;
  };
  price: string;
  custom_price: string;
  delivery_range: {
    min: number;
    max: number;
  };
  currency: string;
}

type PaymentMethod = 'pix' | 'card' | 'boleto';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  detail: string;
  icon: 'qr-code' | 'card' | 'barcode';
}

export default function CheckoutScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { item } = route.params;

  // States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('pix');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null);
  const [showBoletoModal, setShowBoletoModal] = useState(false);
  const [boletoData, setBoletoData] = useState<{ barcode: string; url: string } | null>(null);

  const formatPrice = (price: number | string | undefined) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (numPrice === undefined || numPrice === null || isNaN(numPrice)) return 'R$ 0,00';
    return `R$ ${numPrice.toFixed(2).replace('.', ',')}`;
  };

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'pix',
      name: 'PIX',
      detail: 'Pagamento instantâneo',
      icon: 'qr-code',
    },
    {
      id: 'card',
      name: 'Cartão de Crédito',
      detail: 'Até 12x sem juros',
      icon: 'card',
    },
    {
      id: 'boleto',
      name: 'Boleto Bancário',
      detail: 'Vencimento em 3 dias úteis',
      icon: 'barcode',
    },
  ];

  // Load addresses
  const loadAddresses = useCallback(async () => {
    try {
      const response = await api.get('/addresses');
      if (response.success && response.addresses) {
        setAddresses(response.addresses);
        // Select default address
        const defaultAddr = response.addresses.find((a: Address) => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (response.addresses.length > 0) {
          setSelectedAddressId(response.addresses[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate shipping when address changes
  const calculateShipping = useCallback(async (zipcode: string) => {
    if (!zipcode || !item?.id) return;

    setLoadingShipping(true);
    try {
      const response = await api.post('/shipping/calculate', {
        product_id: item.id,
        to_zipcode: zipcode.replace(/\D/g, ''),
      });

      if (response.success && response.options) {
        setShippingOptions(response.options);
        // Select cheapest option by default
        if (response.options.length > 0) {
          const cheapest = response.options.reduce((prev: ShippingOption, curr: ShippingOption) =>
            parseFloat(curr.price) < parseFloat(prev.price) ? curr : prev
          );
          setSelectedShipping(cheapest);
        }
      }
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      // Fallback to fixed shipping
      setShippingOptions([]);
      setSelectedShipping(null);
    } finally {
      setLoadingShipping(false);
    }
  }, [item?.id]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (selectedAddress?.zipcode) {
      calculateShipping(selectedAddress.zipcode);
    }
  }, [selectedAddressId, addresses, calculateShipping]);

  // Calculate totals
  const subtotal = item?.price || 0;
  const shippingPrice = selectedShipping ? parseFloat(selectedShipping.price) : 15.00;
  const total = subtotal + shippingPrice;
  const cashback = subtotal * 0.05; // 5% cashback

  // Handle payment
  const handlePayment = async () => {
    if (!selectedAddressId) {
      Alert.alert('Erro', 'Selecione um endereço de entrega');
      return;
    }

    setProcessing(true);

    try {
      let response;
      const paymentData = {
        product_id: item?.id,
        address_id: selectedAddressId,
        shipping_service_id: selectedShipping?.id,
        shipping_price: shippingPrice,
      };

      switch (selectedPayment) {
        case 'pix':
          response = await api.post('/checkout/pix', paymentData);
          if (response.success && response.payment) {
            setPixData({
              qr_code: response.payment.pix_qr_code,
              qr_code_base64: response.payment.pix_qr_code_base64,
            });
            setShowPixModal(true);
          }
          break;

        case 'card':
          // Para cartão, redirecionar para uma tela de cartão ou usar SDK do Mercado Pago
          Alert.alert(
            'Cartão de Crédito',
            'Funcionalidade de cartão será implementada com o SDK do Mercado Pago',
            [{ text: 'OK' }]
          );
          break;

        case 'boleto':
          response = await api.post('/checkout/boleto', paymentData);
          if (response.success && response.payment) {
            setBoletoData({
              barcode: response.payment.barcode,
              url: response.payment.boleto_url,
            });
            setShowBoletoModal(true);
          }
          break;
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  };

  // Copy PIX code
  const copyPixCode = () => {
    if (pixData?.qr_code) {
      Clipboard.setString(pixData.qr_code);
      Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência');
    }
  };

  // Copy Boleto barcode
  const copyBoletoCode = () => {
    if (boletoData?.barcode) {
      Clipboard.setString(boletoData.barcode);
      Alert.alert('Copiado!', 'Código de barras copiado para a área de transferência');
    }
  };

  // Open Boleto URL
  const openBoletoUrl = () => {
    if (boletoData?.url) {
      Linking.openURL(boletoData.url);
    }
  };

  // Finish order after payment
  const finishOrder = () => {
    setShowPixModal(false);
    setShowBoletoModal(false);
    Alert.alert(
      'Pedido Realizado!',
      `Seu pedido de "${item?.title}" foi realizado com sucesso!\n\nVocê ganhará ${formatPrice(cashback)} de cashback após a confirmação do pagamento!`,
      [
        {
          text: 'Ver Pedidos',
          onPress: () => navigation.navigate('Profile'),
        },
        {
          text: 'Voltar ao Início',
          onPress: () => navigation.navigate('Home'),
          style: 'cancel',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Product Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>seu produto</Text>
          <View style={styles.productCard}>
            {item?.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImage, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]} />
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productBrand}>{item?.brand || 'Marca'}</Text>
              <Text style={styles.productTitle} numberOfLines={2}>
                {item?.title}
              </Text>
              <Text style={styles.productPrice}>{formatPrice(item?.price)}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>endereço de entrega</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddAddress' as any)}>
              <Text style={styles.addButton}>+ adicionar</Text>
            </TouchableOpacity>
          </View>

          {addresses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="location-outline" size={32} color={COLORS.gray[400]} />
              <Text style={styles.emptyText}>Nenhum endereço cadastrado</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AddAddress' as any)}>
                <Text style={styles.addButton}>Adicionar endereço</Text>
              </TouchableOpacity>
            </View>
          ) : (
            addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[
                  styles.addressCard,
                  selectedAddressId === address.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedAddressId(address.id)}
              >
                <View style={styles.radioContainer}>
                  <Ionicons
                    name={selectedAddressId === address.id ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selectedAddressId === address.id ? COLORS.primary : COLORS.gray[400]}
                  />
                </View>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressName}>
                    {address.name || 'Endereço'}
                    {address.is_default && (
                      <Text style={styles.defaultBadge}> (padrão)</Text>
                    )}
                  </Text>
                  <Text style={styles.addressText}>
                    {address.street}, {address.number}
                    {address.complement ? ` - ${address.complement}` : ''}
                  </Text>
                  <Text style={styles.addressText}>
                    {address.neighborhood} - {address.city}/{address.state}
                  </Text>
                  <Text style={styles.addressText}>CEP: {address.zipcode}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Shipping Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>opções de frete</Text>

          {loadingShipping ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingShippingText}>Calculando frete...</Text>
            </View>
          ) : shippingOptions.length > 0 ? (
            shippingOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.shippingCard,
                  selectedShipping?.id === option.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedShipping(option)}
              >
                <View style={styles.radioContainer}>
                  <Ionicons
                    name={selectedShipping?.id === option.id ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selectedShipping?.id === option.id ? COLORS.primary : COLORS.gray[400]}
                  />
                </View>
                {option.company.picture && (
                  <Image
                    source={{ uri: option.company.picture }}
                    style={styles.shippingLogo}
                  />
                )}
                <View style={styles.shippingInfo}>
                  <Text style={styles.shippingName}>{option.name}</Text>
                  <Text style={styles.shippingDetail}>
                    {option.delivery_range.min === option.delivery_range.max
                      ? `${option.delivery_range.min} dias úteis`
                      : `${option.delivery_range.min} a ${option.delivery_range.max} dias úteis`}
                  </Text>
                </View>
                <Text style={styles.shippingPrice}>{formatPrice(option.price)}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.fixedShippingCard}>
              <Ionicons name="cube-outline" size={24} color={COLORS.textSecondary} />
              <View style={styles.shippingInfo}>
                <Text style={styles.shippingName}>Frete Padrão</Text>
                <Text style={styles.shippingDetail}>5 a 10 dias úteis</Text>
              </View>
              <Text style={styles.shippingPrice}>{formatPrice(15)}</Text>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>forma de pagamento</Text>

          {paymentMethods.map((payment) => (
            <TouchableOpacity
              key={payment.id}
              style={[
                styles.paymentCard,
                selectedPayment === payment.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedPayment(payment.id)}
            >
              <View style={styles.radioContainer}>
                <Ionicons
                  name={selectedPayment === payment.id ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedPayment === payment.id ? COLORS.primary : COLORS.gray[400]}
                />
              </View>
              <Ionicons
                name={payment.icon}
                size={24}
                color={COLORS.textSecondary}
                style={styles.paymentIcon}
              />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>{payment.name}</Text>
                <Text style={styles.paymentDetail}>{payment.detail}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>resumo do pedido</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frete</Text>
              <Text style={styles.summaryValue}>{formatPrice(shippingPrice)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.cashbackLabel}>
                <Ionicons name="arrow-undo" size={14} /> Cashback (5%)
              </Text>
              <Text style={styles.cashbackValue}>+ {formatPrice(cashback)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>{formatPrice(total)}</Text>
        </View>
        <Button
          label={processing ? 'Processando...' : 'finalizar pedido'}
          variant="primary"
          onPress={handlePayment}
          disabled={processing || !selectedAddressId}
          style={styles.checkoutButton}
        />
      </View>

      {/* PIX Modal */}
      <Modal
        visible={showPixModal}
        onClose={() => setShowPixModal(false)}
        title="Pagamento PIX"
      >
        <View style={styles.modalContent}>
          {pixData?.qr_code_base64 && (
            <Image
              source={{ uri: `data:image/png;base64,${pixData.qr_code_base64}` }}
              style={styles.qrCode}
            />
          )}
          <Text style={styles.modalText}>
            Escaneie o QR Code acima ou copie o código PIX abaixo:
          </Text>
          <View style={styles.pixCodeContainer}>
            <Text style={styles.pixCode} numberOfLines={2}>
              {pixData?.qr_code}
            </Text>
          </View>
          <Button
            label="Copiar código PIX"
            variant="secondary"
            onPress={copyPixCode}
            style={styles.modalButton}
          />
          <Button
            label="Já fiz o pagamento"
            variant="primary"
            onPress={finishOrder}
            style={styles.modalButton}
          />
        </View>
      </Modal>

      {/* Boleto Modal */}
      <Modal
        visible={showBoletoModal}
        onClose={() => setShowBoletoModal(false)}
        title="Boleto Bancário"
      >
        <View style={styles.modalContent}>
          <Ionicons name="barcode-outline" size={64} color={COLORS.primary} />
          <Text style={styles.modalText}>
            Seu boleto foi gerado com sucesso!
          </Text>
          <Text style={styles.modalSubtext}>
            Vencimento: 3 dias úteis
          </Text>
          <View style={styles.boletoCodeContainer}>
            <Text style={styles.boletoCode} numberOfLines={2}>
              {boletoData?.barcode}
            </Text>
          </View>
          <Button
            label="Copiar código de barras"
            variant="secondary"
            onPress={copyBoletoCode}
            style={styles.modalButton}
          />
          <Button
            label="Visualizar boleto"
            variant="secondary"
            onPress={openBoletoUrl}
            style={styles.modalButton}
          />
          <Button
            label="Concluir"
            variant="primary"
            onPress={finishOrder}
            style={styles.modalButton}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.textPrimary,
  },
  content: {
    paddingBottom: SPACING.xl,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.textPrimary,
    textTransform: 'lowercase',
    marginBottom: SPACING.sm,
  },
  addButton: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.primary,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.xs,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.gray[100],
  },
  productInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  productBrand: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  productTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.primary,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.xs,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.xs,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  radioContainer: {
    marginRight: SPACING.md,
    justifyContent: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  defaultBadge: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.normal as any,
  },
  addressText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.xs,
  },
  loadingShippingText: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
  shippingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.xs,
  },
  fixedShippingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.xs,
  },
  shippingLogo: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
  },
  shippingInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  shippingName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  shippingDetail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  shippingPrice: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.primary,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.xs,
  },
  paymentIcon: {
    marginRight: SPACING.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  paymentDetail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium as any,
  },
  cashbackLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.success,
  },
  cashbackValue: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.primary,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.lg,
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  footerLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
  footerTotal: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.primary,
  },
  checkoutButton: {
    width: '100%',
  },
  modalContent: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: SPACING.lg,
  },
  modalText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  modalSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  pixCodeContainer: {
    backgroundColor: COLORS.gray[100],
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    width: '100%',
    marginBottom: SPACING.md,
  },
  pixCode: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  boletoCodeContainer: {
    backgroundColor: COLORS.gray[100],
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    width: '100%',
    marginBottom: SPACING.md,
  },
  boletoCode: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  modalButton: {
    width: '100%',
    marginTop: SPACING.sm,
  },
});
