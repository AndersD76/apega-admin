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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { ShareModal, OfferModal } from '../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 768;

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
        <View style={styles.emptyIcon}>
          <Ionicons name="alert-circle-outline" size={48} color="#ddd" />
        </View>
        <Text style={styles.errorText}>Item não encontrado</Text>
      </View>
    );
  }

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null || isNaN(price)) return 'R$ 0';
    return `R$ ${price.toFixed(0)}`;
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

  const imageWidth = isDesktop ? width * 0.5 : width;
  const imageHeight = isDesktop ? 600 : width * 1.2;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, isFavorite && styles.headerButtonFavorite]}
            onPress={() => setIsFavorite(!isFavorite)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#FF6B6B' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
          {/* Images */}
          <View style={[styles.imageSection, isDesktop && styles.imageSectionDesktop]}>
            <View style={styles.imageContainer}>
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
                  images.map((image: string, index: number) => (
                    <Image
                      key={index}
                      source={{ uri: image }}
                      style={[styles.image, { width: imageWidth, height: imageHeight }]}
                      resizeMode="cover"
                    />
                  ))
                ) : (
                  <View style={[styles.imagePlaceholder, { width: imageWidth, height: imageHeight }]}>
                    <Ionicons name="image-outline" size={64} color="#ddd" />
                  </View>
                )}
              </ScrollView>

              {images.length > 1 && (
                <View style={styles.imageDots}>
                  {images.map((_: string, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        selectedImageIndex === index && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              )}

              {discount > 0 && (
                <View style={[styles.discountBadge, { top: insets.top + 60 }]}>
                  <Text style={styles.discountText}>-{discount}%</Text>
                </View>
              )}
            </View>
          </View>

          {/* Content */}
          <View style={[styles.contentSection, isDesktop && styles.contentSectionDesktop]}>
            <View style={styles.content}>
              {/* Price */}
              <View style={styles.priceSection}>
                <Text style={styles.price}>{formatPrice(item.price)}</Text>
                {item.originalPrice && (
                  <Text style={styles.originalPrice}>
                    {formatPrice(item.originalPrice)}
                  </Text>
                )}
              </View>

              {/* Title */}
              <View style={styles.titleSection}>
                {item.brand && (
                  <Text style={styles.brand}>{item.brand}</Text>
                )}
                <Text style={styles.title}>{item.title}</Text>
              </View>

              {/* Attributes */}
              <View style={styles.attributes}>
                {item.size && (
                  <View style={styles.attribute}>
                    <Ionicons name="resize-outline" size={16} color="#666" />
                    <Text style={styles.attributeText}>{item.size}</Text>
                  </View>
                )}
                {item.condition && (
                  <View style={[styles.attribute, styles.attributeCondition]}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                    <Text style={[styles.attributeText, { color: COLORS.primary }]}>
                      {item.condition === 'novo' ? 'Novo' :
                       item.condition === 'seminovo' ? 'Seminovo' : 'Usado'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Desktop CTA */}
              {isDesktop && (
                <View style={styles.desktopCTA}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.9}
                    onPress={handleBuyNow}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, '#4a7c59']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryButtonGradient}
                    >
                      <Ionicons name="bag-check" size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>Comprar Agora</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.secondaryButtons}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      activeOpacity={0.8}
                      onPress={handleAddToCart}
                    >
                      <Ionicons name="bag-add-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.secondaryButtonText}>Sacolinha</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryButton}
                      activeOpacity={0.8}
                      onPress={handleMakeOffer}
                    >
                      <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
                      <Text style={styles.secondaryButtonText}>Fazer Oferta</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Description */}
              {item.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Descrição</Text>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
              )}

              {/* Seller */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vendedor</Text>
                <TouchableOpacity
                  style={styles.sellerCard}
                  activeOpacity={0.8}
                  onPress={handleViewSeller}
                >
                  <View style={styles.sellerAvatar}>
                    <Ionicons name="person" size={24} color="#fff" />
                  </View>
                  <View style={styles.sellerInfo}>
                    <Text style={styles.sellerName}>
                      {item.seller?.name || 'Vendedor Apega'}
                    </Text>
                    <View style={styles.sellerMeta}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.sellerStats}>
                        {item.seller?.sales || 0} vendas
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              </View>

              {/* Guarantees */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Por que comprar aqui?</Text>
                <View style={styles.guarantees}>
                  <View style={styles.guarantee}>
                    <View style={[styles.guaranteeIcon, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                    </View>
                    <View style={styles.guaranteeContent}>
                      <Text style={styles.guaranteeTitle}>Compra Protegida</Text>
                      <Text style={styles.guaranteeText}>Seu dinheiro de volta se não gostar</Text>
                    </View>
                  </View>
                  <View style={styles.guarantee}>
                    <View style={[styles.guaranteeIcon, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="swap-horizontal" size={20} color="#2196F3" />
                    </View>
                    <View style={styles.guaranteeContent}>
                      <Text style={styles.guaranteeTitle}>Troca Grátis</Text>
                      <Text style={styles.guaranteeText}>7 dias para trocar ou devolver</Text>
                    </View>
                  </View>
                  <View style={styles.guarantee}>
                    <View style={[styles.guaranteeIcon, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons name="leaf" size={20} color="#FF9800" />
                    </View>
                    <View style={styles.guaranteeContent}>
                      <Text style={styles.guaranteeTitle}>Moda Sustentável</Text>
                      <Text style={styles.guaranteeText}>Peças com história e propósito</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={{ height: 180 }} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer (Mobile Only) */}
      {!isDesktop && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.9}
            onPress={handleBuyNow}
          >
            <LinearGradient
              colors={[COLORS.primary, '#4a7c59']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Comprar por {formatPrice(item.price)}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={handleAddToCart}
            >
              <Ionicons name="bag-add-outline" size={18} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Sacolinha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={handleMakeOffer}
            >
              <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Oferta</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },

  // Header
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
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonFavorite: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },

  scrollView: {
    flex: 1,
  },

  // Layout
  mainLayout: {
    flex: 1,
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
  },
  imageSection: {},
  imageSectionDesktop: {
    width: '50%',
    position: 'sticky' as any,
    top: 0,
  },
  contentSection: {},
  contentSectionDesktop: {
    width: '50%',
    paddingLeft: 40,
  },

  // Image
  imageContainer: {
    position: 'relative',
  },
  image: {
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageDots: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  discountBadge: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Content
  content: {
    padding: 20,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  titleSection: {
    marginBottom: 16,
  },
  brand: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 28,
  },

  // Attributes
  attributes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  attribute: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  attributeCondition: {
    backgroundColor: '#E8F5E9',
  },
  attributeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },

  // Desktop CTA
  desktopCTA: {
    marginBottom: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },

  // Seller
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 16,
  },
  sellerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerStats: {
    fontSize: 13,
    color: '#666',
  },

  // Guarantees
  guarantees: {
    gap: 16,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guaranteeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  guaranteeContent: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  guaranteeText: {
    fontSize: 13,
    color: '#666',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
    ...Platform.select({
      web: { boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  primaryButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 12,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
