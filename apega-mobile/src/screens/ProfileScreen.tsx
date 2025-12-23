import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
  Platform,
  useWindowDimensions,
  FlatList,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { BottomNavigation, MainHeader } from '../components';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
  views_count: number;
  favorites_count: number;
}

export default function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { user, isAuthenticated, isLoading, refreshUser, logout } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'active' | 'sold'>('grid');

  // Grid: 3 columns, 1px gap
  const numColumns = 3;
  const imageSize = (screenWidth - 2) / numColumns;

  const loadProducts = async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingProducts(true);
      const response = await api.get<{ products: Product[] }>('/products/my');
      setProducts(response.products || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        refreshUser();
        loadProducts();
      }
    }, [isAuthenticated])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    await loadProducts();
    setRefreshing(false);
  };

  const getFilteredProducts = () => {
    switch (activeTab) {
      case 'active': return products.filter(p => p.status === 'active');
      case 'sold': return products.filter(p => p.status === 'sold');
      default: return products;
    }
  };

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(0)}`;
  };

  // Loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#262626" />
        </View>
        <BottomNavigation navigation={navigation} activeRoute="Profile" />
      </View>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF9F7" />
        <MainHeader navigation={navigation} />
        <ScrollView contentContainerStyle={styles.loginContainer}>
          <View style={styles.loginIcon}>
            <Ionicons name="person-circle-outline" size={80} color="#dbdbdb" />
          </View>
          <Text style={styles.loginTitle}>Entre para ver seu perfil</Text>
          <Text style={styles.loginSubtitle}>
            Crie sua loja, anuncie pecas e acompanhe suas vendas
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginBtnText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signupBtnText}>Criar conta</Text>
          </TouchableOpacity>
        </ScrollView>
        <BottomNavigation navigation={navigation} activeRoute="Profile" />
      </View>
    );
  }

  // Stats
  const activeCount = products.filter(p => p.status === 'active').length;
  const soldCount = products.filter(p => p.status === 'sold').length;
  const filteredProducts = getFilteredProducts();
  const isPremium = user?.subscription_type === 'premium';
  const isVerified = user?.is_official;
  const rating = typeof user.rating === 'number' ? user.rating : parseFloat(user.rating || '0');

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUrl = item.images?.[0] || '';
    const isSold = item.status === 'sold';

    return (
      <TouchableOpacity
        style={[styles.gridItem, { width: imageSize, height: imageSize }]}
        onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
        activeOpacity={0.8}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Ionicons name="image-outline" size={24} color="#dbdbdb" />
          </View>
        )}

        {/* Price */}
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
        </View>

        {/* Sold overlay */}
        {isSold && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>VENDIDO</Text>
          </View>
        )}

        {/* Multiple images */}
        {item.images?.length > 1 && (
          <View style={styles.multiIcon}>
            <Ionicons name="copy" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.profileSection}>
      {/* Top Row: Avatar + Stats */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={['#833AB4', '#FD1D1D', '#F77737']}
              style={styles.avatarGradient}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitial}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </LinearGradient>
          )}
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{products.length}</Text>
            <Text style={styles.statLabel}>publicacoes</Text>
          </View>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{user.total_followers || 0}</Text>
            <Text style={styles.statLabel}>seguidores</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{user.total_following || 0}</Text>
            <Text style={styles.statLabel}>seguindo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Name & Bio */}
      <View style={styles.bioSection}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{user.store_name || user.name}</Text>
          {isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#3897f0" style={{ marginLeft: 4 }} />
          )}
          {isPremium && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>

        {user.bio || user.store_description ? (
          <Text style={styles.bioText}>{user.store_description || user.bio}</Text>
        ) : null}

        {user.city && user.state && (
          <Text style={styles.locationText}>{user.city}, {user.state}</Text>
        )}

        {user.total_reviews > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#FFB800" />
            <Text style={styles.ratingText}>{rating.toFixed(1)} ({user.total_reviews})</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.actionBtnText}>Editar perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Sales')}
        >
          <Text style={styles.actionBtnText}>Painel de vendas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtnIcon}
          onPress={() => navigation.navigate('NewItem')}
        >
          <Ionicons name="add" size={20} color="#262626" />
        </TouchableOpacity>
      </View>

      {/* Highlights / Quick Access */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.highlightsScroll}
        contentContainerStyle={styles.highlightsContent}
      >
        <TouchableOpacity
          style={styles.highlightItem}
          onPress={() => navigation.navigate('NewItem')}
        >
          <View style={styles.highlightCircle}>
            <Ionicons name="add" size={28} color="#262626" />
          </View>
          <Text style={styles.highlightLabel}>Novo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.highlightItem}
          onPress={() => navigation.navigate('Sales')}
        >
          <View style={[styles.highlightCircle, styles.highlightFilled]}>
            <Ionicons name="trending-up" size={22} color="#fff" />
          </View>
          <Text style={styles.highlightLabel}>Vendas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.highlightItem}
          onPress={() => navigation.navigate('Orders')}
        >
          <View style={[styles.highlightCircle, styles.highlightFilled, { backgroundColor: '#F57C00' }]}>
            <Ionicons name="cube" size={22} color="#fff" />
          </View>
          <Text style={styles.highlightLabel}>Pedidos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.highlightItem}
          onPress={() => navigation.navigate('Balance')}
        >
          <View style={[styles.highlightCircle, styles.highlightFilled, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="wallet" size={22} color="#fff" />
          </View>
          <Text style={styles.highlightLabel}>Saldo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.highlightItem}
          onPress={() => navigation.navigate('Favorites')}
        >
          <View style={[styles.highlightCircle, styles.highlightFilled, { backgroundColor: '#E91E63' }]}>
            <Ionicons name="heart" size={22} color="#fff" />
          </View>
          <Text style={styles.highlightLabel}>Favoritos</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'grid' && styles.tabActive]}
          onPress={() => setActiveTab('grid')}
        >
          <Ionicons
            name="grid-outline"
            size={26}
            color={activeTab === 'grid' ? '#262626' : '#8e8e8e'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <View style={styles.tabWithBadge}>
            <Ionicons
              name="pricetag-outline"
              size={26}
              color={activeTab === 'active' ? '#262626' : '#8e8e8e'}
            />
            {activeCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{activeCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sold' && styles.tabActive]}
          onPress={() => setActiveTab('sold')}
        >
          <View style={styles.tabWithBadge}>
            <Ionicons
              name="checkmark-done-outline"
              size={26}
              color={activeTab === 'sold' ? '#262626' : '#8e8e8e'}
            />
            {soldCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{soldCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="camera-outline" size={44} color="#262626" />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'sold' ? 'Nenhuma venda ainda' : 'Nenhuma publicacao'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'sold'
          ? 'Suas vendas aparecerrao aqui'
          : 'Quando voce anunciar, suas pecas aparecerao aqui'}
      </Text>
      {activeTab !== 'sold' && (
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => navigation.navigate('NewItem')}
        >
          <Text style={styles.emptyBtnText}>Anunciar agora</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9F7" />
      <MainHeader navigation={navigation} />

      {loadingProducts && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#262626" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#262626"
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <BottomNavigation navigation={navigation} activeRoute="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Login
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loginIcon: {
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#8e8e8e',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loginBtn: {
    backgroundColor: '#0095f6',
    paddingVertical: 12,
    paddingHorizontal: 80,
    borderRadius: 8,
    marginBottom: 12,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  signupBtn: {
    paddingVertical: 12,
  },
  signupBtnText: {
    color: '#0095f6',
    fontSize: 14,
    fontWeight: '600',
  },

  // Profile Section
  profileSection: {
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  avatarGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '600',
    color: '#262626',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
  },
  statLabel: {
    fontSize: 13,
    color: '#262626',
    marginTop: 2,
  },

  // Bio
  bioSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B1FA2',
  },
  bioText: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 18,
  },
  locationText: {
    fontSize: 14,
    color: '#8e8e8e',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#262626',
    marginLeft: 4,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#efefef',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  actionBtnIcon: {
    backgroundColor: '#efefef',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Highlights
  highlightsScroll: {
    marginBottom: 12,
  },
  highlightsContent: {
    paddingHorizontal: 12,
  },
  highlightItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  highlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  highlightFilled: {
    backgroundColor: '#0095f6',
    borderColor: '#0095f6',
  },
  highlightLabel: {
    fontSize: 12,
    color: '#262626',
    marginTop: 6,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  tabActive: {
    borderTopColor: '#262626',
  },
  tabWithBadge: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: '#ed4956',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // Grid
  listContent: {
    paddingBottom: 100,
  },
  gridItem: {
    position: 'relative',
    borderWidth: 0.5,
    borderColor: '#fff',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fafafa',
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  multiIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: '#262626',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8e8e8e',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: '#0095f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
