import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../theme';
import { SellerBadge } from '../constants/badges';

interface BadgeTooltipProps {
  badge: SellerBadge | null;
  visible: boolean;
  onClose: () => void;
}

export function BadgeTooltip({ badge, visible, onClose }: BadgeTooltipProps) {
  const { width } = useWindowDimensions();

  if (!badge) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.container, { maxWidth: width - 64 }]}>
          {/* Emoji grande */}
          <View style={[styles.emojiContainer, { backgroundColor: `${badge.color}20` }]}>
            <Text style={styles.emoji}>{badge.emoji}</Text>
          </View>

          {/* Icone decorativo */}
          <View style={[styles.iconBadge, { backgroundColor: badge.color }]}>
            <Ionicons name={badge.icon as any} size={16} color="#fff" />
          </View>

          {/* Nome do badge */}
          <Text style={styles.name}>{badge.name}</Text>

          {/* Descricao de como conquistar */}
          <View style={styles.descriptionContainer}>
            <Ionicons name="information-circle-outline" size={16} color={colors.gray500} />
            <Text style={styles.description}>{badge.description}</Text>
          </View>

          {/* Botao fechar */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Entendi</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    ...shadows.lg,
    minWidth: 280,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 40,
  },
  iconBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: 14,
    color: colors.gray600,
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});

export default BadgeTooltip;
