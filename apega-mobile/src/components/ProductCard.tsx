import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, shadows, getColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { Product } from '../api';
import { getConditionLabel, getConditionEmoji } from '../constants';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onFavorite?: () => void;
  width?: number;
  showSeller?: boolean;
}

export function ProductCard({
  product,
  onPress,
  onFavorite,
  width,
  showSeller = true,
}: ProductCardProps) {
  const { productWidth: defaultWidth } = useResponsive();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const cardWidth = width ?? defaultWidth;

  const [isFavorited, setIsFavorited] = useState(product.is_favorited || false);
  const imageUrl = product.image_url || product.images?.[0]?.image_url;

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    onFavorite?.();
  };

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  // Map legacy conditions to new system
  const conditionMap: Record<string, string> = {
    novo: 'novo_etiqueta',
    seminovo: 'seminovo',
    usado: 'bom_estado',
    vintage: 'usado',
    novo_etiqueta: 'novo_etiqueta',
    bom_estado: 'bom_estado',
  };
  const mappedCondition = conditionMap[product.condition] || product.condition;
  const conditionLabel = `${getConditionEmoji(mappedCondition)} ${product.condition === 'novo' ? 'Novo' : product.condition === 'seminovo' ? 'Seminovo' : product.condition === 'usado' ? 'Usado' : product.condition === 'vintage' ? 'Vintage' : product.condition}`;

  return (
    <Pressable
      style={[styles.container, { width: cardWidth, backgroundColor: themeColors.surface }]}
      onPress={onPress}
    >
      {/* Image Container */}
      <View style={[styles.imageContainer, { height: cardWidth * 1.25, backgroundColor: themeColors.gray100 }]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: themeColors.gray100 }]}>
            <Ionicons name="image-outline" size={40} color={themeColors.gray300} />
          </View>
        )}

        {/* Favorite Button */}
        <Pressable style={styles.favoriteButton} onPress={handleFavorite}>
          <View style={styles.favoriteCircle}>
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorited ? themeColors.error : '#fff'}
            />
          </View>
        </Pressable>

        {/* Discount Badge */}
        {discount > 0 && (
          <View style={[styles.discountBadge, { backgroundColor: themeColors.error }]}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}

        {/* Condition Badge */}
        <View style={[styles.conditionBadge, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.conditionText, { color: themeColors.text }]}>{conditionLabel}</Text>
        </View>

        {/* Price Tag */}
        <View style={styles.priceContainer}>
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
            style={styles.priceGradient}
          >
            <View style={styles.priceRow}>
              {product.original_price && product.original_price > product.price && (
                <Text style={styles.originalPrice}>
                  R$ {product.original_price.toFixed(0)}
                </Text>
              )}
              <Text style={styles.price}>R$ {product.price.toFixed(0)}</Text>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Info Container */}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={2}>
          {product.title}
        </Text>

        {product.brand && (
          <Text style={[styles.brand, { color: themeColors.primary }]}>{product.brand}</Text>
        )}

        {showSeller && product.seller_name && (
          <View style={styles.sellerRow}>
            {product.seller_avatar ? (
              <Image
                source={{ uri: product.seller_avatar }}
                style={styles.sellerAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.sellerAvatar, styles.sellerAvatarPlaceholder, { backgroundColor: themeColors.gray200 }]}>
                <Ionicons name="person" size={10} color={themeColors.gray400} />
              </View>
            )}
            <Text style={[styles.sellerName, { color: themeColors.textSecondary }]} numberOfLines={1}>
              {product.seller_name}
            </Text>
            {product.seller_city && (
              <Text style={[styles.sellerCity, { color: themeColors.textMuted }]}> • {product.seller_city}</Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
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
  imageContainer: {
    position: 'relative',
    backgroundColor: colors.gray100,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
  },
  favoriteCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  discountText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  conditionBadge: {
    position: 'absolute',
    bottom: 50,
    left: spacing.sm,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.gray700,
  },
  priceContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  priceGradient: {
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  originalPrice: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  infoContainer: {
    padding: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray800,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  brand: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: spacing.xs,
  },
  sellerAvatarPlaceholder: {
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerName: {
    fontSize: 11,
    color: colors.gray500,
    flex: 1,
  },
  sellerCity: {
    fontSize: 11,
    color: colors.gray400,
  },
});

export default ProductCard;
