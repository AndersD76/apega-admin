import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { ShareModal, OfferModal } from '../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

const { width } = Dimensions.get('window');

export default function ItemDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { item } = route.params;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  if (!item) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Item não encontrado</Text>
      </View>
    );
  }

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null || isNaN(price)) return 'R$ 0,00';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const images = item.images && item.images.length > 0
    ? item.images
    : item.imageUrl ? [item.imageUrl] : [];

  const discount = item.discount || (item.originalPrice
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : 0);

  const handleBuyNow = () => {
    navigation.navigate('Checkout', { item });
  };

  const handleAddToCart = () => {
    Alert.alert('Sucesso!', 'Produto adicionado à sacolinha!');
  };

  const handleMakeOffer = () => {
    setShowOfferModal(true);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleViewSeller = () => {
    Alert.alert('Perfil do Vendedor', 'Abrindo perfil do vendedor...');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsFavorite(!isFavorite)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#FF385C' : COLORS.white}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {images.length > 1 && (
            <>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {selectedImageIndex + 1}/{images.length}
                </Text>
              </View>

              <View style={styles.imageDots}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      selectedImageIndex === index && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            </>
          )}

          {discount > 0 && (
            <View style={[styles.discountBadge, { top: insets.top + 60 }]}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.mainInfo}>
            <View style={styles.priceSection}>
              {item.originalPrice && (
                <Text style={styles.originalPrice}>
                  De {formatPrice(item.originalPrice)}
                </Text>
              )}
              <Text style={styles.price}>
                {formatPrice(item.price)}
              </Text>
            </View>

            <View style={styles.titleSection}>
              <Text style={styles.brand}>{item.brand || 'Marca'}</Text>
              <Text style={styles.title}>{item.title}</Text>
            </View>

            <View style={styles.attributes}>
              {item.size && (
                <View style={styles.attribute}>
                  <Text style={styles.attributeLabel}>Tamanho</Text>
                  <Text style={styles.attributeValue}>{item.size}</Text>
                </View>
              )}
              {item.condition && (
                <View style={styles.attribute}>
                  <Text style={styles.attributeLabel}>Estado</Text>
                  <Text style={styles.attributeValue}>
                    {item.condition === 'novo' ? 'Novo com etiqueta' :
                     item.condition === 'seminovo' ? 'Seminovo' : 'Usado'}
                  </Text>
                </View>
              )}
              {item.color && (
                <View style={styles.attribute}>
                  <Text style={styles.attributeLabel}>Cor</Text>
                  <Text style={styles.attributeValue}>{item.color}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {item.description && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Descrição</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendedor</Text>
            <TouchableOpacity
              style={styles.sellerCard}
              activeOpacity={0.8}
              onPress={handleViewSeller}
            >
              <View style={styles.sellerAvatar}>
                <Ionicons name="person" size={24} color={COLORS.white} />
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>
                  {item.seller?.name || 'Vendedor Apega'}
                </Text>
                <Text style={styles.sellerStats}>
                  {item.seller?.sales || 0} vendas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Garantias</Text>
            <View style={styles.guarantees}>
              <View style={styles.guarantee}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.guaranteeText}>Produto autêntico verificado</Text>
              </View>
              <View style={styles.guarantee}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.guaranteeText}>Troca grátis em 7 dias</Text>
              </View>
              <View style={styles.guarantee}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.guaranteeText}>Entrega segura</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 180 }} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={handleBuyNow}
        >
          <Text style={styles.primaryButtonText}>EU QUERO</Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={handleAddToCart}
          >
            <Ionicons name="bag-outline" size={16} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>sacolinha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={handleMakeOffer}
          >
            <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>fazer oferta</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        itemTitle={item.title}
        itemImage={images[0]}
      />

      <OfferModal
        visible={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        item={item}
        onOfferSubmit={(value) => {
          Alert.alert('Oferta Enviada!', `Sua oferta de ${formatPrice(value)} foi enviada ao vendedor.`);
          setShowOfferModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[600],
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width,
    height: width * 1.33,
    backgroundColor: COLORS.gray[200],
  },
  imageCounter: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
  },
  imageCounterText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  imageDots: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    width: 20,
    backgroundColor: COLORS.white,
  },
  discountBadge: {
    position: 'absolute',
    right: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.md,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    backgroundColor: COLORS.white,
  },
  mainInfo: {
    padding: SPACING.lg,
  },
  priceSection: {
    marginBottom: SPACING.md,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.gray[500],
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  titleSection: {
    marginBottom: SPACING.md,
  },
  brand: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  attributes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  attribute: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  attributeLabel: {
    fontSize: 11,
    color: COLORS.gray[600],
    marginBottom: 2,
  },
  attributeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 8,
    backgroundColor: COLORS.background,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[700],
    lineHeight: 22,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  sellerStats: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  guarantees: {
    gap: SPACING.sm,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  guaranteeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[700],
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    padding: SPACING.md,
    ...SHADOWS.lg,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.lg,
    gap: 5,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
