import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { productsService } from '../api';
import { formatPrice } from '../utils/format';
import { colors, spacing, getColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { LookCard, Look } from '../components/LookCard';
import { LOOK_DISCOUNT_PERCENT } from '../constants/looks';

const TABS = [
  { id: 'active', name: 'Ativos' },
  { id: 'sold', name: 'Vendidos' },
  { id: 'reserved', name: 'Reservados' },
  { id: 'looks', name: 'Meus Looks' },
];

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400';


export function MyProductsScreen({ navigation }: any) {
  const { width, gridColumns, productWidth, isMobile, isTablet, isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const [activeTab, setActiveTab] = useState('active');
  const [products, setProducts] = useState<any[]>([]);
  const [looks, setLooks] = useState<Look[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Responsive values from hook
  const numColumns = gridColumns;

  const fetchProducts = useCallback(async () => {
    try {
      if (activeTab === 'looks') {
        // TODO: Fetch looks from API
        // For now, using mock data
        const mockLooks: Look[] = [
          {
            id: '1',
            name: 'Look Verao Casual',
            seller_id: '1',
            seller_name: 'Eu',
            products: [
              { id: '1', title: 'Vestido Floral', price: 150, image_url: 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400' },
              { id: '2', title: 'Bolsa de Palha', price: 80, image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400' },
            ],
          },
          {
            id: '2',
            name: 'Work from Home',
            seller_id: '1',
            seller_name: 'Eu',
            products: [
              { id: '3', title: 'Blazer Linho', price: 180, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400' },
              { id: '4', title: 'Calca Alfaiataria', price: 120, image_url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400' },
            ],
          },
        ];
        setLooks(mockLooks);
      } else {
        const res = await productsService.getMyProducts(activeTab);
        if (res.success && res.products) {
          setProducts(res.products);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  // Atualiza quando a tela ganha foco (ex: após editar)
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleEdit = (product: any) => {
    navigation.navigate('EditProduct', { product });
  };

  const handleReserve = async (product: any) => {
    const newStatus = product.status === 'reserved' ? 'active' : 'reserved';
    const actionText = newStatus === 'reserved' ? 'reservar' : 'reativar';

    Alert.alert(
      newStatus === 'reserved' ? 'Reservar anúncio' : 'Reativar anúncio',
      `Deseja ${actionText} este anúncio?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: newStatus === 'reserved' ? 'Reservar' : 'Reativar',
          onPress: async () => {
            try {
              await productsService.updateProduct(product.id, { status: newStatus });
              // Atualizar lista local
              setProducts(prev =>
                prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p)
              );
              Alert.alert('Sucesso', `Anúncio ${newStatus === 'reserved' ? 'reservado' : 'reativado'} com sucesso!`);
            } catch (error) {
              console.error('Error updating product:', error);
              Alert.alert('Erro', 'Não foi possível alterar o status do anúncio.');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (product: any) => {
    Alert.alert(
      'Excluir anúncio',
      'Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await productsService.deleteProduct(product.id);
              // Remover da lista local
              setProducts(prev => prev.filter(p => p.id !== product.id));
              Alert.alert('Sucesso', 'Anúncio excluído com sucesso!');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Erro', 'Não foi possível excluir o anúncio.');
            }
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }: any) => (
    <Pressable
      style={[styles.productCard, { width: productWidth }]}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View style={styles.productImgWrap}>
        <Image source={{ uri: item.image_url || item.image || PLACEHOLDER_IMAGE }} style={styles.productImg} contentFit="cover" />
        {item.status === 'sold' && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>VENDIDO</Text>
          </View>
        )}
        {item.status === 'reserved' && (
          <View style={styles.reservedOverlay}>
            <Ionicons name="pause-circle" size={24} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.productPrice}>R$ {formatPrice(item.price)}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={14} color="#A3A3A3" />
            <Text style={styles.statText}>{item.views}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart-outline" size={14} color="#A3A3A3" />
            <Text style={styles.statText}>{item.favorites}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <Pressable style={styles.actionBtn} onPress={() => handleEdit(item)}>
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
        </Pressable>
        {item.status === 'active' && (
          <Pressable style={styles.actionBtn} onPress={() => handleReserve(item)}>
            <Ionicons name="pause-outline" size={16} color="#F59E0B" />
          </Pressable>
        )}
        {item.status === 'reserved' && (
          <Pressable style={styles.actionBtn} onPress={() => handleReserve(item)}>
            <Ionicons name="play-outline" size={16} color="#10B981" />
          </Pressable>
        )}
        <Pressable style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Meus Anúncios</Text>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate('Main', { screen: 'Sell' })}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.name}
            </Text>
            {activeTab === tab.id && <View style={styles.tabIndicator} />}
          </Pressable>
        ))}
      </View>

      {/* Looks Grid (when looks tab is active) */}
      {activeTab === 'looks' ? (
        <ScrollView
          style={styles.looksContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {looks.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.lilasLight }]}>
                <Ionicons name="shirt-outline" size={48} color={colors.lilas} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum look criado ainda</Text>
              <Text style={styles.emptyText}>
                Crie looks combinando suas pecas e ofereça {LOOK_DISCOUNT_PERCENT}% de desconto no combo!
              </Text>
              <Pressable onPress={() => navigation.navigate('CreateLook')}>
                <LinearGradient colors={[colors.lilas, '#7A5A9E']} style={styles.createBtn}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.createBtnText}>Criar Look</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
            <View style={styles.looksGrid}>
              <View style={styles.looksHeader}>
                <Text style={styles.looksTitle}>
                  {looks.length} {looks.length === 1 ? 'look' : 'looks'}
                </Text>
                <Pressable
                  style={styles.createLookBtn}
                  onPress={() => navigation.navigate('CreateLook')}
                >
                  <Ionicons name="add" size={18} color={colors.lilas} />
                  <Text style={styles.createLookBtnText}>Criar Look</Text>
                </Pressable>
              </View>
              <View style={styles.looksRow}>
                {looks.map((look) => (
                  <View key={look.id} style={styles.lookCardWrapper}>
                    <LookCard
                      look={look}
                      onPress={() => navigation.navigate('LookDetail', { lookId: look.id })}
                      width={productWidth}
                    />
                    <View style={styles.lookActions}>
                      <Pressable
                        style={styles.lookActionBtn}
                        onPress={() => navigation.navigate('LookDetail', { lookId: look.id })}
                      >
                        <Ionicons name="eye-outline" size={16} color={colors.primary} />
                      </Pressable>
                      <Pressable
                        style={styles.lookActionBtn}
                        onPress={() => {
                          Alert.alert('Excluir Look', 'Deseja excluir este look?', [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Excluir',
                              style: 'destructive',
                              onPress: () => {
                                // TODO: Implement delete look API call
                                setLooks(prev => prev.filter(l => l.id !== look.id));
                              }
                            },
                          ]);
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        /* Products Grid */
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.productsGrid}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="bag-outline" size={48} color="#A3A3A3" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'active' ? 'Voce nao largou nada ainda' :
                 activeTab === 'sold' ? 'Ninguem pegou suas pecas ainda' : 'Nenhuma peca pausada'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'active' ? 'Que tal largar umas pecas?' :
                 activeTab === 'sold' ? 'Quando alguem pegar, aparece aqui' : 'Suas pecas pausadas aparecerao aqui'}
              </Text>
              {activeTab === 'active' && (
                <Pressable onPress={() => navigation.navigate('Main', { screen: 'Sell' })}>
                  <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.createBtn}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.createBtnText}>Largar peca</Text>
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },

  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '500', color: '#737373' },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 2, backgroundColor: colors.primary, borderRadius: 1 },

  // Products
  productsGrid: { padding: 16 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  productCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  productImgWrap: { aspectRatio: 1, position: 'relative' },
  productImg: { width: '100%', height: '100%' },
  soldOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  soldText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  reservedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  productInfo: { padding: 10 },
  productTitle: { fontSize: 13, fontWeight: '500', color: '#1A1A1A' },
  productPrice: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#A3A3A3' },
  actionsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 10 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#737373', textAlign: 'center', marginBottom: 24 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  createBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // Looks
  looksContainer: { flex: 1 },
  looksGrid: { padding: 16 },
  looksHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  looksTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  createLookBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.lilasLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  createLookBtnText: { fontSize: 13, fontWeight: '600', color: colors.lilas },
  looksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  lookCardWrapper: { marginBottom: 12 },
  lookActions: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  lookActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
});

export default MyProductsScreen;
