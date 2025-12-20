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
const isDesktop = isWeb && width > 900;

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
          <Ionicons name="bag-outline" size={64} color={COLORS.primary} />
        </View>
        <Text style={styles.errorText}>Item não encontrado</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
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

  const imageWidth = isDesktop ? width * 0.5 : width;
  const imageHeight = isDesktop ? 650 : width * 1.25;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header Flutuante */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
            style={styles.headerBtnGradient}
          >
            <Ionicons name="arrow-back" size={22} color="#333" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
              style={styles.headerBtnGradient}
            >
              <Ionicons name="share-social-outline" size={20} color="#333" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setIsFavorite(!isFavorite)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isFavorite ? [COLORS.primary, COLORS.primaryDark] : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
              style={styles.headerBtnGradient}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? '#fff' : '#333'}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
          {/* Imagens */}
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
                    <Ionicons name="image-outline" size={80} color={COLORS.gray[300]} />
                    <Text style={styles.placeholderText}>Sem imagem</Text>
                  </View>
                )}
              </ScrollView>

              {/* Indicadores de imagem */}
              {images.length > 1 && (
                <View style={styles.imageIndicators}>
                  {images.map((_: string, index: number) => (
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

              {/* Badge de desconto */}
              {discount > 0 && (
                <View style={[styles.discountBadge, { top: insets.top + 70 }]}>
                  <LinearGradient
                    colors={['#FF6B6B', '#EE5A5A']}
                    style={styles.discountGradient}
                  >
                    <Text style={styles.discountText}>-{discount}%</Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* Thumbnails */}
            {images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnails}
              >
                {images.map((image: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedImageIndex(index)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.thumbnail,
                      selectedImageIndex === index && styles.thumbnailActive,
                    ]}>
                      <Image source={{ uri: image }} style={styles.thumbnailImage} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Conteúdo */}
          <View style={[styles.contentSection, isDesktop && styles.contentSectionDesktop]}>
            <View style={styles.content}>
              {/* Preço */}
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>
                  {item.originalPrice && (
                    <Text style={styles.originalPrice}>
                      de {formatPrice(item.originalPrice)}
                    </Text>
                  )}
                </View>
                {discount > 0 && (
                  <View style={styles.saveBadge}>
                    <Ionicons name="pricetag" size={14} color={COLORS.success} />
                    <Text style={styles.saveText}>Você economiza {formatPrice((item.originalPrice || 0) - item.price)}</Text>
                  </View>
                )}
              </View>

              {/* Título e Marca */}
              <View style={styles.titleSection}>
                {item.brand && (
                  <View style={styles.brandBadge}>
                    <Ionicons name="diamond-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.brandText}>{item.brand}</Text>
                  </View>
                )}
                <Text style={styles.title}>{item.title}</Text>
              </View>

              {/* Atributos */}
              <View style={styles.attributes}>
                {item.size && (
                  <View style={styles.attribute}>
                    <Ionicons name="resize-outline" size={18} color={COLORS.primary} />
                    <View>
                      <Text style={styles.attrLabel}>Tamanho</Text>
                      <Text style={styles.attrValue}>{item.size}</Text>
                    </View>
                  </View>
                )}
                {item.condition && (
                  <View style={[styles.attribute, styles.attributeSuccess]}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                    <View>
                      <Text style={styles.attrLabel}>Condição</Text>
                      <Text style={[styles.attrValue, { color: COLORS.success }]}>
                        {item.condition === 'novo' ? 'Novo' :
                         item.condition === 'seminovo' ? 'Seminovo' : 'Usado'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* CTA Desktop */}
              {isDesktop && (
                <View style={styles.desktopCTA}>
                  <TouchableOpacity
                    style={styles.mainCTA}
                    activeOpacity={0.9}
                    onPress={handleBuyNow}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.mainCTAGradient}
                    >
                      <Ionicons name="bag-check" size={22} color="#fff" />
                      <Text style={styles.mainCTAText}>Comprar Agora</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.secondaryCTAs}>
                    <TouchableOpacity
                      style={styles.secondaryCTA}
                      activeOpacity={0.8}
                      onPress={handleAddToCart}
                    >
                      <Ionicons name="bag-add-outline" size={20} color={COLORS.primary} />
                      <Text style={styles.secondaryCTAText}>Sacolinha</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryCTA}
                      activeOpacity={0.8}
                      onPress={handleMakeOffer}
                    >
                      <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
                      <Text style={styles.secondaryCTAText}>Fazer Oferta</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Descrição */}
              {item.description && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>Descrição</Text>
                  </View>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
              )}

              {/* Vendedor */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Vendedor</Text>
                </View>
                <TouchableOpacity
                  style={styles.sellerCard}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.sellerAvatar}
                  >
                    <Text style={styles.sellerInitial}>
                      {(item.seller?.name || 'A').charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                  <View style={styles.sellerInfo}>
                    <Text style={styles.sellerName}>
                      {item.seller?.name || 'Vendedor Apega'}
                    </Text>
                    <View style={styles.sellerMeta}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.sellerStats}>
                        {item.seller?.sales || 0} vendas • Membro desde 2024
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={COLORS.gray[400]} />
                </TouchableOpacity>
              </View>

              {/* Garantias */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Por que comprar aqui</Text>
                </View>
                <View style={styles.guarantees}>
                  <View style={styles.guarantee}>
                    <View style={[styles.guaranteeIcon, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="shield-checkmark" size={22} color="#4CAF50" />
                    </View>
                    <View style={styles.guaranteeContent}>
                      <Text style={styles.guaranteeTitle}>Compra Protegida</Text>
                      <Text style={styles.guaranteeText}>Seu dinheiro de volta se não for como descrito</Text>
                    </View>
                  </View>
                  <View style={styles.guarantee}>
                    <View style={[styles.guaranteeIcon, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="swap-horizontal" size={22} color="#2196F3" />
                    </View>
                    <View style={styles.guaranteeContent}>
                      <Text style={styles.guaranteeTitle}>7 Dias para Devolver</Text>
                      <Text style={styles.guaranteeText}>Não gostou? Devolva sem complicação</Text>
                    </View>
                  </View>
                  <View style={styles.guarantee}>
                    <View style={[styles.guaranteeIcon, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons name="leaf" size={22} color="#FF9800" />
                    </View>
                    <View style={styles.guaranteeContent}>
                      <Text style={styles.guaranteeTitle}>Moda Sustentável</Text>
                      <Text style={styles.guaranteeText}>Cada peça tem história. Cada compra, um impacto.</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={{ height: 160 }} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Mobile */}
      {!isDesktop && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.footerContent}>
            <TouchableOpacity
              style={styles.mainCTA}
              activeOpacity={0.9}
              onPress={handleBuyNow}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mainCTAGradient}
              >
                <Ionicons name="bag-check" size={20} color="#fff" />
                <Text style={styles.mainCTAText}>Comprar por {formatPrice(item.price)}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footerActions}>
              <TouchableOpacity
                style={styles.footerAction}
                activeOpacity={0.8}
                onPress={handleAddToCart}
              >
                <Ionicons name="bag-add-outline" size={22} color={COLORS.primary} />
                <Text style={styles.footerActionText}>Sacolinha</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.footerAction}
                activeOpacity={0.8}
                onPress={handleMakeOffer}
              >
                <Ionicons name="cash-outline" size={22} color={COLORS.primary} />
                <Text style={styles.footerActionText}>Oferta</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#FAF9F7',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 16,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryExtraLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
    gap: 10,
  },
  headerBtn: {
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
  },
  headerBtnGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Layout
  mainLayout: {
    flex: 1,
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
    paddingHorizontal: 60,
    paddingTop: 20,
  },
  imageSection: {},
  imageSectionDesktop: {
    width: '55%',
    paddingRight: 40,
  },
  contentSection: {},
  contentSectionDesktop: {
    width: '45%',
    paddingTop: 80,
  },

  // Imagem
  imageContainer: {
    position: 'relative',
  },
  image: {
    backgroundColor: COLORS.gray[100],
  },
  imagePlaceholder: {
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.gray[400],
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    width: 28,
    backgroundColor: '#fff',
  },
  discountBadge: {
    position: 'absolute',
    right: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  discountGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Thumbnails
  thumbnails: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: isDesktop ? 0 : 16,
    paddingVertical: 16,
  },
  thumbnail: {
    width: 70,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  // Content
  content: {
    padding: isDesktop ? 0 : 24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 28,
  },
  price: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.gray[900],
    letterSpacing: -0.5,
  },
  originalPrice: {
    fontSize: 16,
    color: COLORS.gray[400],
    textDecorationLine: 'line-through',
    marginTop: 6,
  },
  saveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  titleSection: {
    marginBottom: 28,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.gray[800],
    lineHeight: 34,
  },

  // Atributos
  attributes: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  attribute: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F7',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 12,
    flex: 1,
  },
  attributeSuccess: {
    backgroundColor: COLORS.primaryExtraLight,
  },
  attrLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  attrValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray[800],
  },

  // Desktop CTA
  desktopCTA: {
    marginBottom: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },

  // CTAs
  mainCTA: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mainCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  mainCTAText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryCTAs: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryCTA: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  secondaryCTAText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },

  // Section
  section: {
    marginBottom: 32,
    backgroundColor: '#FAF9F7',
    padding: 20,
    borderRadius: 20,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.gray[800],
  },
  description: {
    fontSize: 15,
    color: COLORS.gray[600],
    lineHeight: 24,
  },

  // Seller
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sellerInitial: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerStats: {
    fontSize: 13,
    color: COLORS.gray[500],
  },

  // Garantias
  guarantees: {
    gap: 12,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  guaranteeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  guaranteeContent: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  guaranteeText: {
    fontSize: 13,
    color: COLORS.gray[500],
    lineHeight: 18,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      web: { boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 16,
      },
    }),
  },
  footerContent: {
    padding: 20,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  footerAction: {
    alignItems: 'center',
    gap: 4,
  },
  footerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
