import React, { useCallback, useEffect, useState } from 'react';
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
  Platform,
  useWindowDimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Header, MainHeader, Modal } from '../components';
import api from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

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
  delivery_range: {
    min: number;
    max: number;
  };
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
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 900;
  const { item } = route.params;

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
    if (numPrice === undefined || numPrice === null || Number.isNaN(numPrice)) return 'R$ 0,00';
    return `R$ ${numPrice.toFixed(2).replace('.', ',')}`;
  };

  const paymentMethods: PaymentMethodOption[] = [
    { id: 'pix', name: 'PIX', detail: 'Pagamento instantaneo', icon: 'qr-code' },
    { id: 'card', name: 'Cartao', detail: 'Ate 12x', icon: 'card' },
    { id: 'boleto', name: 'Boleto', detail: 'Vencimento em 3 dias', icon: 'barcode' },
  ];

  const loadAddresses = useCallback(async () => {
    try {
      const response = await api.get('/addresses');
      if (response.success && response.addresses) {
        setAddresses(response.addresses);
        const defaultAddr = response.addresses.find((a: Address) => a.is_default);
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        else if (response.addresses.length > 0) setSelectedAddressId(response.addresses[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar enderecos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
        if (response.options.length > 0) {
          const cheapest = response.options.reduce((prev: ShippingOption, curr: ShippingOption) =>
            parseFloat(curr.price) < parseFloat(prev.price) ? curr : prev
          );
          setSelectedShipping(cheapest);
        }
      }
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
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
    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    if (selectedAddress?.zipcode) {
      calculateShipping(selectedAddress.zipcode);
    }
  }, [selectedAddressId, addresses, calculateShipping]);

  const subtotal = item?.price || 0;
  const shippingPrice = selectedShipping ? parseFloat(selectedShipping.price) : 15;
  const total = subtotal + shippingPrice;
  const cashback = subtotal * 0.05;

  const handlePayment = async () => {
    if (!selectedAddressId) {
      Alert.alert('Erro', 'Selecione um endereco de entrega');
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
        shipping_option: selectedShipping ? {
          name: selectedShipping.name,
          deliveryTime: selectedShipping.delivery_range?.max,
        } : undefined,
      };

      switch (selectedPayment) {
        case 'pix':
          response = await api.post('/checkout/pix', paymentData);
          if (response.success && response.payment) {
            const qrCode = response.payment.pix_qr_code || response.payment.qrCode;
            const qrCodeBase64 = response.payment.pix_qr_code_base64 || response.payment.qrCodeBase64;
            setPixData({ qr_code: qrCode, qr_code_base64: qrCodeBase64 });
            setShowPixModal(true);
          }
          break;
        case 'card':
          Alert.alert('Cartao', 'Pagamento via cartao sera integrado ao Mercado Pago.');
          break;
        case 'boleto':
          response = await api.post('/checkout/boleto', paymentData);
          if (response.success && response.payment) {
            const boletoUrl = response.payment.boleto_url || response.payment.boletoUrl;
            setBoletoData({ barcode: response.payment.barcode, url: boletoUrl });
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

  const copyPixCode = async () => {
    if (pixData?.qr_code) {
      await Clipboard.setStringAsync(pixData.qr_code);
      Alert.alert('Copiado', 'Codigo PIX copiado');
    }
  };

  const copyBoletoCode = async () => {
    if (boletoData?.barcode) {
      await Clipboard.setStringAsync(boletoData.barcode);
      Alert.alert('Copiado', 'Codigo de barras copiado');
    }
  };

  const openBoletoUrl = () => {
    if (boletoData?.url) {
      Linking.openURL(boletoData.url);
    }
  };

  const finishOrder = () => {
    setShowPixModal(false);
    setShowBoletoModal(false);
    Alert.alert(
      'Pedido realizado',
      `Seu pedido de "${item?.title}" foi realizado. Cashback: ${formatPrice(cashback)}.`,
      [
        { text: 'Ver pedidos', onPress: () => navigation.navigate('Profile') },
        { text: 'Voltar ao inicio', onPress: () => navigation.navigate('Home'), style: 'cancel' },
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {isWeb ? (
        <MainHeader navigation={navigation} title="Checkout" />
      ) : (
        <Header navigation={navigation} title="Checkout" />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Produto</Text>
          <View style={styles.productCard}>
            {item?.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
            ) : (
              <View style={styles.productImage} />
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productBrand}>{item?.brand || 'Marca'}</Text>
              <Text style={styles.productTitle} numberOfLines={2}>{item?.title}</Text>
              <Text style={styles.productPrice}>{formatPrice(item?.price)}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Endereco</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddAddress' as any)}>
              <Text style={styles.sectionAction}>Adicionar</Text>
            </TouchableOpacity>
          </View>
          {addresses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="location-outline" size={32} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>Nenhum endereco cadastrado</Text>
            </View>
          ) : (
            addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[styles.optionCard, selectedAddressId === address.id && styles.optionCardActive]}
                onPress={() => setSelectedAddressId(address.id)}
              >
                <Ionicons
                  name={selectedAddressId === address.id ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selectedAddressId === address.id ? COLORS.primary : COLORS.textTertiary}
                />
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{address.name || 'Endereco'}</Text>
                  <Text style={styles.optionText}>{address.street}, {address.number}</Text>
                  <Text style={styles.optionText}>{address.neighborhood} - {address.city}/{address.state}</Text>
                  <Text style={styles.optionText}>CEP: {address.zipcode}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Frete</Text>
          {loadingShipping ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingInlineText}>Calculando frete...</Text>
            </View>
          ) : shippingOptions.length > 0 ? (
            shippingOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, selectedShipping?.id === option.id && styles.optionCardActive]}
                onPress={() => setSelectedShipping(option)}
              >
                <Ionicons
                  name={selectedShipping?.id === option.id ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selectedShipping?.id === option.id ? COLORS.primary : COLORS.textTertiary}
                />
                {option.company.picture ? (
                  <Image source={{ uri: option.company.picture }} style={styles.shippingLogo} />
                ) : null}
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>{option.name}</Text>
                  <Text style={styles.optionText}>
                    {option.delivery_range.min === option.delivery_range.max
                      ? `${option.delivery_range.min} dias`
                      : `${option.delivery_range.min} a ${option.delivery_range.max} dias`}
                  </Text>
                </View>
                <Text style={styles.optionPrice}>{formatPrice(option.price)}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.optionCard}>
              <Ionicons name="cube-outline" size={20} color={COLORS.textSecondary} />
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Frete padrao</Text>
                <Text style={styles.optionText}>5 a 10 dias</Text>
              </View>
              <Text style={styles.optionPrice}>{formatPrice(15)}</Text>
            </View>
          )}
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Pagamento</Text>
          {paymentMethods.map((payment) => (
            <TouchableOpacity
              key={payment.id}
              style={[styles.optionCard, selectedPayment === payment.id && styles.optionCardActive]}
              onPress={() => setSelectedPayment(payment.id)}
            >
              <Ionicons
                name={selectedPayment === payment.id ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={selectedPayment === payment.id ? COLORS.primary : COLORS.textTertiary}
              />
              <Ionicons name={payment.icon} size={20} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>{payment.name}</Text>
                <Text style={styles.optionText}>{payment.detail}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Resumo</Text>
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
              <Text style={styles.summaryLabel}>Cashback</Text>
              <Text style={styles.summaryValue}>+ {formatPrice(cashback)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>{formatPrice(total)}</Text>
        </View>
        <Button
          label={processing ? 'Processando...' : 'finalizar pedido'}
          variant="primary"
          onPress={handlePayment}
          disabled={processing || !selectedAddressId}
          fullWidth
        />
      </View>

      <Modal visible={showPixModal} onClose={() => setShowPixModal(false)} title="Pagamento PIX">
        <View style={styles.modalContent}>
          {pixData?.qr_code_base64 && (
            <Image source={{ uri: `data:image/png;base64,${pixData.qr_code_base64}` }} style={styles.qrCode} />
          )}
          <Text style={styles.modalText}>Escaneie o QR Code ou copie o codigo abaixo.</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText} numberOfLines={2}>{pixData?.qr_code}</Text>
          </View>
          <Button label="Copiar codigo" variant="secondary" onPress={copyPixCode} fullWidth />
          <Button label="Ja paguei" variant="primary" onPress={finishOrder} fullWidth style={{ marginTop: SPACING.sm }} />
        </View>
      </Modal>

      <Modal visible={showBoletoModal} onClose={() => setShowBoletoModal(false)} title="Boleto">
        <View style={styles.modalContent}>
          <Ionicons name="barcode-outline" size={48} color={COLORS.primary} />
          <Text style={styles.modalText}>Boleto gerado.</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText} numberOfLines={2}>{boletoData?.barcode}</Text>
          </View>
          <Button label="Copiar codigo" variant="secondary" onPress={copyBoletoCode} fullWidth />
          <Button label="Visualizar boleto" variant="secondary" onPress={openBoletoUrl} fullWidth style={{ marginTop: SPACING.sm }} />
          <Button label="Concluir" variant="primary" onPress={finishOrder} fullWidth style={{ marginTop: SPACING.sm }} />
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  content: {
    paddingBottom: SPACING.xl,
  },
  section: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  sectionDesktop: {
    maxWidth: 840,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionAction: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.xs,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  productInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  productBrand: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
  },
  productTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: 4,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  optionCardActive: {
    borderColor: COLORS.primary,
  },
  optionInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  optionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  optionPrice: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  shippingLogo: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: 6,
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  loadingInlineText: {
    marginLeft: SPACING.sm,
    color: COLORS.textSecondary,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  footer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  footerLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  footerTotal: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  modalContent: {
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  modalText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  codeBox: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    width: '100%',
  },
  codeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
