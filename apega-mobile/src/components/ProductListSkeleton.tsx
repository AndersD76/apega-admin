import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { spacing } from '../theme';

interface ProductListSkeletonProps {
  count?: number;
}

export function ProductListSkeleton({ count = 4 }: ProductListSkeletonProps) {
  const { width } = useWindowDimensions();

  // Responsive columns
  const isDesktop = width > 900;
  const isTablet = width > 600 && width <= 900;
  const numColumns = isDesktop ? 4 : isTablet ? 3 : 2;
  const productWidth = (width - 32 - (numColumns - 1) * 12) / numColumns;

  // Create array of skeleton items
  const skeletons = Array.from({ length: count }, (_, index) => index);

  return (
    <View style={styles.container}>
      {skeletons.map((index) => (
        <ProductCardSkeleton key={index} width={productWidth} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
});

export default ProductListSkeleton;
