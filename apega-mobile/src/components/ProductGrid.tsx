import React from 'react';
import { View, FlatList, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { spacing } from '../theme';

interface ProductGridProps<T> {
  data: T[];
  renderItem: (item: T, index: number, width: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

/**
 * Responsive ProductGrid component
 *
 * Automatically adjusts columns based on screen size:
 * - Mobile: 2 columns
 * - Tablet: 3 columns
 * - Desktop: 4 columns
 *
 * Usage:
 * ```tsx
 * <ProductGrid
 *   data={products}
 *   renderItem={(product, index, width) => (
 *     <ProductCard key={product.id} product={product} width={width} />
 *   )}
 *   keyExtractor={(item) => item.id}
 * />
 * ```
 */
export function ProductGrid<T>({
  data,
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  onEndReached,
  onEndReachedThreshold = 0.5,
  refreshing,
  onRefresh,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}: ProductGridProps<T>) {
  const { gridColumns, productWidth, gridGap, isMobile, isTablet } = useResponsive();

  // Calculate horizontal padding based on screen size
  const horizontalPadding = isMobile ? spacing.lg : isTablet ? spacing['2xl'] : spacing['3xl'];

  const renderGridItem = ({ item, index }: { item: T; index: number }) => {
    const isLastInRow = (index + 1) % gridColumns === 0;
    const isFirstInRow = index % gridColumns === 0;

    return (
      <View
        style={[
          styles.gridItem,
          {
            width: productWidth,
            marginRight: isLastInRow ? 0 : gridGap,
            marginBottom: gridGap,
          },
        ]}
      >
        {renderItem(item, index, productWidth)}
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderGridItem}
      keyExtractor={keyExtractor}
      numColumns={gridColumns}
      key={`grid-${gridColumns}`} // Force re-render when columns change
      columnWrapperStyle={styles.row}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshing={refreshing}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      contentContainerStyle={[
        styles.container,
        { paddingHorizontal: horizontalPadding },
        contentContainerStyle,
      ]}
    />
  );
}

/**
 * Hook to get grid configuration for manual grid implementations
 */
export function useProductGrid() {
  const { gridColumns, productWidth, gridGap, isMobile, isTablet, isDesktop } = useResponsive();

  const horizontalPadding = isMobile ? spacing.lg : isTablet ? spacing['2xl'] : spacing['3xl'];

  return {
    gridColumns,
    productWidth,
    gridGap,
    horizontalPadding,
    isMobile,
    isTablet,
    isDesktop,
  };
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  row: {
    justifyContent: 'flex-start',
  },
  gridItem: {
    // Width and margins applied dynamically
  },
});

export default ProductGrid;
