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
import { LinearGradient } from 'expo-linear-gradient';

const isWeb = Platform.OS === 'web';

interface ProductCardProps {
  id: string;
  image: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  likes?: number;
  isFavorited?: boolean;
  isSold?: boolean;
  condition?: string;
  size?: string;
  isNew?: boolean;
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
  isFavorited = false,
  isSold = false,
  condition,
  size,
  isNew = false,
  onPress,
  onFavorite,
  numColumns = 2,
  compact = false,
}: ProductCardProps) {
  const { width } = useWindowDimensions();
  const containerPadding = isWeb ? 24 : 12;
  const gap = 10;
  const cardWidth = (width - containerPadding * 2 - gap * (numColumns - 1)) / numColumns;
  const imageHeight = cardWidth * 1.35;

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      {/* Imagem com overlay */}
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={40} color="#CBD5E1" />
          </View>
        )}

        {/* Gradiente escuro no topo */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.2)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Badge de desconto */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}

        {/* Badge NOVO */}
        {isNew && !hasDiscount && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>NOVO</Text>
          </View>
        )}

        {/* Botao favorito */}
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
              size={22}
              color={isFavorited ? '#F43F5E' : '#FFF'}
            />
          </TouchableOpacity>
        )}

        {/* Overlay vendido */}
        {isSold && (
          <View style={styles.soldOverlay}>
            <View style={styles.soldBadge}>
              <Ionicons name="checkmark-done" size={20} color="#FFF" />
              <Text style={styles.soldText}>VENDIDO</Text>
            </View>
          </View>
        )}

        {/* Info no rodape da imagem */}
        <View style={styles.imageFooter}>
          {size && (
            <View style={styles.sizeTag}>
              <Text style={styles.sizeText}>{size}</Text>
            </View>
          )}
          {likes > 0 && (
            <View style={styles.likesTag}>
              <Ionicons name="heart" size={11} color="#FFF" />
              <Text style={styles.likesText}>{likes}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Informacoes */}
      <View style={styles.info}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>R${price.toFixed(0)}</Text>
          {hasDiscount && (
            <Text style={styles.oldPrice}>R${originalPrice?.toFixed(0)}</Text>
          )}
        </View>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {condition && (
          <View style={styles.conditionRow}>
            <View style={[
              styles.conditionDot,
              condition.toLowerCase().includes('novo') ? styles.conditionNew :
              condition.toLowerCase().includes('semi') ? styles.conditionGood :
              styles.conditionUsed
            ]} />
            <Text style={styles.conditionText}>{condition}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      },
    }),
  },
  imageContainer: {
    backgroundColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#F43F5E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  discountText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  newText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  soldText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  imageFooter: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sizeTag: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  likesTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  likesText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  info: {
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  oldPrice: {
    fontSize: 14,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  title: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  conditionNew: {
    backgroundColor: '#10B981',
  },
  conditionGood: {
    backgroundColor: '#8B5CF6',
  },
  conditionUsed: {
    backgroundColor: '#F59E0B',
  },
  conditionText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
