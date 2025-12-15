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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavigation, Tab, Button } from '../components';
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
  const [activeTab, setActiveTab] = useState<string>('active');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Menu de ações
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Carregar produtos do vendedor
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

  // Atualizar ao voltar para a tela
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

  const tabs = [
    { id: 'active', label: `ativos (${products.filter(p => p.status === 'active').length})` },
    { id: 'paused', label: `pausados (${products.filter(p => p.status === 'paused').length})` },
    { id: 'sold', label: `vendidos (${products.filter(p => p.status === 'sold').length})` },
  ];

  const filteredProducts = products.filter(product => product.status === activeTab);

  const formatPrice = (price: number | string | undefined | null) => {
    if (price === undefined || price === null) return 'R$ 0,00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'R$ 0,00';
    return `R$ ${numPrice.toFixed(2).replace('.', ',')}`;
  };

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

  const renderProductCard = (product: Product) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
      activeOpacity={0.7}
    >
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <Ionicons name="image" size={40} color={COLORS.textTertiary} />
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>{product.views}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>{product.favorites}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => openActionMenu(product)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>minha loja</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NewItem', {})}>
          <Ionicons name="add" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsCard}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>produtos</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{products.reduce((sum, p) => sum + p.views, 0)}</Text>
          <Text style={styles.statLabel}>visualizações</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{products.reduce((sum, p) => sum + p.favorites, 0)}</Text>
          <Text style={styles.statLabel}>favoritos</Text>
        </View>
      </View>

      <Tab
        items={tabs}
        activeTab={activeTab}
        onTabPress={setActiveTab}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map(renderProductCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>nenhum produto</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active' ? 'adicione produtos para começar a vender' : 'nenhum produto nesta categoria'}
            </Text>
            {activeTab === 'active' && (
              <Button
                label="adicionar produto"
                variant="primary"
                onPress={() => navigation.navigate('NewItem', {})}
                style={{ marginTop: SPACING.lg }}
              />
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomNavigation navigation={navigation} activeRoute="Profile" />

      {/* Modal de Menu de Ações */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={styles.actionMenuContainer}>
            <View style={styles.actionMenu}>
              <View style={styles.actionMenuHeader}>
                <Text style={styles.actionMenuTitle} numberOfLines={1}>
                  {selectedProduct?.title}
                </Text>
              </View>

              <TouchableOpacity style={styles.actionMenuItem} onPress={handleEdit}>
                <Ionicons name="create-outline" size={22} color={COLORS.textPrimary} />
                <Text style={styles.actionMenuText}>Editar produto</Text>
              </TouchableOpacity>

              {selectedProduct?.status !== 'sold' && (
                <TouchableOpacity style={styles.actionMenuItem} onPress={handleToggleStatus}>
                  <Ionicons
                    name={selectedProduct?.status === 'active' ? 'pause-outline' : 'play-outline'}
                    size={22}
                    color={COLORS.textPrimary}
                  />
                  <Text style={styles.actionMenuText}>
                    {selectedProduct?.status === 'active' ? 'Pausar anúncio' : 'Ativar anúncio'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.actionMenuItem} onPress={() => {
                setShowActionMenu(false);
                if (selectedProduct) {
                  navigation.navigate('ItemDetail', { itemId: selectedProduct.id });
                }
              }}>
                <Ionicons name="eye-outline" size={22} color={COLORS.textPrimary} />
                <Text style={styles.actionMenuText}>Ver como comprador</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionMenuItem, styles.actionMenuItemDanger]} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={22} color={COLORS.error} />
                <Text style={[styles.actionMenuText, styles.actionMenuTextDanger]}>Remover produto</Text>
              </TouchableOpacity>

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
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.xs,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  content: {
    padding: SPACING.md,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.xs,
  },
  productImage: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  menuButton: {
    padding: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  // Action Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionMenuContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  actionMenu: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  actionMenuHeader: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    alignItems: 'center',
  },
  actionMenuTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  actionMenuItemDanger: {
    borderBottomWidth: 0,
  },
  actionMenuText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  actionMenuTextDanger: {
    color: COLORS.error,
  },
  actionMenuCancel: {
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    marginTop: SPACING.xs,
  },
  actionMenuCancelText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
});
