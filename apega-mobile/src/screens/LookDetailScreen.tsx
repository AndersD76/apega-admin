import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import { cartService } from '../api';
import { formatPrice } from '../utils/format';
import { colors, spacing, radius, shadows } from '../theme';
import { LOOK_DISCOUNT_PERCENT } from '../constants/looks';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400';

interface LookProduct {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  size?: string;
  brand?: string;
  condition?: string;
}

interface Look {
  id: string;
  name: string;
  products: LookProduct[];
  seller_id: string;
  seller_name?: string;
  seller_avatar?: string;
  created_at?: string;
}

export function LookDetailScreen({ navigation, route }: any) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const lookId = route?.params?.lookId;

  // Mock look data - TODO: Replace with API call
  const [look, setLook] = useState<Look | null>(null);

  useEffect(() => {
    // TODO: Fetch look data from API
    // For now, using mock data
    const mockLook: Look = {
      id: lookId || '1',
      name: 'Look Verao Casual',
      seller_id: '1',
      seller_name: 'Maria Silva',
      seller_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      products: [
        {
          id: '1',
          title: 'Vestido Floral Farm',
          price: 150,
          size: 'M',
          brand: 'Farm',
          condition: 'seminovo',
          image_url: 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400',
        },
        {
          id: '2',
          title: 'Bolsa de Palha',
          price: 80,
          size: 'Unico',
          brand: 'Zara',
          condition: 'novo',
          image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
        },
        {
          id: '3',
          title: 'Sandalia Rasteira',
          price: 60,
          size: '37',
          brand: 'Arezzo',
          condition: 'seminovo',
          image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
        },
      ],
    };

    setTimeout(() => {
      setLook(mockLook);
      setLoading(false);
    }, 500);
  }, [lookId]);

  if (loading || !look) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Calculate prices
  const originalPrice = look.products.reduce((sum, p) => sum + p.price, 0);
  const discountAmount = originalPrice * (LOOK_DISCOUNT_PERCENT / 100);
  const finalPrice = originalPrice - discountAmount;

  // All product images for gallery
  const allImages = look.products.map((p) => p.image_url || PLACEHOLDER_IMAGE);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    setAddingToCart(true);
    try {
      // Add all products from the look to cart
      // TODO: Implement proper look cart functionality
      for (const product of look.products) {
        await cartService.addToCart(product.id);
      }

      Alert.alert('Adicionado!', 'Look adicionado a sacola com sucesso!', [
        { text: 'Continuar comprando' },
        { text: 'Ver sacola', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Erro', 'Nao foi possivel adicionar o look a sacola.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleViewProduct = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Look Completo</Text>
        </View>
        <Pressable style={styles.shareBtn}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.gallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {allImages.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={[styles.galleryImage, { width }]}
                contentFit="cover"
              />
            ))}
          </ScrollView>

          {/* Look Badge */}
          <View style={styles.lookBadge}>
            <Text style={styles.lookBadgeIcon}>+</Text>
            <Text style={styles.lookBadgeText}>Look Completo</Text>
          </View>

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {allImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === activeImageIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Look Info */}
        <View style={styles.infoSection}>
          <Text style={styles.lookName}>{look.name}</Text>
          <Text style={styles.itemCount}>{look.products.length} pecas neste look</Text>

          {/* Seller Info */}
          {look.seller_name && (
            <Pressable
              style={styles.sellerRow}
              onPress={() => navigation.navigate('SellerProfile', { sellerId: look.seller_id })}
            >
              {look.seller_avatar ? (
                <Image source={{ uri: look.seller_avatar }} style={styles.sellerAvatar} />
              ) : (
                <View style={[styles.sellerAvatar, styles.sellerAvatarPlaceholder]}>
                  <Ionicons name="person" size={16} color={colors.textMuted} />
                </View>
              )}
              <Text style={styles.sellerName}>Por {look.seller_name}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Products List */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Pecas do Look</Text>

          {look.products.map((product) => (
            <Pressable
              key={product.id}
              style={styles.productItem}
              onPress={() => handleViewProduct(product.id)}
            >
              <Image
                source={{ uri: product.image_url || PLACEHOLDER_IMAGE }}
                style={styles.productImage}
                contentFit="cover"
              />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={1}>
                  {product.title}
                </Text>
                {product.brand && <Text style={styles.productBrand}>{product.brand}</Text>}
                <View style={styles.productMeta}>
                  {product.size && <Text style={styles.productSize}>Tam: {product.size}</Text>}
                  {product.condition && (
                    <Text style={styles.productCondition}>
                      {product.condition === 'novo'
                        ? 'Novo'
                        : product.condition === 'seminovo'
                        ? 'Seminovo'
                        : 'Usado'}
                    </Text>
                  )}
                </View>
                <Text style={styles.productPrice}>R$ {formatPrice(product.price)}</Text>
              </View>
              <Pressable
                style={styles.viewProductBtn}
                onPress={() => handleViewProduct(product.id)}
              >
                <Text style={styles.viewProductText}>Ver peca</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </Pressable>
            </Pressable>
          ))}
        </View>

        {/* Price Summary */}
        <View style={styles.priceSummary}>
          <Text style={styles.summaryTitle}>Resumo de Valores</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal ({look.products.length} pecas):</Text>
            <Text style={styles.subtotalPrice}>R$ {formatPrice(originalPrice)}</Text>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.discountLabelRow}>
              <Ionicons name="pricetag" size={14} color={colors.success} />
              <Text style={styles.discountLabel}>Desconto Look ({LOOK_DISCOUNT_PERCENT}%):</Text>
            </View>
            <Text style={styles.discountPrice}>-R$ {formatPrice(discountAmount)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>R$ {formatPrice(finalPrice)}</Text>
          </View>

          <View style={styles.savingsBadge}>
            <Ionicons name="sparkles" size={16} color={colors.lilas} />
            <Text style={styles.savingsText}>
              Voce economiza R$ {formatPrice(discountAmount)} comprando este look!
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomOldPrice}>R$ {formatPrice(originalPrice)}</Text>
          <Text style={styles.bottomPrice}>R$ {formatPrice(finalPrice)}</Text>
          <View style={styles.bottomSavings}>
            <Text style={styles.bottomSavingsText}>{LOOK_DISCOUNT_PERCENT}% OFF</Text>
          </View>
        </View>
        <Pressable onPress={handleAddToCart} disabled={addingToCart} style={{ flex: 1 }}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.addToCartBtn}
          >
            {addingToCart ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="bag-add-outline" size={20} color={colors.white} />
                <Text style={styles.addToCartText}>Adicionar Look a Sacola</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Gallery
  gallery: {
    position: 'relative',
    aspectRatio: 1,
  },
  galleryImage: {
    aspectRatio: 1,
  },
  lookBadge: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lilas,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: 6,
  },
  lookBadgeIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  lookBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  pagination: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: colors.white,
    width: 24,
  },

  // Info Section
  infoSection: {
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  lookName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  itemCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sellerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  sellerAvatarPlaceholder: {
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },

  // Products Section
  productsSection: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  productBrand: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  productMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  productSize: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  productCondition: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  viewProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.lg,
  },
  viewProductText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  // Price Summary
  priceSummary: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  subtotalPrice: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discountLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  discountLabel: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  discountPrice: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.lilasLight,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  savingsText: {
    flex: 1,
    fontSize: 13,
    color: colors.lilas,
    fontWeight: '500',
  },

  // Bottom Action
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
  bottomPriceInfo: {
    marginRight: spacing.md,
  },
  bottomOldPrice: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  bottomSavings: {
    backgroundColor: colors.lilas,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  bottomSavingsText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});

export default LookDetailScreen;
