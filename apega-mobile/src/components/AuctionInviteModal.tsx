import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadows, getColors } from '../theme';
import { useTheme } from '../context/ThemeContext';

interface AuctionInviteModalProps {
  visible: boolean;
  onClose: () => void;
  onParticipate: () => void;
  nextAuctionDate?: string;
  productsCount?: number;
}

export function AuctionInviteModal({
  visible,
  onClose,
  onParticipate,
  nextAuctionDate,
  productsCount = 0,
}: AuctionInviteModalProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);

  // Get next Wednesday
  const getNextWednesday = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7;
    const nextWed = new Date(now);
    nextWed.setDate(now.getDate() + daysUntilWednesday);
    return nextWed.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const auctionDate = nextAuctionDate || getNextWednesday();

  const benefits = [
    {
      icon: 'eye-outline',
      title: 'Mais visibilidade',
      description: 'Suas peças aparecem em destaque para milhares de compradores',
    },
    {
      icon: 'trending-up-outline',
      title: 'Venda mais rápido',
      description: 'Produtos no leilão têm 3x mais chances de vender',
    },
    {
      icon: 'people-outline',
      title: 'Novos clientes',
      description: 'Alcance compradores que buscam ofertas especiais',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, {
          backgroundColor: themeColors.surface,
          paddingBottom: insets.bottom + spacing.lg,
        }]}>
          {/* Header with gradient */}
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            {/* Close button */}
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
            </Pressable>

            {/* Decorative circles */}
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
            <View style={[styles.circle, styles.circle3]} />

            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="flash" size={40} color="#FFF" />
            </View>

            <Text style={styles.headerTitle}>Quarta do Largô</Text>
            <Text style={styles.headerSubtitle}>
              Você foi convidado para o leilão semanal!
            </Text>

            {/* Date badge */}
            <View style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.dateBadgeText}>{auctionDate}</Text>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Warning about earnings */}
            <View style={[styles.warningCard, { backgroundColor: themeColors.warning + '15' }]}>
              <Ionicons name="information-circle" size={24} color={themeColors.warning} />
              <View style={styles.warningText}>
                <Text style={[styles.warningTitle, { color: themeColors.text }]}>
                  Importante sobre ganhos
                </Text>
                <Text style={[styles.warningDescription, { color: themeColors.textSecondary }]}>
                  No leilão, suas peças terão <Text style={styles.highlight}>30% de desconto</Text>.
                  Você receberá menos por cada venda, mas terá muito mais visibilidade e vendas.
                </Text>
              </View>
            </View>

            {/* Example calculation */}
            <View style={[styles.calculationCard, { backgroundColor: themeColors.gray100 }]}>
              <Text style={[styles.calculationTitle, { color: themeColors.text }]}>
                Exemplo de ganho:
              </Text>
              <View style={styles.calculationRow}>
                <Text style={[styles.calculationLabel, { color: themeColors.textSecondary }]}>
                  Preço original:
                </Text>
                <Text style={[styles.calculationValue, { color: themeColors.text }]}>
                  R$ 100,00
                </Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={[styles.calculationLabel, { color: themeColors.textSecondary }]}>
                  Desconto leilão (30%):
                </Text>
                <Text style={[styles.calculationValueDiscount, { color: themeColors.error }]}>
                  - R$ 30,00
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
              <View style={styles.calculationRow}>
                <Text style={[styles.calculationLabel, { color: themeColors.text, fontWeight: '600' }]}>
                  Você recebe:
                </Text>
                <Text style={[styles.calculationFinal, { color: themeColors.success }]}>
                  R$ 70,00
                </Text>
              </View>
            </View>

            {/* Benefits */}
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Por que participar?
            </Text>

            {benefits.map((benefit, index) => (
              <View key={index} style={[styles.benefitCard, { backgroundColor: themeColors.gray50 }]}>
                <View style={[styles.benefitIcon, { backgroundColor: colors.primaryMuted }]}>
                  <Ionicons name={benefit.icon as any} size={24} color={colors.primary} />
                </View>
                <View style={styles.benefitText}>
                  <Text style={[styles.benefitTitle, { color: themeColors.text }]}>
                    {benefit.title}
                  </Text>
                  <Text style={[styles.benefitDescription, { color: themeColors.textSecondary }]}>
                    {benefit.description}
                  </Text>
                </View>
              </View>
            ))}

            {/* Products count info */}
            {productsCount > 0 && (
              <View style={[styles.productsInfo, { backgroundColor: themeColors.primaryMuted }]}>
                <Ionicons name="shirt-outline" size={20} color={themeColors.primary} />
                <Text style={[styles.productsInfoText, { color: themeColors.primary }]}>
                  Você tem <Text style={{ fontWeight: '700' }}>{productsCount} peças</Text> elegíveis para o leilão
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.secondaryButton, { borderColor: themeColors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.secondaryButtonText, { color: themeColors.textSecondary }]}>
                Agora não
              </Text>
            </Pressable>

            <Pressable style={styles.primaryButton} onPress={onParticipate}>
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Escolher peças</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '90%',
    ...shadows.xl,
  },
  header: {
    padding: spacing.xl,
    paddingTop: spacing['2xl'],
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  circle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle1: {
    width: 150,
    height: 150,
    top: -50,
    right: -30,
  },
  circle2: {
    width: 100,
    height: 100,
    bottom: -30,
    left: -20,
  },
  circle3: {
    width: 60,
    height: 60,
    top: 40,
    left: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  dateBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  content: {
    padding: spacing.lg,
  },
  warningCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  warningDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  highlight: {
    fontWeight: '700',
    color: colors.primary,
  },
  calculationCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  calculationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  calculationLabel: {
    fontSize: 14,
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  calculationValueDiscount: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  calculationFinal: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  benefitCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  productsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  productsInfoText: {
    fontSize: 14,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 2,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default AuctionInviteModal;
