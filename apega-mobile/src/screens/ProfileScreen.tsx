import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { BottomNavigation, Header, MainHeader } from '../components';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../contexts/AuthContext';
import { getMyProducts, Product } from '../services/products';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

type ProfileTab = 'all' | 'active' | 'sold';

export default function ProfileScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 1024;
  const isTablet = isWeb && width > 768 && width <= 1024;
  const numColumns = isDesktop ? 4 : isTablet ? 3 : 2;

  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('all');

  const contentPadding = isWeb ? 32 : 16;

  const loadProducts = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingProducts(true);
    try {
      const response = await getMyProducts(activeTab === 'all' ? undefined : activeTab);
      setProducts(response.products || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshUser();
      loadProducts();
    }
  }, [isAuthenticated, refreshUser, loadProducts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    await loadProducts();
    setRefreshing(false);
  };

  const stats = useMemo(() => {
    const activeCount = products.filter((p) => p.status === 'active').length;
    const soldCount = products.filter((p) => p.status === 'sold').length;
    return {
      active: activeCount,
      sold: soldCount,
      total: products.length,
    };
  }, [products]);

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUrl = item.image_url || (item.images && item.images[0]?.image_url) || '';
    const priceValue = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return (
      <ProductCard
        id={item.id}
        image={imageUrl}
        title={item.title}
        price={priceValue}
        originalPrice={item.original_price}
        condition={item.condition}
        numColumns={numColumns}
        onPress={() => navigation.navigate('ItemDetail', { item })}
        compact
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        {isWeb ? (
          <MainHeader navigation={navigation} title="Perfil" />
        ) : (
          <Header navigation={navigation} title="Perfil" showBack={false} />
        )}
        <View style={styles.emptyProfile}>
          <View style={styles.emptyIcon}>
            <Ionicons name="person-circle-outline" size={80} color={COLORS.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>Entre para ver seu perfil</Text>
          <Text style={styles.emptySubtitle}>Crie sua loja, anuncie pecas e acompanhe suas vendas.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryButtonText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.secondaryLink}>Criar conta</Text>
          </TouchableOpacity>
        </View>
        <BottomNavigation navigation={navigation} activeRoute="Profile" />
      </View>
    );
  }

  const rating = typeof user.rating === 'number' ? user.rating : parseFloat(user.rating || '0');

  return (
    <View style={styles.container}>
      {isWeb ? (
        <MainHeader navigation={navigation} title="Perfil" />
      ) : (
        <Header navigation={navigation} title="Perfil" showBack={false} />
      )}

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? { gap: 12, paddingHorizontal: contentPadding } : undefined}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: contentPadding }}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrap}>
                {user.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                ) : (
                  <Text style={styles.avatarInitial}>{user.name?.charAt(0).toUpperCase() || 'U'}</Text>
                )}
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.total}</Text>
                  <Text style={styles.statLabel}>pecas</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user.total_followers || 0}</Text>
                  <Text style={styles.statLabel}>seguidores</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user.total_following || 0}</Text>
                  <Text style={styles.statLabel}>seguindo</Text>
                </View>
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.store_name || user.name}</Text>
              {user.store_description || user.bio ? (
                <Text style={styles.profileBio}>{user.store_description || user.bio}</Text>
              ) : null}
              {user.city && user.state ? (
                <Text style={styles.profileLocation}>{user.city}, {user.state}</Text>
              ) : null}
              {user.total_reviews > 0 && (
                <View style={styles.profileRating}>
                  <Ionicons name="star" size={12} color={COLORS.premium} />
                  <Text style={styles.profileRatingText}>{rating.toFixed(1)} ({user.total_reviews})</Text>
                </View>
              )}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.actionButtonText}>Editar perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Sales')}>
                <Text style={styles.actionButtonText}>Painel de vendas</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>Todos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
                onPress={() => setActiveTab('active')}
              >
                <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Ativos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'sold' && styles.tabButtonActive]}
                onPress={() => setActiveTab('sold')}
              >
                <Text style={[styles.tabText, activeTab === 'sold' && styles.tabTextActive]}>Vendidos</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          loadingProducts ? (
            <View style={styles.loadingProducts}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconSmall}>
                <Ionicons name="camera-outline" size={40} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma peca ainda</Text>
              <Text style={styles.emptySubtitle}>Comece a vender e suas pecas vao aparecer aqui.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('NewItem')}>
                <Text style={styles.primaryButtonText}>Anunciar agora</Text>
              </TouchableOpacity>
            </View>
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{ paddingBottom: isWeb ? 40 : 120 }}
      />

      <BottomNavigation navigation={navigation} activeRoute="Profile" />
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
  },
  emptyProfile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyIconSmall: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: COLORS.textInverse,
    fontWeight: '600',
  },
  secondaryLink: {
    marginTop: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  avatarWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  profileInfo: {
    marginTop: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  profileBio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  profileLocation: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  profileRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  profileRatingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  tabButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryExtraLight,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  loadingProducts: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
});
