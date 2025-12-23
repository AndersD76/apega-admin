import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { ShareModal, OfferModal } from '../components';
import { getProduct, Product } from '../services/products';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 900;

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

export default function ItemDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { itemId, item } = route.params || {};

  const [product, setProduct] = useState<Product | null>(item || null);
  const [loading, setLoading] = useState(!item && !!itemId);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) return;
      setLoading(true);
      try {
        const response = await getProduct(itemId, 'detail');
        setProduct(response.product);
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
      } finally {
        setLoading(false);
      }
    };
    if (!product && itemId) {
      fetchItem();
    }
  }, [itemId, product]);

  const images = useMemo(() => {
    if (!product) return [] as string[];
    const urls = (product.images || []).map((img) => img.image_url);
    if (urls.length === 0 && product.image_url) {
      urls.push(product.image_url);
    }
    return urls;
  }, [product]);

  const priceValue = product?.price ? (typeof product.price === 'string' ? parseFloat(product.price) : product.price) : 0;
  const originalPrice = product?.original_price || undefined;
  const hasDiscount = originalPrice && originalPrice > priceValue;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - priceValue) / originalPrice) * 100)
    : 0;

  const formatPrice = (value: number | undefined) => {
    if (!value || Number.isNaN(value)) return 'R$ 0';
    return `R$ ${value.toFixed(0)}`;
  };

  const handleBuyNow = () => {
    if (!product) return;
    navigation.navigate('Checkout', { item: product });
  };

  const handleAddToCart = () => {
    Alert.alert('Boa escolha!', 'Produto adicionado a sacola.');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando produto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Produto nao encontrado.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageWidth = isDesktop ? width * 0.5 : width;
  const imageHeight = isDesktop ? 650 : width * 1.2;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowShareModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsFavorite(!isFavorite)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? COLORS.error : COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
          <View style={[styles.imageSection, isDesktop && styles.imageSectionDesktop]}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
                setSelectedImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {images.length > 0 ? (
                images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={{ width: imageWidth, height: imageHeight }}
                    resizeMode="cover"
                  />
                ))
              ) : (
                <View style={[styles.imagePlaceholder, { width: imageWidth, height: imageHeight }]}>
                  <Ionicons name="image-outline" size={64} color={COLORS.textTertiary} />
                  <Text style={styles.placeholderText}>Sem imagem</Text>
                </View>
              )}
            </ScrollView>

            {images.length > 1 && (
              <View style={styles.imageIndicators}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      selectedImageIndex === index && styles.indicatorActive,
                    ]}
                  />
                ))}
              </View>
            )}

            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discountPercent}%</Text>
              </View>
            )}
          </View>

          <View style={[styles.contentSection, isDesktop && styles.contentSectionDesktop]}>
            <View style={styles.contentCard}>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatPrice(priceValue)}</Text>
                {hasDiscount && (
                  <Text style={styles.originalPrice}>{formatPrice(originalPrice)}</Text>
                )}
              </View>

              <Text style={styles.title}>{product.title}</Text>
              {product.brand && (
                <Text style={styles.brand}>{product.brand}</Text>
              )}

              <View style={styles.tagsRow}>
                {product.size && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Tam {product.size}</Text>
                  </View>
                )}
                {product.condition && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{product.condition}</Text>
                  </View>
                )}
              </View>

              {product.description ? (
                <Text style={styles.description}>{product.description}</Text>
              ) : null}

              <View style={styles.sellerCard}>
                <View style={styles.sellerAvatar}>
                  {product.seller_avatar ? (
                    <Image source={{ uri: product.seller_avatar }} style={styles.sellerAvatarImage} />
                  ) : (
                    <Text style={styles.sellerInitial}>
                      {(product.seller_name || 'A').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{product.seller_name || 'Vendedor Apega'}</Text>
                  <View style={styles.sellerMeta}>
                    <Ionicons name="star" size={12} color={COLORS.premium} />
                    <Text style={styles.sellerMetaText}>{product.seller_rating || 0} de 5</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {!isDesktop && (
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleBuyNow}>
            <Text style={styles.primaryButtonText}>Comprar por {formatPrice(priceValue)}</Text>
          </TouchableOpacity>
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleAddToCart}>
              <Ionicons name="bag-add-outline" size={18} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Sacola</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowOfferModal(true)}>
              <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Oferta</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        itemTitle={product.title}
        itemImage={images[0]}
      />

      <OfferModal
        visible={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        item={product}
        onOfferSubmit={(value) => {
          Alert.alert('Oferta enviada', `Sua oferta de ${formatPrice(value)} foi enviada.`);
          setShowOfferModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  mainLayout: {
    flex: 1,
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
    paddingHorizontal: 60,
    paddingTop: 20,
  },
  imageSectionDesktop: {
    width: '55%'
  },
  contentSectionDesktop: {
    width: '45%'
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
  placeholderText: {
    marginTop: 12,
    color: COLORS.textTertiary,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  discountText: {
    color: COLORS.textInverse,
    fontWeight: '700',
    fontSize: 12,
  },
  contentCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginTop: -20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 12,
  },
  price: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textDecorationLine: 'line-through',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  brand: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  sellerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primaryExtraLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  sellerInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sellerMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    justifyContent: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
});
