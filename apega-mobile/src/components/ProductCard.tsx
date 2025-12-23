import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

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
  const { width } = useWindowDimensions();
  const containerPadding = isWeb ? 32 : 16;
  const gap = 12;
  const cardWidth = (width - containerPadding * 2 - gap * (numColumns - 1)) / numColumns;
  const imageSize = cardWidth;

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth }, compact && styles.containerCompact]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.imageWrap, { width: imageSize, height: imageSize }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={24} color={COLORS.gray[400]} />
          </View>
        )}

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
              size={18}
              color={isFavorited ? COLORS.error : COLORS.white}
            />
          </TouchableOpacity>
        )}

        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}

        {isSold && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>VENDIDO</Text>
          </View>
        )}
      </View>

      <View style={[styles.info, compact && styles.infoCompact]}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>R$ {price.toFixed(0)}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>R$ {originalPrice?.toFixed(0)}</Text>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

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

        {!compact && (likes > 0 || views > 0) && (
          <View style={styles.statsRow}>
            {likes > 0 && (
              <View style={styles.stat}>
                <Ionicons name="heart-outline" size={12} color={COLORS.textTertiary} />
                <Text style={styles.statText}>{likes}</Text>
              </View>
            )}
            {views > 0 && (
              <View style={styles.stat}>
                <Ionicons name="eye-outline" size={12} color={COLORS.textTertiary} />
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
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.xs,
  },
  containerCompact: {
    marginBottom: 6,
  },
  imageWrap: {
    position: 'relative',
    backgroundColor: COLORS.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    color: COLORS.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  info: {
    padding: 10,
  },
  infoCompact: {
    padding: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.textTertiary,
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
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
    color: COLORS.textTertiary,
  },
});
