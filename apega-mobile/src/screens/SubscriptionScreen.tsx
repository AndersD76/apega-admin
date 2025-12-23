import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, SUBSCRIPTION_PLANS, FEES } from '../constants/theme';
import { Modal, Button } from '../components';
import api from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 768;

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

type PaymentMethod = 'pix' | 'boleto';

export default function SubscriptionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showBoletoModal, setShowBoletoModal] = useState(false);
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null);
  const [boletoData, setBoletoData] = useState<{ barcode: string; url: string } | null>(null);

  const premiumPlan = SUBSCRIPTION_PLANS.premium;
  const monthlyPrice = premiumPlan.price;
  const yearlyPrice = premiumPlan.priceYearly;
  const monthlyFromYearly = (yearlyPrice / 12).toFixed(2);
  const savingsPercent = Math.round((1 - (yearlyPrice / 12) / monthlyPrice) * 100);

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const handleSubscribe = () => {
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    setLoading(true);
    setShowPaymentModal(false);

    try {
      const endpoint = paymentMethod === 'pix' ? '/subscriptions/pix' : '/subscriptions/boleto';
      const response = await api.post(endpoint, { plan: selectedPlan });

      if (response.success && response.payment) {
        if (paymentMethod === 'pix') {
          setPixData({
            qr_code: response.payment.pix_qr_code,
            qr_code_base64: response.payment.pix_qr_code_base64,
          });
          setShowPixModal(true);
        } else {
          setBoletoData({
            barcode: response.payment.barcode,
            url: response.payment.boleto_url,
          });
          setShowBoletoModal(true);
        }
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (pixData?.qr_code) {
      await Clipboard.setStringAsync(pixData.qr_code);
      Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência');
    }
  };

  const copyBoletoCode = async () => {
    if (boletoData?.barcode) {
      await Clipboard.setStringAsync(boletoData.barcode);
      Alert.alert('Copiado!', 'Código de barras copiado para a área de transferência');
    }
  };

  const finishPayment = () => {
    setShowPixModal(false);
    setShowBoletoModal(false);
    Alert.alert(
      'Pagamento Iniciado!',
      'Assim que o pagamento for confirmado, sua assinatura Premium será ativada automaticamente.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Gerenciar Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Header */}
        <View style={[styles.header, { paddingTop: 20 }]}>

          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="star" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.headerTitle}>seja premium</Text>
            <Text style={styles.headerSubtitle}>
              acesso completo a peças exclusivas e benefícios especiais
            </Text>
          </View>
        </View>

        {/* Plan Toggle */}
        <View style={styles.planToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedPlan === 'monthly' && styles.toggleButtonActive,
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Text
              style={[
                styles.toggleText,
                selectedPlan === 'monthly' && styles.toggleTextActive,
              ]}
            >
              mensal
            </Text>
            <Text
              style={[
                styles.togglePrice,
                selectedPlan === 'monthly' && styles.togglePriceActive,
              ]}
            >
              R$ {monthlyPrice.toFixed(2).replace('.', ',')}/mês
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedPlan === 'yearly' && styles.toggleButtonActive,
            ]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>ECONOMIZE {savingsPercent}%</Text>
            </View>
            <Text
              style={[
                styles.toggleText,
                selectedPlan === 'yearly' && styles.toggleTextActive,
              ]}
            >
              anual
            </Text>
            <Text
              style={[
                styles.togglePrice,
                selectedPlan === 'yearly' && styles.togglePriceActive,
              ]}
            >
              R$ {yearlyPrice.toFixed(2).replace('.', ',')}/ano
            </Text>
            <Text
              style={[
                styles.toggleSubtext,
                selectedPlan === 'yearly' && styles.toggleSubtextActive,
              ]}
            >
              (R$ {monthlyFromYearly.replace('.', ',')}/mês)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>tudo que você ganha:</Text>

          {premiumPlan.features.map((feature, index) => (
            <View key={index} style={styles.benefitItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              </View>
              <Text style={styles.benefitText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
            onPress={handleSubscribe}
            activeOpacity={0.9}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Text style={styles.subscribeButtonText}>
                  assinar {selectedPlan === 'monthly' ? 'mensal' : 'anual'}
                </Text>
                <Text style={styles.subscribeButtonPrice}>
                  {formatPrice(selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice)}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            cancele quando quiser. sem taxas de cancelamento.
          </Text>
        </View>

        {/* Comparison */}
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>compare os planos</Text>

          <View style={styles.comparisonTable}>
            {/* Header */}
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonLabel}>recursos</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonHeader}>gratuito</Text>
              </View>
              <View style={[styles.comparisonCell, styles.premiumColumn]}>
                <Text style={[styles.comparisonHeader, styles.premiumText]}>
                  premium
                </Text>
              </View>
            </View>

            {/* Rows */}
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonFeature}>anúncios</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonValue}>até 5</Text>
              </View>
              <View style={[styles.comparisonCell, styles.premiumColumn]}>
                <Text style={[styles.comparisonValue, styles.premiumText]}>
                  ilimitados
                </Text>
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonFeature}>fotos por peça</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonValue}>3 fotos</Text>
              </View>
              <View style={[styles.comparisonCell, styles.premiumColumn]}>
                <Text style={[styles.comparisonValue, styles.premiumText]}>
                  10 fotos
                </Text>
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonFeature}>peças exclusivas</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonValue}>✕</Text>
              </View>
              <View style={[styles.comparisonCell, styles.premiumColumn]}>
                <Text style={[styles.comparisonValue, styles.premiumText]}>
                  ✓
                </Text>
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonFeature}>taxas de venda</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonValue}>{FEES.commissionPercentage}%</Text>
              </View>
              <View style={[styles.comparisonCell, styles.premiumColumn]}>
                <Text style={[styles.comparisonValue, styles.premiumText]}>
                  {FEES.premiumCommissionPercentage}%
                </Text>
              </View>
            </View>

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonFeature}>destaque</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonValue}>✕</Text>
              </View>
              <View style={[styles.comparisonCell, styles.premiumColumn]}>
                <Text style={[styles.comparisonValue, styles.premiumText]}>
                  ✓
                </Text>
              </View>
            </View>

            <View style={[styles.comparisonRow, { borderBottomWidth: 0 }]}>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonFeature}>suporte prioritário</Text>
              </View>
              <View style={styles.comparisonCell}>
                <Text style={styles.comparisonValue}>✕</Text>
              </View>
              <View style={[styles.comparisonCell, styles.premiumColumn]}>
                <Text style={[styles.comparisonValue, styles.premiumText]}>
                  ✓
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
          <Text style={styles.infoText}>
            pagamento seguro via PIX ou boleto. sua assinatura pode ser cancelada a qualquer momento.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Forma de pagamento"
      >
        <View style={styles.paymentModalContent}>
          <Text style={styles.paymentModalSubtitle}>
            {selectedPlan === 'monthly' ? 'Assinatura Mensal' : 'Assinatura Anual'} - {formatPrice(selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice)}
          </Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'pix' && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod('pix')}
          >
            <View style={styles.paymentOptionRadio}>
              <Ionicons
                name={paymentMethod === 'pix' ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={paymentMethod === 'pix' ? COLORS.premium : COLORS.gray[400]}
              />
            </View>
            <Ionicons name="qr-code" size={28} color={COLORS.textSecondary} />
            <View style={styles.paymentOptionInfo}>
              <Text style={styles.paymentOptionTitle}>PIX</Text>
              <Text style={styles.paymentOptionSubtitle}>Aprovação instantânea</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'boleto' && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod('boleto')}
          >
            <View style={styles.paymentOptionRadio}>
              <Ionicons
                name={paymentMethod === 'boleto' ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={paymentMethod === 'boleto' ? COLORS.premium : COLORS.gray[400]}
              />
            </View>
            <Ionicons name="barcode" size={28} color={COLORS.textSecondary} />
            <View style={styles.paymentOptionInfo}>
              <Text style={styles.paymentOptionTitle}>Boleto Bancário</Text>
              <Text style={styles.paymentOptionSubtitle}>Vencimento em 3 dias úteis</Text>
            </View>
          </TouchableOpacity>

          <Button
            label="Continuar"
            variant="primary"
            onPress={processPayment}
            style={styles.paymentModalButton}
          />
        </View>
      </Modal>

      {/* PIX Modal */}
      <Modal
        visible={showPixModal}
        onClose={() => setShowPixModal(false)}
        title="Pagamento PIX"
      >
        <View style={styles.pixModalContent}>
          {pixData?.qr_code_base64 && (
            <Image
              source={{ uri: `data:image/png;base64,${pixData.qr_code_base64}` }}
              style={styles.qrCode}
            />
          )}
          <Text style={styles.pixModalText}>
            Escaneie o QR Code acima ou copie o código PIX:
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
            style={styles.pixModalButton}
          />
          <Button
            label="Já fiz o pagamento"
            variant="primary"
            onPress={finishPayment}
            style={styles.pixModalButton}
          />
        </View>
      </Modal>

      {/* Boleto Modal */}
      <Modal
        visible={showBoletoModal}
        onClose={() => setShowBoletoModal(false)}
        title="Boleto Bancário"
      >
        <View style={styles.boletoModalContent}>
          <Ionicons name="barcode-outline" size={64} color={COLORS.premium} />
          <Text style={styles.boletoModalText}>
            Seu boleto foi gerado com sucesso!
          </Text>
          <Text style={styles.boletoModalSubtext}>
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
            style={styles.boletoModalButton}
          />
          <Button
            label="Concluir"
            variant="primary"
            onPress={finishPayment}
            style={styles.boletoModalButton}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerBarTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1a1a1a',
  },
  header: {
    backgroundColor: COLORS.premium,
    paddingHorizontal: isDesktop ? 60 : SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  backButton: {
    marginBottom: SPACING.md,
    padding: SPACING.xs,
    alignSelf: 'flex-start',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes['4xl'],
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
    maxWidth: 300,
  },
  planToggle: {
    flexDirection: 'row',
    padding: SPACING.md,
    paddingHorizontal: isDesktop ? 60 : SPACING.md,
    gap: SPACING.md,
    maxWidth: isDesktop ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  toggleButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  toggleButtonActive: {
    borderColor: COLORS.premium,
    backgroundColor: COLORS.premiumLight,
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: SPACING.sm,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  saveBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold as any,
  },
  toggleText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium as any,
    marginBottom: SPACING.xs,
  },
  toggleTextActive: {
    color: COLORS.premiumDark,
  },
  togglePrice: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.textPrimary,
  },
  togglePriceActive: {
    color: COLORS.premiumDark,
  },
  toggleSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  toggleSubtextActive: {
    color: COLORS.premiumDark,
  },
  benefitsSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    marginVertical: SPACING.md,
    marginHorizontal: isDesktop ? 60 : SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    maxWidth: isDesktop ? 600 : '100%',
    alignSelf: 'center',
    width: isDesktop ? '100%' : undefined,
    ...SHADOWS.md,
  },
  benefitsTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.premium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  benefitText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  ctaSection: {
    padding: SPACING.lg,
    paddingHorizontal: isDesktop ? 60 : SPACING.lg,
    maxWidth: isDesktop ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  subscribeButton: {
    backgroundColor: COLORS.premium,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    marginBottom: SPACING.xs,
  },
  subscribeButtonPrice: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.extrabold as any,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  comparisonSection: {
    padding: SPACING.lg,
  },
  comparisonTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  comparisonTable: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  comparisonCell: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumColumn: {
    backgroundColor: COLORS.premiumLight,
  },
  comparisonLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium as any,
  },
  comparisonHeader: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.textPrimary,
  },
  comparisonFeature: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    textAlign: 'left',
  },
  comparisonValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  premiumText: {
    color: COLORS.premiumDark,
    fontWeight: TYPOGRAPHY.weights.bold as any,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.md,
    ...SHADOWS.xs,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // Payment Modal Styles
  paymentModalContent: {
    paddingVertical: SPACING.md,
  },
  paymentModalSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  paymentOptionActive: {
    borderColor: COLORS.premium,
    backgroundColor: COLORS.premiumLight,
  },
  paymentOptionRadio: {
    marginRight: SPACING.xs,
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.textPrimary,
  },
  paymentOptionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  paymentModalButton: {
    marginTop: SPACING.md,
  },
  // PIX Modal Styles
  pixModalContent: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: SPACING.lg,
  },
  pixModalText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
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
  pixModalButton: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  // Boleto Modal Styles
  boletoModalContent: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  boletoModalText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  boletoModalSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
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
  boletoModalButton: {
    width: '100%',
    marginTop: SPACING.sm,
  },
});
