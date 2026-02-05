import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows } from '../theme';
import { formatPrice } from '../utils/format';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered';

export interface OfferData {
  id: string;
  amount: number;
  status: OfferStatus;
  senderName?: string;
  productTitle?: string;
  counterAmount?: number;
  timestamp?: string;
}

interface OfferMessageProps {
  offer: OfferData;
  isMe: boolean;
  isSeller: boolean;
  onAccept?: (offerId: string) => void;
  onReject?: (offerId: string) => void;
  onCounter?: (offerId: string, newAmount: number) => void;
  onGoToCheckout?: (offerId: string, amount: number) => void;
}

export function OfferMessage({
  offer,
  isMe,
  isSeller,
  onAccept,
  onReject,
  onCounter,
  onGoToCheckout,
}: OfferMessageProps) {
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterValue, setCounterValue] = useState('');

  const getStatusColor = () => {
    switch (offer.status) {
      case 'pending':
        return colors.warning;
      case 'accepted':
        return colors.success;
      case 'rejected':
        return colors.error;
      case 'countered':
        return colors.info;
      default:
        return colors.textMuted;
    }
  };

  const getStatusBackground = () => {
    switch (offer.status) {
      case 'pending':
        return colors.warningLight;
      case 'accepted':
        return colors.successLight;
      case 'rejected':
        return colors.errorLight;
      case 'countered':
        return colors.infoLight;
      default:
        return colors.gray100;
    }
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (offer.status) {
      case 'pending':
        return 'time-outline';
      case 'accepted':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'countered':
        return 'swap-horizontal';
      default:
        return 'help-circle-outline';
    }
  };

  const getStatusText = () => {
    switch (offer.status) {
      case 'pending':
        return 'Aguardando resposta';
      case 'accepted':
        return 'Oferta aceita!';
      case 'rejected':
        return 'Oferta recusada';
      case 'countered':
        return 'Contra-proposta';
      default:
        return '';
    }
  };

  const handleCounterSubmit = () => {
    const numericValue = parseInt(counterValue.replace(/[^0-9]/g, ''), 10);
    if (numericValue > 0 && onCounter) {
      onCounter(offer.id, numericValue);
      setCounterValue('');
      setShowCounterModal(false);
    }
  };

  const formatInputValue = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    const num = parseInt(numericValue, 10);
    return num.toLocaleString('pt-BR');
  };

  return (
    <View style={[styles.container, isMe ? styles.containerMe : styles.containerThem]}>
      <View style={[styles.card, { borderColor: getStatusColor() }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: getStatusBackground() }]}>
          <Ionicons name="cash-outline" size={18} color={getStatusColor()} />
          <Text style={[styles.headerTitle, { color: getStatusColor() }]}>
            Proposta de valor
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Main offer message */}
          <Text style={styles.offerText}>
            {isMe ? (
              <>Voce ofereceu <Text style={styles.offerAmount}>R$ {formatPrice(offer.amount)}</Text></>
            ) : (
              <>
                <Text style={styles.senderName}>{offer.senderName || 'Comprador'}</Text>
                {' ofereceu '}
                <Text style={styles.offerAmount}>R$ {formatPrice(offer.amount)}</Text>
                {offer.productTitle && (
                  <Text style={styles.productRef}> pela peca</Text>
                )}
              </>
            )}
          </Text>

          {/* Counter offer display */}
          {offer.status === 'countered' && offer.counterAmount && (
            <View style={styles.counterInfo}>
              <Ionicons name="arrow-forward" size={16} color={colors.info} />
              <Text style={styles.counterText}>
                Contra-proposta: <Text style={styles.counterAmount}>R$ {formatPrice(offer.counterAmount)}</Text>
              </Text>
            </View>
          )}

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusBackground() }]}>
            <Ionicons name={getStatusIcon()} size={14} color={getStatusColor()} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>

          {/* Action Buttons for Seller */}
          {!isMe && isSeller && offer.status === 'pending' && (
            <View style={styles.actionsContainer}>
              <Pressable
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={() => onAccept?.(offer.id)}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.acceptBtnText}>Aceitar</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => onReject?.(offer.id)}
              >
                <Ionicons name="close" size={16} color={colors.error} />
                <Text style={styles.rejectBtnText}>Recusar</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, styles.counterBtn]}
                onPress={() => setShowCounterModal(true)}
              >
                <Ionicons name="swap-horizontal" size={16} color={colors.info} />
                <Text style={styles.counterBtnText}>Contra-proposta</Text>
              </Pressable>
            </View>
          )}

          {/* Checkout Button for Accepted Offers */}
          {offer.status === 'accepted' && (
            <Pressable
              style={styles.checkoutBtn}
              onPress={() => onGoToCheckout?.(offer.id, offer.counterAmount || offer.amount)}
            >
              <Ionicons name="bag-check-outline" size={18} color="#fff" />
              <Text style={styles.checkoutBtnText}>
                Ir para checkout - R$ {formatPrice(offer.counterAmount || offer.amount)}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Timestamp */}
        {offer.timestamp && (
          <Text style={styles.timestamp}>{offer.timestamp}</Text>
        )}
      </View>

      {/* Counter Offer Modal */}
      <Modal
        visible={showCounterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCounterModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowCounterModal(false)}
          />

          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contra-proposta</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setShowCounterModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              A oferta atual e de R$ {formatPrice(offer.amount)}
            </Text>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalCurrencyPrefix}>R$</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={formatInputValue(counterValue)}
                onChangeText={(text) => setCounterValue(text.replace(/[^0-9]/g, ''))}
                maxLength={10}
                autoFocus
              />
            </View>

            <Pressable
              style={[
                styles.modalSubmitBtn,
                !counterValue && styles.modalSubmitBtnDisabled,
              ]}
              onPress={handleCounterSubmit}
              disabled={!counterValue}
            >
              <Ionicons name="swap-horizontal" size={18} color="#fff" />
              <Text style={styles.modalSubmitBtnText}>Enviar contra-proposta</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '85%',
    marginBottom: 12,
  },
  containerMe: {
    alignSelf: 'flex-end',
  },
  containerThem: {
    alignSelf: 'flex-start',
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    overflow: 'hidden',
    ...shadows.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },

  content: {
    padding: 14,
  },

  offerText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  senderName: {
    fontWeight: '600',
    color: colors.text,
  },
  offerAmount: {
    fontWeight: '700',
    color: colors.primary,
    fontSize: 17,
  },
  productRef: {
    color: colors.textSecondary,
  },

  counterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginTop: 10,
    gap: 8,
  },
  counterText: {
    fontSize: 14,
    color: colors.info,
  },
  counterAmount: {
    fontWeight: '700',
    color: colors.info,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    marginTop: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Action Buttons
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    gap: 6,
  },
  acceptBtn: {
    backgroundColor: colors.success,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  rejectBtn: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.error,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  counterBtn: {
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: colors.info,
  },
  counterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.info,
  },

  // Checkout Button
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: 14,
    gap: 8,
    ...shadows.sm,
  },
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  modalCurrencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  modalInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    padding: 0,
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.info,
    borderRadius: radius.lg,
    paddingVertical: 14,
    gap: 8,
    ...shadows.sm,
  },
  modalSubmitBtnDisabled: {
    backgroundColor: colors.gray300,
  },
  modalSubmitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default OfferMessage;
