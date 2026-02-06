import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { favoritesService } from '../api';
import { formatPrice } from '../utils/format';
import { colors, spacing, getColors } from '../theme';
import { MICROCOPY } from '../constants';

export function FavoritesScreen({ navigation }: any) {
  const { width, gridColumns, productWidth, isMobile, isTablet, isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const { isAuthenticated, isLoading: authLoading } = auth || {};
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Responsive values from hook
  const numColumns = gridColumns;

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const res = await favoritesService.getFavorites();
      setFavorites(res.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  // Atualiza quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const handleRemoveFavorite = async (productId: string) => {
    Alert.alert('Remover favorito', 'Deseja remover este item dos favoritos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await favoritesService.removeFavorite(productId);
            setFavorites((prev) => prev.filter((f) => f.id !== productId));
          } catch (error) {
            setFavorites((prev) => prev.filter((f) => f.id !== productId));
          }
        },
      },
    ]);
  };

  const renderProduct = ({ item }: any) => {
    const discount = item.original_price
      ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
      : 0;

    return (
      <Pressable
        style={[styles.productCard, { width: productWidth }]}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      >
        <View style={styles.productImgWrap}>
          <Image source={{ uri: item.image || item.image_url }} style={styles.productImg} contentFit="cover" />
          <Pressable style={styles.heartBtn} onPress={() => handleRemoveFavorite(item.id)}>
            <Ionicons name="heart" size={18} color="#FF6B6B" />
          </Pressable>
          {discount > 0 && (
            <View style={styles.discountTag}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productBrand}>{item.brand || 'Marca'}</Text>
          <Text style={styles.productName} numberOfLines={1}>{item.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>R$ {formatPrice(item.price)}</Text>
            {item.original_price && <Text style={styles.oldPrice}>R$ {formatPrice(item.original_price)}</Text>}
          </View>
          <View style={styles.sellerRow}>
            <Ionicons name="person-circle-outline" size={14} color="#A3A3A3" />
            <Text style={styles.sellerText}>{item.seller || 'Vendedor'}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const canGoBack = navigation.canGoBack();

  // Show loading while auth is initializing
  if (authLoading === true) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          {canGoBack && (
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>Quero!</Text>
        </View>
        <View style={styles.guestContainer}>
          <Text style={{ color: '#737373' }}>Carregando...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          {canGoBack && (
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>Quero!</Text>
        </View>
        <View style={styles.guestContainer}>
          <View style={styles.guestIcon}>
            <Ionicons name="heart-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Salve as peças que você quer!</Text>
          <Text style={styles.guestSubtitle}>
            Faça login para salvar peças e acompanhar quando o preço baixar
          </Text>
          <Pressable style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>Entrar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {canGoBack && (
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </Pressable>
        )}
        <Text style={styles.headerTitle}>Quero!</Text>
        <Text style={styles.headerCount}>{favorites.length} itens</Text>
      </View>

      {/* Products Grid */}
      <FlatList
        data={favorites}
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
            <Ionicons name="heart-outline" size={64} color="#E8E8E8" />
            <Text style={styles.emptyTitle}>Você ainda não curtiu nada</Text>
            <Text style={styles.emptyText}>Bora garimpar? Toca no coração pra salvar!</Text>
            <Pressable style={styles.exploreBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.exploreBtnText}>Bora garimpar!</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  headerCount: { fontSize: 14, color: '#737373' },

  // Guest
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  guestIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  guestTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' },
  guestSubtitle: { fontSize: 15, color: '#737373', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  loginBtn: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 28 },
  loginBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  // Products
  productsGrid: { paddingHorizontal: 16, paddingBottom: 100 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  productCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  productImgWrap: { aspectRatio: 0.85, position: 'relative' },
  productImg: { width: '100%', height: '100%' },
  heartBtn: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } as any,
  discountTag: { position: 'absolute', top: 8, left: 8, backgroundColor: '#FF6B6B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  productInfo: { padding: 10 },
  productBrand: { fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  productName: { fontSize: 13, fontWeight: '500', color: '#1A1A1A', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  price: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  oldPrice: { fontSize: 12, color: '#A3A3A3', textDecorationLine: 'line-through' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  sellerText: { fontSize: 11, color: '#A3A3A3' },

  // Empty
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#737373', marginTop: 8, textAlign: 'center' },
  exploreBtn: { marginTop: 24, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, backgroundColor: colors.primary },
  exploreBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default FavoritesScreen;
