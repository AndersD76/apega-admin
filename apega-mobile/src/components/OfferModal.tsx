import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows } from '../theme';
import { formatPrice } from '../utils/format';

interface OfferModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (offerValue: number) => void;
  product: {
    title: string;
    price: number;
    image: string;
  };
}

export function OfferModal({ visible, onClose, onSubmit, product }: OfferModalProps) {
  const [offerValue, setOfferValue] = useState('');
  const [error, setError] = useState('');

  const minOffer = product.price * 0.5; // 50% do preco

  const handleOfferChange = (text: string) => {
    // Remove tudo que nao for numero
    const numericValue = text.replace(/[^0-9]/g, '');
    setOfferValue(numericValue);
    setError('');
  };

  const formatInputValue = (value: string) => {
    if (!value) return '';
    const num = parseInt(value, 10);
    return num.toLocaleString('pt-BR');
  };

  const handleSubmit = () => {
    const numericValue = parseInt(offerValue, 10);

    if (!numericValue || numericValue <= 0) {
      setError('Digite um valor valido');
      return;
    }

    if (numericValue < minOffer) {
      setError(`Oferta minima: R$ ${formatPrice(minOffer)}`);
      return;
    }

    if (numericValue > product.price) {
      Alert.alert(
        'Valor acima do preco',
        'Voce esta oferecendo mais que o preco pedido. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => submitOffer(numericValue) },
        ]
      );
      return;
    }

    submitOffer(numericValue);
  };

  const submitOffer = (value: number) => {
    onSubmit(value);
    setOfferValue('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setOfferValue('');
    setError('');
    onClose();
  };

  const currentOffer = parseInt(offerValue, 10) || 0;
  const discount = product.price > 0 ? ((product.price - currentOffer) / product.price * 100).toFixed(0) : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Fazer oferta</Text>
            <Pressable style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Product Info */}
          <View style={styles.productCard}>
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              contentFit="cover"
            />
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {product.title}
              </Text>
              <Text style={styles.productPrice}>
                Preco: R$ {formatPrice(product.price)}
              </Text>
            </View>
          </View>

          {/* Offer Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Sua oferta</Text>
            <View style={[styles.inputContainer, error ? styles.inputError : null]}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={formatInputValue(offerValue)}
                onChangeText={handleOfferChange}
                maxLength={10}
              />
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <Text style={styles.helperText}>
                Oferta minima: R$ {formatPrice(minOffer)} (50% do valor)
              </Text>
            )}

            {currentOffer > 0 && currentOffer < product.price && (
              <View style={styles.discountBadge}>
                <Ionicons name="pricetag" size={14} color={colors.success} />
                <Text style={styles.discountText}>
                  {discount}% de desconto
                </Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <Pressable
            style={[
              styles.submitBtn,
              (!offerValue || error) && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!offerValue}
          >
            <Ionicons name="cash-outline" size={20} color="#fff" />
            <Text style={styles.submitBtnText}>Enviar oferta</Text>
          </Pressable>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            <Text style={styles.infoText}>
              O vendedor pode aceitar, recusar ou fazer uma contra-proposta.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Product Card
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },

  // Input Section
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: colors.error,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    padding: 0,
  },
  helperText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    marginTop: 8,
    fontWeight: '500',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    marginTop: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  discountText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },

  // Submit Button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    gap: 8,
    ...shadows.md,
  },
  submitBtnDisabled: {
    backgroundColor: colors.gray300,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Info Note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});

export default OfferModal;
