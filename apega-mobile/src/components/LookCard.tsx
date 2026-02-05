import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../theme';
import { LOOK_DISCOUNT_PERCENT } from '../constants/looks';

export interface LookProduct {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  size?: string;
}

export interface Look {
  id: string;
  name: string;
  products: LookProduct[];
  seller_id: string;
  seller_name?: string;
  created_at?: string;
}

interface LookCardProps {
  look: Look;
  onPress: () => void;
  width?: number;
}

export function LookCard({ look, onPress, width = 180 }: LookCardProps) {
  // Calculate prices
  const originalPrice = look.products.reduce((sum, p) => sum + p.price, 0);
  const discountAmount = originalPrice * (LOOK_DISCOUNT_PERCENT / 100);
  const finalPrice = originalPrice - discountAmount;

  // Get first 4 product images for grid
  const gridImages = look.products.slice(0, 4).map(p => p.image_url);

  return (
    <Pressable style={[styles.container, { width }]} onPress={onPress}>
      {/* Image Grid 2x2 */}
      <View style={styles.imageGrid}>
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={styles.imageCell}>
            {gridImages[index] ? (
              <Image
                source={{ uri: gridImages[index] }}
                style={styles.gridImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.emptyCell}>
                <Ionicons name="image-outline" size={20} color={colors.gray300} />
              </View>
            )}
          </View>
        ))}

        {/* Look Badge */}
        <View style={styles.lookBadge}>
          <Text style={styles.lookBadgeIcon}>+</Text>
          <Text style={styles.lookBadgeText}>Look Completo</Text>
        </View>

        {/* Discount Badge */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{LOOK_DISCOUNT_PERCENT}% OFF</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.lookName} numberOfLines={1}>{look.name}</Text>
        <Text style={styles.itemCount}>{look.products.length} pecas</Text>

        {/* Prices */}
        <View style={styles.priceRow}>
          <Text style={styles.originalPrice}>R$ {originalPrice.toFixed(0)}</Text>
          <Text style={styles.finalPrice}>R$ {finalPrice.toFixed(0)}</Text>
        </View>

        <View style={styles.comboTag}>
          <Ionicons name="pricetag" size={12} color={colors.lilas} />
          <Text style={styles.comboTagText}>{LOOK_DISCOUNT_PERCENT}% OFF no combo</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    marginRight: spacing.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    aspectRatio: 1,
    position: 'relative',
  },
  imageCell: {
    width: '50%',
    height: '50%',
    borderWidth: 0.5,
    borderColor: colors.white,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  emptyCell: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lilas,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: 4,
  },
  lookBadgeIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  lookBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  infoContainer: {
    padding: spacing.md,
  },
  lookName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  itemCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  originalPrice: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  finalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  comboTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    backgroundColor: colors.lilasLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  comboTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.lilas,
  },
});

export default LookCard;
