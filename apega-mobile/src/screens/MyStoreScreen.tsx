import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
  RefreshControl,
  Modal,
  Alert,
  Dimensions,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavigation } from '../components';
import { getMyProducts, updateProduct, deleteProduct, Product as APIProduct } from '../services/products';
import { useAuth } from '../contexts/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'MyStore'>;

interface Product {
  id: string;
  title: string;
  price: number;
  status: 'active' | 'paused' | 'sold';
  views: number;
  favorites: number;
  image_url?: string;
}

export default function MyStoreScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 1024;
  const isTablet = isWeb && width > 600 && width <= 1024;
  const numColumns = isDesktop ? 4 : isTablet ? 3 : 3;
  const gridGap = isDesktop ? 4 : 2;
  const itemSize = (width - (isDesktop ? 120 : 0) - (gridGap * (numColumns + 1))) / numColumns;

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await getMyProducts();
      const mappedProducts: Product[] = (response.products || []).map((p: APIProduct) => ({
        id: p.id,
        title: p.title || 'Sem título',
        price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0),
        status: p.status as 'active' | 'paused' | 'sold',
        views: p.views || 0,
        favorites: p.favorites || 0,
        image_url: p.image_url,
      }));
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProducts();
    });
    return unsubscribe;
  }, [navigation, fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  const formatPrice = (price: number | string | undefined | null) => {
    if (price === undefined || price === null) return 'R$ 0';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'R$ 0';
    return `R$ ${numPrice.toFixed(0)}`;
  };

  const activeProducts = products.filter(p => p.status === 'active');
  const soldProducts = products.filter(p => p.status === 'sold');
  const totalViews = products.reduce((sum, p) => sum + p.views, 0);
  const totalFavorites = products.reduce((sum, p) => sum + p.favorites, 0);

  const openActionMenu = (product: Product) => {
    setSelectedProduct(product);
    setShowActionMenu(true);
  };

  const handleEdit = () => {
    setShowActionMenu(false);
    if (selectedProduct) {
      navigation.navigate('EditProduct', { productId: selectedProduct.id });
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedProduct) return;
    const newStatus = selectedProduct.status === 'active' ? 'paused' : 'active';
    try {
      await updateProduct(selectedProduct.id, { status: newStatus });
      setProducts(prev => prev.map(p =>
        p.id === selectedProduct.id ? { ...p, status: newStatus } : p
      ));
      setShowActionMenu(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status do produto');
    }
  };

  const handleDelete = () => {
    setShowActionMenu(false);
    Alert.alert(
      'Remover produto?',
      'Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            if (!selectedProduct) return;
            try {
              await deleteProduct(selectedProduct.id);
              setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover o produto');
            }
          }
        }
      ]
    );
  };

  const renderProductGrid = () => {
    if (products.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="camera-outline" size={48} color={COLORS.gray[400]} />
          </View>
          <Text style={styles.emptyTitle}>Compartilhe suas peças</Text>
          <Text style={styles.emptySubtitle}>
            Quando você adicionar peças, elas aparecerão aqui no seu perfil.
          </Text>
          <TouchableOpacity
            style={styles.firstPostButton}
            onPress={() => navigation.navigate('NewItem', {})}
          >
            <Text style={styles.firstPostButtonText}>Adicionar primeira peça</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.gridContainer, { gap: gridGap }]}>
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[styles.gridItem, { width: itemSize, height: itemSize }]}
            onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
            onLongPress={() => openActionMenu(product)}
            activeOpacity={0.9}
          >
            {product.image_url ? (
              <Image source={{ uri: product.image_url }} style={styles.gridImage} />
            ) : (
              <View style={[styles.gridImage, styles.gridImagePlaceholder]}>
                <Ionicons name="image-outline" size={32} color={COLORS.gray[400]} />
              </View>
            )}

            {/* Status indicator */}
            {product.status === 'paused' && (
              <View style={styles.pausedOverlay}>
                <Ionicons name="pause-circle" size={24} color="#fff" />
              </View>
            )}
            {product.status === 'sold' && (
              <View style={styles.soldOverlay}>
                <Text style={styles.soldText}>VENDIDO</Text>
              </View>
            )}

            {/* Price tag */}
            <View style={styles.priceTag}>
              <Text style={styles.priceTagText}>{formatPrice(product.price)}</Text>
            </View>

            {/* Stats overlay on hover/focus */}
            <View style={styles.statsOverlay}>
              <View style={styles.statOverlayItem}>
                <Ionicons name="heart" size={14} color="#fff" />
                <Text style={styles.statOverlayText}>{product.favorites}</Text>
              </View>
              <View style={styles.statOverlayItem}>
                <Ionicons name="eye" size={14} color="#fff" />
                <Text style={styles.statOverlayText}>{product.views}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const isPremium = user?.subscription_type === 'premium';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minha Loja</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarContainer}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.storeName}>{user?.store_name || user?.name || 'Minha Loja'}</Text>
              <Text style={styles.storeHandle}>@{user?.name?.toLowerCase().replace(/\s/g, '') || 'minhaloja'}</Text>
              <View style={[styles.planBadge, isPremium && styles.planBadgePremium]}>
                {isPremium && <Ionicons name="diamond" size={12} color="#7B1FA2" />}
                <Text style={[styles.planText, isPremium && styles.planTextPremium]}>
                  {isPremium ? 'Premium' : 'Vendedor'}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{products.length}</Text>
              <Text style={styles.statLabel}>pecas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{soldProducts.length}</Text>
              <Text style={styles.statLabel}>vendidas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalFavorites}</Text>
              <Text style={styles.statLabel}>curtidas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalViews}</Text>
              <Text style={styles.statLabel}>views</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => navigation.navigate('NewItem', {})}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.primaryActionButtonText}>Nova Peca</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={18} color="#666" />
              <Text style={styles.secondaryActionButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats Cards */}
          <View style={styles.quickStatsRow}>
            <View style={[styles.quickStatCard, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
              <Text style={[styles.quickStatNumber, { color: '#2E7D32' }]}>{activeProducts.length}</Text>
              <Text style={styles.quickStatLabel}>Ativos</Text>
            </View>

            <View style={[styles.quickStatCard, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="pause-circle" size={18} color="#F57C00" />
              <Text style={[styles.quickStatNumber, { color: '#F57C00' }]}>
                {products.filter(p => p.status === 'paused').length}
              </Text>
              <Text style={styles.quickStatLabel}>Pausados</Text>
            </View>

            <View style={[styles.quickStatCard, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="bag-check" size={18} color="#1976D2" />
              <Text style={[styles.quickStatNumber, { color: '#1976D2' }]}>{soldProducts.length}</Text>
              <Text style={styles.quickStatLabel}>Vendidos</Text>
            </View>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'grid' && styles.tabItemActive]}
            onPress={() => setActiveTab('grid')}
          >
            <Ionicons
              name="grid-outline"
              size={24}
              color={activeTab === 'grid' ? COLORS.primary : COLORS.gray[400]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'list' && styles.tabItemActive]}
            onPress={() => setActiveTab('list')}
          >
            <Ionicons
              name="list-outline"
              size={24}
              color={activeTab === 'list' ? COLORS.primary : COLORS.gray[400]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'saved' && styles.tabItemActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons
              name="bookmark-outline"
              size={24}
              color={activeTab === 'saved' ? COLORS.primary : COLORS.gray[400]}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Carregando suas peças...</Text>
          </View>
        ) : (
          renderProductGrid()
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Profile" />

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={styles.actionMenuContainer}>
            <View style={styles.actionMenu}>
              <View style={styles.actionMenuHandle} />

              <View style={styles.actionMenuHeader}>
                {selectedProduct?.image_url && (
                  <Image
                    source={{ uri: selectedProduct.image_url }}
                    style={styles.actionMenuImage}
                  />
                )}
                <View style={styles.actionMenuHeaderInfo}>
                  <Text style={styles.actionMenuTitle} numberOfLines={2}>
                    {selectedProduct?.title}
                  </Text>
                  <Text style={styles.actionMenuPrice}>
                    {formatPrice(selectedProduct?.price)}
                  </Text>
                </View>
              </View>

              <View style={styles.actionMenuGrid}>
                <TouchableOpacity style={styles.actionGridItem} onPress={handleEdit}>
                  <View style={[styles.actionGridIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="create-outline" size={24} color="#2E7D32" />
                  </View>
                  <Text style={styles.actionGridText}>Editar</Text>
                </TouchableOpacity>

                {selectedProduct?.status !== 'sold' && (
                  <TouchableOpacity style={styles.actionGridItem} onPress={handleToggleStatus}>
                    <View style={[styles.actionGridIcon, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons
                        name={selectedProduct?.status === 'active' ? 'pause-outline' : 'play-outline'}
                        size={24}
                        color="#F57C00"
                      />
                    </View>
                    <Text style={styles.actionGridText}>
                      {selectedProduct?.status === 'active' ? 'Pausar' : 'Ativar'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.actionGridItem} onPress={() => {
                  setShowActionMenu(false);
                  if (selectedProduct) {
                    navigation.navigate('ItemDetail', { itemId: selectedProduct.id });
                  }
                }}>
                  <View style={[styles.actionGridIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="eye-outline" size={24} color="#1976D2" />
                  </View>
                  <Text style={styles.actionGridText}>Visualizar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionGridItem} onPress={handleDelete}>
                  <View style={[styles.actionGridIcon, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="trash-outline" size={24} color="#D32F2F" />
                  </View>
                  <Text style={[styles.actionGridText, { color: '#D32F2F' }]}>Excluir</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.actionMenuCancel}
                onPress={() => setShowActionMenu(false)}
              >
                <Text style={styles.actionMenuCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: { elevation: 2 },
    }),
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  storeHandle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  planBadgePremium: {
    backgroundColor: '#F3E5F5',
  },
  planText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  planTextPremium: {
    color: '#7B1FA2',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E8E8E8',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  quickStatCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: 12,
    borderRadius: 12,
  },
  quickStatNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#666',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    backgroundColor: '#fff',
    marginTop: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray[500],
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
  },
  gridItem: {
    position: 'relative',
    backgroundColor: COLORS.gray[100],
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[100],
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  priceTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    gap: 8,
  },
  statOverlayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statOverlayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  firstPostButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  firstPostButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionMenuContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  actionMenu: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  actionMenuHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    gap: 12,
  },
  actionMenuImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
  },
  actionMenuHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  actionMenuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  actionMenuPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  actionGridItem: {
    width: '22%',
    alignItems: 'center',
    gap: 8,
  },
  actionGridIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGridText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  actionMenuCancel: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  actionMenuCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[500],
  },
});
