import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface ProductCardProps {
  id: string;
  image: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  likes?: number;
  views?: number;
  isFavorited?: boolean;
  isSold?: boolean;
  condition?: string;
  size?: string;
  onPress: () => void;
  onFavorite?: () => void;
  numColumns?: number;
  compact?: boolean;
}

export default function ProductCard({
  id,
  image,
  title,
  price,
  originalPrice,
  likes = 0,
  views = 0,
  isFavorited = false,
  isSold = false,
  condition,
  size,
  onPress,
  onFavorite,
  numColumns = 2,
  compact = false,
}: ProductCardProps) {
  const containerPadding = isWeb ? 40 : 16;
  const gap = 8;
  const cardWidth = (screenWidth - containerPadding * 2 - gap * (numColumns - 1)) / numColumns;
  const imageSize = cardWidth;

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { width: cardWidth },
        compact && styles.containerCompact,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.imageContainer, { width: imageSize, height: imageSize }]}>
        <Image
          source={{ uri: image }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Favorite Button */}
        {onFavorite && (
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={(e) => {
              e.stopPropagation();
              onFavorite();
            }}
          >
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorited ? COLORS.secondary : COLORS.white}
            />
          </TouchableOpacity>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}

        {/* Sold Overlay */}
        {isSold && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>VENDIDO</Text>
          </View>
        )}
      </View>

      <View style={[styles.info, compact && styles.infoCompact]}>
        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>R$ {price.toFixed(0)}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>R$ {originalPrice?.toFixed(0)}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Size and Condition */}
        {(size || condition) && !compact && (
          <View style={styles.tagsRow}>
            {size && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{size}</Text>
              </View>
            )}
            {condition && (
              <View style={[styles.tag, styles.conditionTag]}>
                <Text style={styles.tagText}>{condition}</Text>
              </View>
            )}
          </View>
        )}

        {/* Stats */}
        {!compact && (likes > 0 || views > 0) && (
          <View style={styles.statsRow}>
            {likes > 0 && (
              <View style={styles.stat}>
                <Ionicons name="heart-outline" size={12} color={COLORS.gray[500]} />
                <Text style={styles.statText}>{likes}</Text>
              </View>
            )}
            {views > 0 && (
              <View style={styles.stat}>
                <Ionicons name="eye-outline" size={12} color={COLORS.gray[500]} />
                <Text style={styles.statText}>{views}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: 8,
    ...SHADOWS.sm,
  },
  containerCompact: {
    marginBottom: 4,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: COLORS.gray[100],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  info: {
    padding: 10,
  },
  infoCompact: {
    padding: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.priceOld,
    textDecorationLine: 'line-through',
  },
  title: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  tag: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conditionTag: {
    backgroundColor: COLORS.primaryExtraLight,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
    color: COLORS.gray[500],
  },
});
