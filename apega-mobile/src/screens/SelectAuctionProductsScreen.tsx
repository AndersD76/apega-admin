import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, shadows, getColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { productsService } from '../api';
import { formatPrice } from '../utils/format';

interface Product {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  images?: { image_url: string }[];
  brand?: string;
  size?: string;
  in_auction?: boolean;
}

export function SelectAuctionProductsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const { width, getResponsiveValue, gridColumns, gridGap } = useResponsive();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const AUCTION_DISCOUNT = 0.30; // 30% discount

  const padding = getResponsiveValue(16, 24, 32);
  const cols = gridColumns;
  const gap = gridGap;
  const cardW = (width - padding * 2 - gap * (cols - 1)) / cols;

  const loadProducts = async () => {
    try {
      // Load seller's active products
      const response = await productsService.getMyProducts();
      const activeProducts = (response.products || []).filter(
        (p: any) => p.status === 'active'
      );
      setProducts(activeProducts);

      // Pre-select products already in auction
      const auctionProducts = activeProducts
        .filter((p: any) => p.in_auction)
        .map((p: any) => p.id);
      setSelectedProducts(new Set(auctionProducts));
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, []);

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      // TODO: Call API to update auction products
      // await auctionService.setAuctionProducts(Array.from(selectedProducts));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      navigation.goBack();
    } catch (error) {
      console.error('Error updating auction products:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotals = () => {
    const selectedItems = products.filter(p => selectedProducts.has(p.id));
    const originalTotal = selectedItems.reduce((sum, p) => sum + p.price, 0);
    const auctionTotal = originalTotal * (1 - AUCTION_DISCOUNT);
    return {
      count: selectedItems.length,
      originalTotal,
      auctionTotal,
      discount: originalTotal - auctionTotal,
    };
  };

  const totals = calculateTotals();

  const renderProductCard = (product: Product) => {
    const isSelected = selectedProducts.has(product.id);
    const imageUrl = product.image_url || product.images?.[0]?.image_url;
    const auctionPrice = product.price * (1 - AUCTION_DISCOUNT);

    return (
      <Pressable
        key={product.id}
        style={[
          styles.productCard,
          {
            width: cardW,
            backgroundColor: themeColors.surface,
            borderColor: isSelected ? colors.primary : themeColors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => toggleProduct(product.id)}
      >
        {/* Selection indicator */}
        <View style={[
          styles.checkbox,
          {
            backgroundColor: isSelected ? colors.primary : themeColors.gray100,
            borderColor: isSelected ? colors.primary : themeColors.gray300,
          }
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFF" />
          )}
        </View>

        {/* Product image */}
        <View style={[styles.imageContainer, { height: cardW * 1.1 }]}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: themeColors.gray100 }]}>
              <Ionicons name="image-outline" size={32} color={themeColors.gray300} />
            </View>
          )}

          {/* Discount badge */}
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-30%</Text>
          </View>
        </View>

        {/* Product info */}
        <View style={styles.productInfo}>
          <Text style={[styles.productTitle, { color: themeColors.text }]} numberOfLines={2}>
            {product.title}
          </Text>

          {product.brand && (
            <Text style={[styles.productBrand, { color: themeColors.primary }]}>
              {product.brand}
            </Text>
          )}

          {/* Price comparison */}
          <View style={styles.priceContainer}>
            <Text style={[styles.originalPrice, { color: themeColors.textMuted }]}>
              {formatPrice(product.price)}
            </Text>
            <Ionicons name="arrow-forward" size={12} color={themeColors.textMuted} />
            <Text style={[styles.auctionPrice, { color: colors.primary }]}>
              {formatPrice(auctionPrice)}
            </Text>
          </View>

          {/* You receive */}
          <View style={[styles.youReceive, { backgroundColor: themeColors.gray50 }]}>
            <Text style={[styles.youReceiveLabel, { color: themeColors.textSecondary }]}>
              Você recebe:
            </Text>
            <Text style={[styles.youReceiveValue, { color: themeColors.success }]}>
              {formatPrice(auctionPrice * 0.88)} {/* After platform fee */}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Carregando suas peças...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: insets.top + spacing.sm,
        backgroundColor: themeColors.surface,
        borderBottomColor: themeColors.border,
      }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Selecionar Peças
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
            Quarta do Largô
          </Text>
        </View>

        <Pressable style={styles.selectAllButton} onPress={selectAll}>
          <Text style={[styles.selectAllText, { color: colors.primary }]}>
            {selectedProducts.size === products.length ? 'Desmarcar' : 'Selecionar todos'}
          </Text>
        </Pressable>
      </View>

      {/* Info banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.infoBannerText, { color: colors.primary }]}>
          Selecione as peças que você quer colocar no leilão. Elas terão 30% de desconto.
        </Text>
      </View>

      {/* Products grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shirt-outline" size={64} color={themeColors.gray300} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              Nenhuma peça disponível
            </Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              Você precisa ter peças ativas para participar do leilão
            </Text>
            <Pressable
              style={[styles.emptyButton, { backgroundColor: themeColors.primary }]}
              onPress={() => navigation.navigate('Sell')}
            >
              <Text style={styles.emptyButtonText}>Cadastrar peça</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.productsGrid, { gap }]}>
            {products.map(renderProductCard)}
          </View>
        )}

        {/* Spacer for bottom bar */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Bottom summary bar */}
      {products.length > 0 && (
        <View style={[styles.bottomBar, {
          paddingBottom: insets.bottom + spacing.md,
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
        }]}>
          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>
                {totals.count} {totals.count === 1 ? 'peça selecionada' : 'peças selecionadas'}
              </Text>
            </View>

            {totals.count > 0 && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>
                    Valor original:
                  </Text>
                  <Text style={[styles.summaryValue, { color: themeColors.textMuted, textDecorationLine: 'line-through' }]}>
                    {formatPrice(totals.originalTotal)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: themeColors.text, fontWeight: '600' }]}>
                    Valor no leilão:
                  </Text>
                  <Text style={[styles.summaryValueFinal, { color: colors.primary }]}>
                    {formatPrice(totals.auctionTotal)}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Confirm button */}
          <Pressable
            style={[
              styles.confirmButton,
              totals.count === 0 && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={submitting || totals.count === 0}
          >
            <LinearGradient
              colors={totals.count === 0 ? [themeColors.gray300, themeColors.gray300] : [colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButtonGradient}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text style={[
                    styles.confirmButtonText,
                    totals.count === 0 && { color: themeColors.gray500 }
                  ]}>
                    {totals.count === 0 ? 'Selecione peças' : 'Confirmar participação'}
                  </Text>
                  {totals.count > 0 && (
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  )}
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
  },
  selectAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
    position: 'relative',
  },
  checkbox: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  discountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  productInfo: {
    padding: spacing.md,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  productBrand: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  originalPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  auctionPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  youReceive: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  youReceiveLabel: {
    fontSize: 11,
  },
  youReceiveValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    borderTopWidth: 1,
    ...shadows.lg,
  },
  summary: {
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
  },
  summaryValueFinal: {
    fontSize: 18,
    fontWeight: '700',
  },
  confirmButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default SelectAuctionProductsScreen;
