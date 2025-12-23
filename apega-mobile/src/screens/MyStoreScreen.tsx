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
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { BottomNavigation } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { getMyProducts, updateProduct, deleteProduct, Product as APIProduct } from '../services/products';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

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
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'active' | 'sold'>('grid');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const numColumns = 3;
  const imageSize = (screenWidth - 2) / numColumns;

  const fetchProducts = useCallback(async () => {
    try {
      const response = await getMyProducts();
      const mappedProducts: Product[] = (response.products || []).map((p: APIProduct) => ({
        id: p.id,
        title: p.title || 'Sem titulo',
        price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0),
        status: p.status as 'active' | 'paused' | 'sold',
        views: p.views || 0,
        favorites: p.favorites || 0,
        image_url: p.image_url,
      }));
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
  };

  const formatPrice = (price: number) => `R$ ${price.toFixed(0)}`;

  const getFilteredProducts = () => {
    switch (activeTab) {
      case 'active': return products.filter(p => p.status === 'active');
      case 'sold': return products.filter(p => p.status === 'sold');
      default: return products;
    }
  };

  const activeCount = products.filter(p => p.status === 'active').length;
  const soldCount = products.filter(p => p.status === 'sold').length;
  const filteredProducts = getFilteredProducts();
  const isPremium = user?.subscription_type === 'premium';
  const isVerified = user?.is_official;

  const openActionMenu = (product: Product) => {
    setSelectedProduct(product);
    setShowActionMenu(true);
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
      Alert.alert('Erro', 'Nao foi possivel atualizar o status');
    }
  };

  const handleDelete = () => {
    setShowActionMenu(false);
    Alert.alert('Remover produto?', 'Esta acao nao pode ser desfeita.', [
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
            Alert.alert('Erro', 'Nao foi possivel remover o produto');
          }
        }
      }
    ]);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const isSold = item.status === 'sold';
    const isPaused = item.status === 'paused';

    return (
      <TouchableOpacity
        style={[styles.gridItem, { width: imageSize, height: imageSize }]}
        onPress={() => navigation.navigate('EditProduct', { productId: item.id })}
        onLongPress={() => openActionMenu(item)}
        activeOpacity={0.8}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Ionicons name="image-outline" size={24} color="#dbdbdb" />
          </View>
        )}

        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
        </View>

        {isSold && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>VENDIDO</Text>
          </View>
        )}

        {isPaused && (
          <View style={styles.pausedOverlay}>
            <Ionicons name="pause-circle" size={24} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.profileSection}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={['#833AB4', '#FD1D1D', '#F77737']}
              style={styles.avatarGradient}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitial}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </LinearGradient>
          )}
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{products.length}</Text>
            <Text style={styles.statLabel}>pecas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activeCount}</Text>
            <Text style={styles.statLabel}>ativas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{soldCount}</Text>
            <Text style={styles.statLabel}>vendidas</Text>
          </View>
        </View>
      </View>

      <View style={styles.bioSection}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{user?.store_name || user?.name || 'Minha Loja'}</Text>
          {isVerified && <Ionicons name="checkmark-circle" size={16} color="#3897f0" style={{ marginLeft: 4 }} />}
          {isPremium && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        {user?.store_description && (
          <Text style={styles.bioText}>{user.store_description}</Text>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('NewItem', {})}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Anunciar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.secondaryBtnText}>Editar loja</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'grid' && styles.tabActive]}
          onPress={() => setActiveTab('grid')}
        >
          <Ionicons name="grid-outline" size={24} color={activeTab === 'grid' ? '#262626' : '#8e8e8e'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <View style={styles.tabWithBadge}>
            <Ionicons name="pricetag-outline" size={24} color={activeTab === 'active' ? '#262626' : '#8e8e8e'} />
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
            <Ionicons name="checkmark-done-outline" size={24} color={activeTab === 'sold' ? '#262626' : '#8e8e8e'} />
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
      <Text style={styles.emptyTitle}>Compartilhe suas pecas</Text>
      <Text style={styles.emptySubtitle}>
        Quando voce adicionar pecas, elas aparecerao aqui
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => navigation.navigate('NewItem', {})}
      >
        <Text style={styles.emptyBtnText}>Adicionar primeira peca</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color="#262626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minha Loja</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings' as any)} style={styles.headerBtn}>
          <Ionicons name="settings-outline" size={22} color="#262626" />
        </TouchableOpacity>
      </View>

      {loading ? (
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#262626" />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <BottomNavigation navigation={navigation} activeRoute="Profile" />

      {/* Action Menu */}
      <Modal visible={showActionMenu} transparent animationType="slide" onRequestClose={() => setShowActionMenu(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowActionMenu(false)}>
          <View style={styles.actionMenu}>
            <View style={styles.actionMenuHandle} />

            <View style={styles.actionMenuHeader}>
              {selectedProduct?.image_url && (
                <Image source={{ uri: selectedProduct.image_url }} style={styles.actionMenuImage} />
              )}
              <View style={styles.actionMenuInfo}>
                <Text style={styles.actionMenuTitle} numberOfLines={2}>{selectedProduct?.title}</Text>
                <Text style={styles.actionMenuPrice}>{formatPrice(selectedProduct?.price || 0)}</Text>
              </View>
            </View>

            <View style={styles.actionMenuItems}>
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => {
                  setShowActionMenu(false);
                  if (selectedProduct) navigation.navigate('EditProduct', { productId: selectedProduct.id });
                }}
              >
                <Ionicons name="create-outline" size={24} color="#262626" />
                <Text style={styles.actionMenuText}>Editar</Text>
              </TouchableOpacity>

              {selectedProduct?.status !== 'sold' && (
                <TouchableOpacity style={styles.actionMenuItem} onPress={handleToggleStatus}>
                  <Ionicons
                    name={selectedProduct?.status === 'active' ? 'pause-outline' : 'play-outline'}
                    size={24}
                    color="#262626"
                  />
                  <Text style={styles.actionMenuText}>
                    {selectedProduct?.status === 'active' ? 'Pausar' : 'Ativar'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.actionMenuItem} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="#ed4956" />
                <Text style={[styles.actionMenuText, { color: '#ed4956' }]}>Excluir</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.actionMenuCancel} onPress={() => setShowActionMenu(false)}>
              <Text style={styles.actionMenuCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
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
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  avatarGradient: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 28,
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
    color: '#8e8e8e',
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

  // Actions
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0095f6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#efefef',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
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
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  actionMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#dbdbdb',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  actionMenuHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
  },
  actionMenuImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  actionMenuInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  actionMenuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 4,
  },
  actionMenuPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#262626',
  },
  actionMenuItems: {
    paddingVertical: 8,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  actionMenuText: {
    fontSize: 16,
    color: '#262626',
  },
  actionMenuCancel: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#dbdbdb',
  },
  actionMenuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8e8e8e',
  },
});
