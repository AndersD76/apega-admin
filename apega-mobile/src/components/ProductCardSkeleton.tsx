import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton, SkeletonCircle, SkeletonText } from './Skeleton';
import { colors, spacing, radius, shadows } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductCardSkeletonProps {
  width?: number;
}

export function ProductCardSkeleton({
  width = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2,
}: ProductCardSkeletonProps) {
  const imageHeight = width * 1.25;

  return (
    <View style={[styles.container, { width }]}>
      {/* Image Skeleton */}
      <Skeleton
        width={width}
        height={imageHeight}
        borderRadius={0}
        style={styles.image}
      />

      {/* Info Container */}
      <View style={styles.infoContainer}>
        {/* Title - 2 lines */}
        <SkeletonText width="90%" height={14} style={styles.titleLine} />
        <SkeletonText width="60%" height={14} style={styles.titleLine} />

        {/* Brand */}
        <SkeletonText width="40%" height={12} style={styles.brand} />

        {/* Price */}
        <SkeletonText width="50%" height={18} style={styles.price} />

        {/* Seller Row */}
        <View style={styles.sellerRow}>
          <SkeletonCircle size={18} />
          <SkeletonText width="60%" height={11} style={styles.sellerName} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    ...shadows.md,
    overflow: 'hidden',
  },
  image: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  infoContainer: {
    padding: spacing.md,
  },
  titleLine: {
    marginBottom: spacing.xs,
  },
  brand: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  price: {
    marginBottom: spacing.sm,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    marginLeft: spacing.xs,
  },
});

export default ProductCardSkeleton;
