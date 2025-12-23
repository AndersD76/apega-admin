import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';

const isWeb = Platform.OS === 'web';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button } from '../components';
import { api, loadToken } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Payments'>;

interface PaymentMethod {
  id: string;
  type: 'credit' | 'debit' | 'pix';
  brand?: string;
  last_digits?: string;
  holder_name?: string;
  card_brand?: string;
  card_last_four?: string;
  card_holder_name?: string;
  card_expiry?: string;
  is_default: boolean;
  pix_key?: string;
  pix_key_type?: string;
}

export default function PaymentsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 768;
  const styles = useMemo(() => createStyles(isDesktop), [isDesktop]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showCardModal, setShowCardModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Card form
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');

  // PIX form
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'email' | 'phone' | 'random'>('cpf');

  // Load payment methods from API
  const loadPayments = async () => {
    try {
      await loadToken();
      const response = await api.get<{ payments: PaymentMethod[] }>('/payments');

      if (response.success && response.payments) {
        const mapped = response.payments.map((payment) => ({
          ...payment,
          brand: payment.brand || payment.card_brand,
          last_digits: payment.last_digits || payment.card_last_four,
          holder_name: payment.holder_name || payment.card_holder_name,
        }));
        setPayments(mapped);
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/payments/${id}/default`);
      setPayments(payments.map(p => ({
        ...p,
        is_default: p.id === id,
      })));
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível definir como padrão');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Remover pagamento',
      'Tem certeza que deseja remover esta forma de pagamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/payments/${id}`);
              setPayments(payments.filter(p => p.id !== id));
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover');
            }
          },
        },
      ]
    );
  };

  // Format card number with spaces
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format expiry date MM/YY
  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  // Detect card brand from number
  const getCardBrand = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'Amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
    if (/^(636368|438935|504175|451416|509048|509067|509049|509069|509050|509074|509068|509040|509045|509051|509046|509066|509047|509042|509052|509043|509064|509040)/.test(cleaned)) return 'Elo';
    if (/^(606282|3841)/.test(cleaned)) return 'Hipercard';
    return 'Outro';
  };

  // Reset card form
  const resetCardForm = () => {
    setCardNumber('');
    setCardHolder('');
    setCardExpiry('');
    setCardCvv('');
    setCardType('credit');
  };

  // Reset PIX form
  const resetPixForm = () => {
    setPixKey('');
    setPixKeyType('cpf');
  };

  // Validate and save card
  const handleSaveCard = async () => {
    const cleanNumber = cardNumber.replace(/\D/g, '');

    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      Alert.alert('Erro', 'Número do cartão inválido');
      return;
    }
    if (!cardHolder.trim()) {
      Alert.alert('Erro', 'Preencha o nome no cartão');
      return;
    }
    if (cardExpiry.length !== 5) {
      Alert.alert('Erro', 'Data de validade inválida');
      return;
    }
    if (cardCvv.length < 3) {
      Alert.alert('Erro', 'CVV inválido');
      return;
    }

    // Validate expiry date
    const [month, year] = cardExpiry.split('/');
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(`20${year}`, 10);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (expMonth < 1 || expMonth > 12) {
      Alert.alert('Erro', 'Mês de validade inválido');
      return;
    }
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      Alert.alert('Erro', 'Cartão vencido');
      return;
    }

    setSaving(true);
    try {
      await loadToken();
      const response = await api.post('/payments', {
        type: cardType,
        card_brand: getCardBrand(cleanNumber),
        card_last_four: cleanNumber.slice(-4),
        card_holder_name: cardHolder.trim().toUpperCase(),
        card_expiry: cardExpiry,
      });

      if (response.success) {
        Alert.alert('Sucesso', 'Cartão cadastrado!');
        setShowCardModal(false);
        resetCardForm();
        loadPayments();
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível cadastrar o cartão');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao cadastrar cartão');
    } finally {
      setSaving(false);
    }
  };

  // Format PIX key based on type
  const formatPixKey = (text: string, type: string) => {
    if (type === 'cpf') {
      const cleaned = text.replace(/\D/g, '').slice(0, 11);
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
      if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    }
    if (type === 'phone') {
      const cleaned = text.replace(/\D/g, '').slice(0, 11);
      if (cleaned.length <= 2) return cleaned;
      if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return text;
  };

  // Validate and save PIX
  const handleSavePix = async () => {
    const cleanKey = pixKey.replace(/[\.\-\(\)\s]/g, '');

    if (!cleanKey.trim()) {
      Alert.alert('Erro', 'Preencha a chave PIX');
      return;
    }

    // Validate based on type
    if (pixKeyType === 'cpf' && cleanKey.length !== 11) {
      Alert.alert('Erro', 'CPF inválido');
      return;
    }
    if (pixKeyType === 'phone' && cleanKey.length !== 11) {
      Alert.alert('Erro', 'Telefone inválido');
      return;
    }
    if (pixKeyType === 'email' && !cleanKey.includes('@')) {
      Alert.alert('Erro', 'E-mail inválido');
      return;
    }

    setSaving(true);
    try {
      await loadToken();
      const response = await api.post('/payments', {
        type: 'pix',
        pix_key: cleanKey.toLowerCase(),
        pix_key_type: pixKeyType,
      });

      if (response.success) {
        Alert.alert('Sucesso', 'Chave PIX cadastrada!');
        setShowPixModal(false);
        resetPixForm();
        loadPayments();
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível cadastrar a chave PIX');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao cadastrar PIX');
    } finally {
      setSaving(false);
    }
  };

  const getBrandIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa': return 'card';
      case 'mastercard': return 'card';
      default: return 'card-outline';
    }
  };

  const getPixKeyTypeLabel = (type?: string) => {
    switch (type) {
      case 'cpf': return 'CPF';
      case 'email': return 'E-mail';
      case 'phone': return 'Telefone';
      case 'random': return 'Chave aleatória';
      default: return 'PIX';
    }
  };

  const renderPaymentCard = (payment: PaymentMethod) => (
    <View key={payment.id} style={[styles.paymentCard, payment.is_default && styles.defaultCard]}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentIcon}>
          <Ionicons
            name={payment.type === 'pix' ? 'qr-code' : getBrandIcon(payment.brand || payment.card_brand)}
            size={24}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.paymentInfo}>
          {payment.type === 'pix' ? (
            <>
              <Text style={styles.paymentTitle}>{getPixKeyTypeLabel(payment.pix_key_type)}</Text>
              <Text style={styles.paymentDetail}>{payment.pix_key}</Text>
            </>
          ) : (
            <>
              <Text style={styles.paymentTitle}>
                {(payment.brand || payment.card_brand)} â€¢â€¢â€¢â€¢ {(payment.last_digits || payment.card_last_four)}
              </Text>
              <Text style={styles.paymentDetail}>
                {(payment.holder_name || payment.card_holder_name)} â€¢ {payment.type === 'credit' ? 'Crédito' : 'Débito'}
              </Text>
            </>
          )}
        </View>
        {payment.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>padrão</Text>
          </View>
        )}
      </View>

      <View style={styles.paymentActions}>
        {!payment.is_default && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(payment.id)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionText}>definir como padrão</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(payment.id)}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text style={[styles.actionText, { color: COLORS.error }]}>remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Card Modal
  const renderCardModal = () => (
    <Modal
      visible={showCardModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowCardModal(false);
        resetCardForm();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalHeader, { paddingTop: insets.top + SPACING.sm }]}>
          <TouchableOpacity onPress={() => { setShowCardModal(false); resetCardForm(); }}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>adicionar cartão</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Card Type Selector */}
          <Text style={styles.inputLabel}>tipo do cartão</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeOption, cardType === 'credit' && styles.typeOptionActive]}
              onPress={() => setCardType('credit')}
            >
              <Ionicons
                name="card"
                size={20}
                color={cardType === 'credit' ? COLORS.white : COLORS.textSecondary}
              />
              <Text style={[styles.typeOptionText, cardType === 'credit' && styles.typeOptionTextActive]}>
                Crédito
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, cardType === 'debit' && styles.typeOptionActive]}
              onPress={() => setCardType('debit')}
            >
              <Ionicons
                name="card-outline"
                size={20}
                color={cardType === 'debit' ? COLORS.white : COLORS.textSecondary}
              />
              <Text style={[styles.typeOptionText, cardType === 'debit' && styles.typeOptionTextActive]}>
                Débito
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card Number */}
          <Text style={styles.inputLabel}>número do cartão</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={COLORS.textTertiary}
              value={cardNumber}
              onChangeText={formatCardNumber}
              keyboardType="numeric"
              maxLength={19}
            />
            {cardNumber.length >= 4 && (
              <Text style={styles.brandLabel}>{getCardBrand(cardNumber)}</Text>
            )}
          </View>

          {/* Card Holder */}
          <Text style={styles.inputLabel}>nome no cartão</Text>
          <TextInput
            style={styles.input}
            placeholder="NOME COMO ESTÀ NO CARTÀƒO"
            placeholderTextColor={COLORS.textTertiary}
            value={cardHolder}
            onChangeText={setCardHolder}
            autoCapitalize="characters"
          />

          {/* Expiry and CVV */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>validade</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/AA"
                placeholderTextColor={COLORS.textTertiary}
                value={cardExpiry}
                onChangeText={formatExpiry}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>cvv</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor={COLORS.textTertiary}
                value={cardCvv}
                onChangeText={(t) => setCardCvv(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          {/* Security Info */}
          <View style={styles.securityNote}>
            <Ionicons name="lock-closed" size={16} color={COLORS.success} />
            <Text style={styles.securityNoteText}>
              Seus dados são criptografados e transmitidos com segurança
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { paddingBottom: insets.bottom + SPACING.md }]}>
          <Button
            label={saving ? 'salvando...' : 'salvar cartão'}
            onPress={handleSaveCard}
            fullWidth
            disabled={saving}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // PIX Modal
  const renderPixModal = () => (
    <Modal
      visible={showPixModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowPixModal(false);
        resetPixForm();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalHeader, { paddingTop: insets.top + SPACING.sm }]}>
          <TouchableOpacity onPress={() => { setShowPixModal(false); resetPixForm(); }}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>cadastrar chave pix</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* PIX Key Type Selector */}
          <Text style={styles.inputLabel}>tipo da chave</Text>
          <View style={styles.pixTypeGrid}>
            {(['cpf', 'email', 'phone', 'random'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.pixTypeOption, pixKeyType === type && styles.pixTypeOptionActive]}
                onPress={() => {
                  setPixKeyType(type);
                  setPixKey('');
                }}
              >
                <Ionicons
                  name={
                    type === 'cpf' ? 'person' :
                    type === 'email' ? 'mail' :
                    type === 'phone' ? 'call' : 'key'
                  }
                  size={20}
                  color={pixKeyType === type ? COLORS.white : COLORS.textSecondary}
                />
                <Text style={[styles.pixTypeText, pixKeyType === type && styles.pixTypeTextActive]}>
                  {type === 'cpf' ? 'CPF' :
                   type === 'email' ? 'E-mail' :
                   type === 'phone' ? 'Telefone' : 'Aleatória'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* PIX Key Input */}
          <Text style={styles.inputLabel}>
            {pixKeyType === 'cpf' ? 'cpf' :
             pixKeyType === 'email' ? 'e-mail' :
             pixKeyType === 'phone' ? 'telefone' : 'chave aleatória'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={
              pixKeyType === 'cpf' ? '000.000.000-00' :
              pixKeyType === 'email' ? 'seu@email.com' :
              pixKeyType === 'phone' ? '(00) 00000-0000' : 'Cole sua chave aqui'
            }
            placeholderTextColor={COLORS.textTertiary}
            value={pixKey}
            onChangeText={(t) => setPixKey(formatPixKey(t, pixKeyType))}
            keyboardType={
              pixKeyType === 'cpf' || pixKeyType === 'phone' ? 'numeric' :
              pixKeyType === 'email' ? 'email-address' : 'default'
            }
            autoCapitalize="none"
          />

          {/* PIX Info */}
          <View style={styles.pixInfo}>
            <View style={styles.pixInfoItem}>
              <Ionicons name="flash" size={20} color={COLORS.primary} />
              <Text style={styles.pixInfoText}>Receba pagamentos instantaneamente</Text>
            </View>
            <View style={styles.pixInfoItem}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
              <Text style={styles.pixInfoText}>Transações seguras e protegidas</Text>
            </View>
            <View style={styles.pixInfoItem}>
              <Ionicons name="time" size={20} color={COLORS.warning} />
              <Text style={styles.pixInfoText}>Disponível 24h, 7 dias por semana</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { paddingBottom: insets.bottom + SPACING.md }]}>
          <Button
            label={saving ? 'salvando...' : 'cadastrar chave'}
            onPress={handleSavePix}
            fullWidth
            disabled={saving}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
        <Text style={styles.headerTitle}>formas de pagamento</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Cards Section */}
          <Text style={styles.sectionTitle}>cartões</Text>
          {payments.filter(p => p.type !== 'pix').length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="card-outline" size={32} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>Nenhum cartão cadastrado</Text>
            </View>
          ) : (
            payments.filter(p => p.type !== 'pix').map(renderPaymentCard)
          )}

          <Button
            label="adicionar cartão"
            variant="secondary"
            icon={<Ionicons name="add" size={20} color={COLORS.primary} />}
            onPress={() => setShowCardModal(true)}
            fullWidth
            style={{ marginBottom: SPACING.lg }}
          />

          {/* PIX Section */}
          <Text style={styles.sectionTitle}>pix</Text>
          {payments.filter(p => p.type === 'pix').length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="qr-code-outline" size={32} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>Nenhuma chave PIX cadastrada</Text>
            </View>
          ) : (
            payments.filter(p => p.type === 'pix').map(renderPaymentCard)
          )}

          <Button
            label="cadastrar chave pix"
            variant="secondary"
            icon={<Ionicons name="add" size={20} color={COLORS.primary} />}
            onPress={() => setShowPixModal(true)}
            fullWidth
          />

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
            <Text style={styles.infoText}>
              Seus dados de pagamento são criptografados e armazenados com segurança
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Modals */}
      {renderCardModal()}
      {renderPixModal()}
    </View>
  );
}

const createStyles = (isDesktop: boolean) => StyleSheet.create({
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
    padding: SPACING.md,
    paddingHorizontal: isDesktop ? 60 : SPACING.md,
    maxWidth: isDesktop ? 700 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  emptySection: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  paymentCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.xs,
  },
  defaultCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  paymentDetail: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  defaultBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.xs,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  modalFooter: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
    textTransform: 'lowercase',
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    paddingRight: SPACING.md,
  },
  brandLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
  },
  typeOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeOptionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  typeOptionTextActive: {
    color: COLORS.white,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: '#E8F5E9',
    borderRadius: BORDER_RADIUS.md,
  },
  securityNoteText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  // PIX styles
  pixTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  pixTypeOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
  },
  pixTypeOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pixTypeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  pixTypeTextActive: {
    color: COLORS.white,
  },
  pixInfo: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  pixInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
  },
  pixInfoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
});







