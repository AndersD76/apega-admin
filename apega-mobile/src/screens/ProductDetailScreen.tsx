import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Alert,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import { productsService, favoritesService, cartService } from '../api';
import { formatPrice } from '../utils/format';
import { AdBanner } from '../components';
import { SellerBadges } from '../components/SellerBadges';
import { colors } from '../theme';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800';

export function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params || {};
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerValue, setOfferValue] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await productsService.getProduct(productId);
      if (res.product) {
        setProduct(res.product);
        setIsFavorite(res.product.is_favorited || false);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    try {
      if (isFavorite) {
        await favoritesService.removeFavorite(product.id);
      } else {
        await favoritesService.addFavorite(product.id);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      setIsFavorite(!isFavorite);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Confira: ${product.title} por R$ ${formatPrice(product.price)} no Largô!`,
      });
    } catch (error) {}
  };

  const handleBuy = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('Checkout', {
      productId: product.id,
      product: product
    });
  };

  const handleOpenOffer = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    setOfferValue('');
    setShowOfferModal(true);
  };

  const handleSendOffer = async () => {
    const numericValue = parseInt(offerValue.replace(/[^0-9]/g, ''), 10);
    if (!numericValue || numericValue <= 0) {
      Alert.alert('Valor inválido', 'Digite um valor válido para sua oferta.');
      return;
    }

    setSendingOffer(true);
    try {
      // TODO: Implement API call to send offer
      // await offersService.createOffer({ productId: product.id, amount: numericValue });

      setShowOfferModal(false);
      Alert.alert(
        'Oferta enviada!',
        `Sua oferta de R$ ${formatPrice(numericValue)} foi enviada ao vendedor.`,
        [{ text: 'Ver minhas ofertas', onPress: () => navigation.navigate('Offers') }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar sua oferta. Tente novamente.');
    } finally {
      setSendingOffer(false);
    }
  };

  const formatInputValue = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    const num = parseInt(numericValue, 10);
    return num.toLocaleString('pt-BR');
  };

  const handleSellerPress = () => {
    navigation.navigate('SellerProfile', {
      sellerId: product.seller?.id || product.seller_id,
    });
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    setAddingToCart(true);
    try {
      const result = await cartService.addToCart(product.id);
      if (result.success) {
        Alert.alert(
          'Adicionado!',
          'Produto adicionado ao carrinho',
          [
            { text: 'Continuar comprando' },
            { text: 'Ver carrinho', onPress: () => navigation.navigate('Cart') },
          ]
        );
      } else {
        Alert.alert('Erro', result.message || 'Nao foi possivel adicionar ao carrinho');
      }
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.message || 'Nao foi possivel adicionar ao carrinho');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading || !product) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  // Normalizar imagens - podem vir como strings ou objetos com image_url
  const images = product.images?.length > 0
    ? product.images.map((img: any) => typeof img === 'string' ? img : img.image_url)
    : [product.image_url || PLACEHOLDER_IMAGE];
  const seller = product.seller || {
    id: product.seller_id,
    name: product.seller_name || 'Vendedor',
    avatar: product.seller_avatar,
    city: product.seller_city || 'Brasil',
    rating: product.seller_rating || 5.0,
    sales: 0,
  };

  // Badges do vendedor (mockados por enquanto - sera integrado com API)
  const sellerBadges = product.seller?.badges || ['fast_shipper', 'quick_responder', 'good_photos'];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={[styles.gallery, { height: width }]}>
          <Image
            source={{ uri: images[activeImage] }}
            style={styles.mainImage}
            contentFit="cover"
          />

          {/* Back & Actions */}
          <View style={[styles.galleryHeader, { paddingTop: insets.top + 8 }]}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </Pressable>
            <View style={styles.galleryActions}>
              <Pressable style={styles.actionBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color="#1A1A1A" />
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={handleFavorite}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#FF6B6B' : '#1A1A1A'} />
              </Pressable>
            </View>
          </View>

          {/* Discount Badge */}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <View style={styles.thumbnails}>
              {images.map((img: string, index: number) => (
                <Pressable
                  key={index}
                  style={[styles.thumbnail, activeImage === index && styles.thumbnailActive]}
                  onPress={() => setActiveImage(index)}
                >
                  <Image source={{ uri: img }} style={styles.thumbnailImg} contentFit="cover" />
                </Pressable>
              ))}
              {/* Label Photo Thumbnail */}
              {product.label_image_url && (
                <Pressable
                  style={styles.labelThumbnail}
                  onPress={() => Alert.alert('Foto da Etiqueta', 'Esta e a foto da etiqueta original do produto.', [{ text: 'OK' }])}
                >
                  <Image source={{ uri: product.label_image_url }} style={styles.thumbnailImg} contentFit="cover" />
                  <View style={styles.labelThumbnailBadge}>
                    <Ionicons name="pricetag" size={10} color="#fff" />
                  </View>
                </Pressable>
              )}
            </View>
          )}
          {/* Label Photo when no other thumbnails */}
          {images.length <= 1 && product.label_image_url && (
            <View style={styles.thumbnails}>
              <Pressable
                style={styles.labelThumbnail}
                onPress={() => Alert.alert('Foto da Etiqueta', 'Esta e a foto da etiqueta original do produto.', [{ text: 'OK' }])}
              >
                <Image source={{ uri: product.label_image_url }} style={styles.thumbnailImg} contentFit="cover" />
                <View style={styles.labelThumbnailBadge}>
                  <Ionicons name="pricetag" size={10} color="#fff" />
                </View>
              </Pressable>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.content}>
          {/* Brand & Title */}
          <View style={styles.brandRow}>
            <Text style={styles.brand}>{product.brand || 'Marca'}</Text>
            {(product.has_label_photo || product.label_image_url) && (
              <View style={styles.labelVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#5B8C5A" />
                <Text style={styles.labelVerifiedText}>Etiqueta verificada</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{product.title}</Text>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>R$ {formatPrice(product.price)}</Text>
            {product.original_price && (
              <Text style={styles.originalPrice}>R$ {formatPrice(product.original_price)}</Text>
            )}
          </View>

          {/* Tags */}
          <View style={styles.tags}>
            {product.condition && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{product.condition}</Text>
              </View>
            )}
            {product.size && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>Tam. {product.size}</Text>
              </View>
            )}
            {product.color && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{product.color}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.description}>{product.description || 'Sem descrição disponível.'}</Text>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhes</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Categoria</Text>
                <Text style={styles.detailValue}>{product.category_name || product.category || 'Roupas'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Marca</Text>
                <Text style={styles.detailValue}>{product.brand || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tamanho</Text>
                <Text style={styles.detailValue}>{product.size || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Condição</Text>
                <Text style={styles.detailValue}>{product.condition || '-'}</Text>
              </View>
              {product.color && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Cor</Text>
                  <Text style={styles.detailValue}>{product.color}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Seller */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendedor</Text>
            <Pressable style={styles.sellerCard} onPress={handleSellerPress}>
              <Image source={{ uri: seller.avatar || product.seller_avatar }} style={styles.sellerAvatar} contentFit="cover" />
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{seller.name || product.seller_name}</Text>
                <View style={styles.sellerMeta}>
                  <Ionicons name="location-outline" size={14} color="#737373" />
                  <Text style={styles.sellerLocation}>{seller.city || product.seller_city || 'Brasil'}</Text>
                </View>
                <View style={styles.sellerStats}>
                  <View style={styles.sellerStat}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.sellerStatText}>{seller.rating || product.seller_rating || '5.0'}</Text>
                  </View>
                  <Text style={styles.sellerStatDivider}>•</Text>
                  <Text style={styles.sellerStatText}>{seller.sales || 0} vendas</Text>
                </View>
                {/* Seller Badges - Largometro */}
                {sellerBadges.length > 0 && (
                  <View style={styles.sellerBadgesRow}>
                    <SellerBadges badges={sellerBadges} size="sm" maxBadges={3} />
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A3A3A3" />
            </Pressable>
          </View>

          {/* Ad Banner */}
          <View style={styles.adSection}>
            <AdBanner size="mediumRectangle" />
          </View>

          {/* Views */}
          <View style={styles.viewsRow}>
            <Ionicons name="eye-outline" size={16} color="#A3A3A3" />
            <Text style={styles.viewsText}>{product.views || 0} visualizações</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={styles.offerBtn} onPress={handleOpenOffer}>
          <Ionicons name="cash-outline" size={20} color={colors.primary} />
          <Text style={styles.offerBtnText}>Fazer oferta</Text>
        </Pressable>
        <Pressable
          style={[styles.cartBtn, addingToCart && styles.cartBtnDisabled]}
          onPress={handleAddToCart}
          disabled={addingToCart}
        >
          <Ionicons name="cart-outline" size={22} color={colors.primary} />
          <Text style={styles.cartBtnText}>{addingToCart ? 'Adicionando...' : 'Adicionar'}</Text>
        </Pressable>
        <Pressable style={styles.buyBtn} onPress={handleBuy}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.buyBtnGrad}>
            <Ionicons name="bag-outline" size={20} color="#fff" />
            <Text style={styles.buyBtnText}>Pegar</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Offer Modal */}
      <Modal
        visible={showOfferModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOfferModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowOfferModal(false)} />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fazer oferta</Text>
              <Pressable style={styles.modalCloseBtn} onPress={() => setShowOfferModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </Pressable>
            </View>

            <Text style={styles.modalProductTitle} numberOfLines={2}>{product?.title}</Text>
            <Text style={styles.modalProductPrice}>Preço atual: R$ {formatPrice(product?.price || 0)}</Text>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalCurrencyPrefix}>R$</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0"
                placeholderTextColor="#A1A1AA"
                keyboardType="numeric"
                value={formatInputValue(offerValue)}
                onChangeText={(text) => setOfferValue(text.replace(/[^0-9]/g, ''))}
                maxLength={10}
                autoFocus
              />
            </View>

            <Text style={styles.modalHint}>
              Dica: Ofertas entre 70-90% do valor original têm mais chances de serem aceitas
            </Text>

            <Pressable
              style={[styles.modalSubmitBtn, (!offerValue || sendingOffer) && styles.modalSubmitBtnDisabled]}
              onPress={handleSendOffer}
              disabled={!offerValue || sendingOffer}
            >
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.modalSubmitBtnText}>
                {sendingOffer ? 'Enviando...' : 'Enviar oferta'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: '#737373' },

  // Gallery
  gallery: { position: 'relative', backgroundColor: '#F5F5F5' },
  mainImage: { width: '100%', height: '100%' },
  galleryHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } as any,
  galleryActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } as any,
  discountBadge: { position: 'absolute', top: 80, left: 16, backgroundColor: '#FF6B6B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  discountText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  thumbnails: { position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', gap: 8 },
  thumbnail: { width: 50, height: 50, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbnailActive: { borderColor: colors.primary },
  thumbnailImg: { width: '100%', height: '100%' },

  // Label Thumbnail
  labelThumbnail: { width: 50, height: 50, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#5B8C5A', position: 'relative' },
  labelThumbnailBadge: { position: 'absolute', bottom: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#5B8C5A', alignItems: 'center', justifyContent: 'center' },

  // Content
  content: { padding: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  labelVerifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  labelVerifiedText: { fontSize: 11, fontWeight: '600', color: '#5B8C5A' },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginTop: 4, lineHeight: 28 },
  priceSection: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 12 },
  price: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  originalPrice: { fontSize: 18, color: '#A3A3A3', textDecorationLine: 'line-through' },
  tags: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F5F5F5' },
  tagText: { fontSize: 12, fontWeight: '500', color: '#525252', textTransform: 'capitalize' },

  // Sections
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  description: { fontSize: 15, color: '#525252', lineHeight: 22 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailItem: { width: '50%', marginBottom: 12 },
  detailLabel: { fontSize: 12, color: '#737373' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#1A1A1A', marginTop: 2, textTransform: 'capitalize' },

  // Seller
  sellerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12 },
  sellerAvatar: { width: 50, height: 50, borderRadius: 25 },
  sellerInfo: { flex: 1, marginLeft: 12 },
  sellerName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  sellerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  sellerLocation: { fontSize: 13, color: '#737373' },
  sellerStats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sellerStat: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sellerStatText: { fontSize: 12, color: '#525252' },
  sellerStatDivider: { fontSize: 12, color: '#A3A3A3' },
  sellerBadgesRow: { marginTop: 8 },

  // Ad Section
  adSection: { marginTop: 24, alignItems: 'center' },

  // Views
  viewsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, justifyContent: 'center' },
  viewsText: { fontSize: 13, color: '#A3A3A3' },

  // Bottom Bar
  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  offerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, paddingHorizontal: 14, borderRadius: 24, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#FEE2E2' },
  offerBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  cartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, paddingHorizontal: 14, borderRadius: 24, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#fff' },
  cartBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  cartBtnDisabled: { opacity: 0.6 },
  buyBtn: { flex: 1, height: 48 },
  buyBtnGrad: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24 },
  buyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Offer Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { backgroundColor: '#FEFCF9', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#18181B' },
  modalCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' },
  modalProductTitle: { fontSize: 15, fontWeight: '500', color: '#52525B', marginBottom: 4 },
  modalProductPrice: { fontSize: 14, color: '#A1A1AA', marginBottom: 20 },
  modalInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: '#E4E4E7', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12 },
  modalCurrencyPrefix: { fontSize: 20, fontWeight: '700', color: '#18181B', marginRight: 8 },
  modalInput: { flex: 1, fontSize: 28, fontWeight: '700', color: '#18181B', padding: 0 },
  modalHint: { fontSize: 12, color: '#71717A', marginBottom: 20, lineHeight: 18 },
  modalSubmitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, gap: 8 },
  modalSubmitBtnDisabled: { backgroundColor: '#A1A1AA' },
  modalSubmitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default ProductDetailScreen;
