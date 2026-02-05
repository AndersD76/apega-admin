import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import { usersService, SellerProfile, SellerProduct } from '../api/users';
import { formatPrice } from '../utils/format';
import { colors } from '../theme';
import { SellerBadges } from '../components/SellerBadges';
import { SELLER_BADGES } from '../constants/badges';
import { ProfileSkeleton } from '../components/ProfileSkeleton';

const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200';

export function SellerProfileScreen({ route, navigation }: any) {
  const { sellerId } = route.params || {};
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productWidth = (width - 48) / 2;

  useEffect(() => {
    if (!sellerId) {
      setError('Vendedor não encontrado');
      setLoading(false);
      return;
    }
    fetchData();
  }, [sellerId]);

  const fetchData = async () => {
    if (!sellerId) {
      setError('Vendedor não encontrado');
      setLoading(false);
      return;
    }

    setError(null);
    try {
      const [profileRes, productsRes] = await Promise.all([
        usersService.getSellerProfile(sellerId),
        usersService.getSellerProducts(sellerId),
      ]);

      if (profileRes.success) {
        setSeller(profileRes.user);
        setIsFollowing(profileRes.user.is_following || false);
      } else {
        setError('Vendedor não encontrado');
      }
      if (productsRes.success) {
        setProducts(productsRes.products);
      }
    } catch (error: any) {
      console.error('Error fetching seller:', error);
      setError(error?.response?.data?.message || 'Erro ao carregar perfil do vendedor');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    try {
      if (isFollowing) {
        await usersService.unfollowUser(sellerId);
        setIsFollowing(false);
        if (seller) {
          setSeller({ ...seller, total_followers: seller.total_followers - 1 });
        }
      } else {
        await usersService.followUser(sellerId);
        setIsFollowing(true);
        if (seller) {
          setSeller({ ...seller, total_followers: seller.total_followers + 1 });
        }
      }
    } catch (error) {
      console.error('Error following:', error);
    }
  };

  const handleMessage = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('Chat', {
      sellerId: seller?.id,
      sellerName: seller?.name || 'Vendedor',
    });
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  if (loading) {
    return (
      <ProfileSkeleton showProducts={true} productCount={4} />
    );
  }

  if (error || !seller) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorHeader}>
          <Pressable style={styles.errorBackBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.errorHeaderTitle}>Perfil do Vendedor</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#D4D4D4" />
          <Text style={styles.errorTitle}>{error || 'Vendedor não encontrado'}</Text>
          <Text style={styles.errorSubtitle}>Não foi possível carregar o perfil</Text>
          <Pressable style={styles.errorBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.errorBtnText}>Voltar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isOwnProfile = user?.id === sellerId;
  const memberSince = new Date(seller.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Badges conquistados pelo vendedor (mockados por enquanto - sera integrado com API)
  const earnedBadges = (seller as any)?.badges || ['fast_shipper', 'quick_responder', 'eco_friendly'];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>

          <View style={styles.profileSection}>
            <Image
              source={{ uri: seller.avatar_url || PLACEHOLDER_AVATAR }}
              style={styles.avatar}
              contentFit="cover"
            />

            <View style={styles.nameBadge}>
              <Text style={styles.sellerName}>{seller.store_name || seller.name}</Text>
              {seller.is_verified && (
                <Ionicons name="checkmark-circle" size={18} color="#FFD700" />
              )}
              {seller.subscription_type === 'premium' && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                </View>
              )}
            </View>

            {seller.city && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.locationText}>
                  {seller.city}{seller.state ? `, ${seller.state}` : ''}
                </Text>
              </View>
            )}

            {seller.bio && (
              <Text style={styles.bio} numberOfLines={2}>{seller.bio}</Text>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{products.length}</Text>
              <Text style={styles.statLabel}>Anúncios</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{seller.total_sales}</Text>
              <Text style={styles.statLabel}>Vendas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.statValue}>{seller.rating ? Number(seller.rating).toFixed(1) : '5.0'}</Text>
              </View>
              <Text style={styles.statLabel}>{seller.total_reviews} avaliações</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{seller.total_followers}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Actions */}
        {!isOwnProfile && (
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.followBtn, isFollowing && styles.followBtnActive]}
              onPress={handleFollow}
            >
              <Ionicons
                name={isFollowing ? 'checkmark' : 'person-add-outline'}
                size={18}
                color={isFollowing ? colors.primary : '#fff'}
              />
              <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </Text>
            </Pressable>

            <Pressable style={styles.messageBtn} onPress={handleMessage}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
              <Text style={styles.messageBtnText}>Mensagem</Text>
            </Pressable>
          </View>
        )}

        {/* Member Since */}
        <View style={styles.memberSince}>
          <Ionicons name="calendar-outline" size={14} color="#A3A3A3" />
          <Text style={styles.memberSinceText}>Membro desde {memberSince}</Text>
        </View>

        {/* Largometro - Badges Section */}
        <View style={styles.largometroSection}>
          <View style={styles.largometroHeader}>
            <View style={styles.largometroTitleRow}>
              <Ionicons name="ribbon-outline" size={20} color={colors.primary} />
              <Text style={styles.largometroTitle}>Largometro</Text>
            </View>
            <Text style={styles.largometroBadgeCount}>
              {earnedBadges.length}/{SELLER_BADGES.length} conquistados
            </Text>
          </View>
          <View style={styles.largometroBadgesContainer}>
            <SellerBadges
              badges={earnedBadges}
              size="md"
              showLabels
              showAllBadges
              earnedBadges={earnedBadges}
            />
          </View>
        </View>

        {/* Products */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Peças largadas ({products.length})</Text>

          {products.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Ionicons name="shirt-outline" size={48} color="#D4D4D4" />
              <Text style={styles.emptyText}>Nenhuma peça largada ainda</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {products.map((product) => (
                <Pressable
                  key={product.id}
                  style={[styles.productCard, { width: productWidth }]}
                  onPress={() => handleProductPress(product.id)}
                >
                  <Image
                    source={{ uri: product.image_url || 'https://via.placeholder.com/200' }}
                    style={[styles.productImage, { height: productWidth * 1.2 }]}
                    contentFit="cover"
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productBrand} numberOfLines={1}>
                      {product.brand || 'Marca'}
                    </Text>
                    <Text style={styles.productTitle} numberOfLines={1}>
                      {product.title}
                    </Text>
                    <Text style={styles.productPrice}>R$ {formatPrice(product.price)}</Text>
                    <View style={styles.productTags}>
                      {product.size && (
                        <View style={styles.productTag}>
                          <Text style={styles.productTagText}>{product.size}</Text>
                        </View>
                      )}
                      {product.condition && (
                        <View style={styles.productTag}>
                          <Text style={styles.productTagText}>{product.condition}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },

  // Header
  header: { paddingBottom: 24, paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },

  // Profile
  profileSection: { alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff' },
  nameBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  sellerName: { fontSize: 22, fontWeight: '700', color: '#fff' },
  premiumBadge: { backgroundColor: 'rgba(255,215,0,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  bio: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 8, paddingHorizontal: 24 },

  // Stats
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#fff' },
  followBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 22, backgroundColor: colors.primary },
  followBtnActive: { backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary },
  followBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  followBtnTextActive: { color: colors.primary },
  messageBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#fff' },
  messageBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  // Member Since
  memberSince: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  memberSinceText: { fontSize: 13, color: '#A3A3A3' },

  // Largometro
  largometroSection: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  largometroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  largometroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  largometroTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  largometroBadgeCount: { fontSize: 13, color: '#737373' },
  largometroBadgesContainer: { paddingVertical: 8 },

  // Products
  productsSection: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  emptyProducts: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, backgroundColor: '#fff', borderRadius: 12 },
  emptyText: { fontSize: 14, color: '#A3A3A3', marginTop: 12 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  productCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  productImage: { width: '100%' },
  productInfo: { padding: 10 },
  productBrand: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  productTitle: { fontSize: 13, fontWeight: '500', color: '#1A1A1A', marginTop: 2 },
  productPrice: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
  productTags: { flexDirection: 'row', gap: 6, marginTop: 6 },
  productTag: { backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  productTagText: { fontSize: 10, color: '#737373', textTransform: 'capitalize' },

  // Error State
  errorHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  errorBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  errorHeaderTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: '#525252', marginTop: 16, textAlign: 'center' },
  errorSubtitle: { fontSize: 14, color: '#A3A3A3', marginTop: 8, textAlign: 'center' },
  errorBtn: { marginTop: 24, paddingHorizontal: 32, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 24 },
  errorBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default SellerProfileScreen;
