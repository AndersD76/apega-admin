import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import { cartService, CartItem, CartSummary } from '../api';
import { formatPrice } from '../utils/format';
import { colors } from '../theme';
import { MICROCOPY } from '../constants';

export function CartScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({ subtotal: 0, shipping: 0, total: 0, itemCount: 0 });
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const response = await cartService.getCart();
      if (response.success) {
        setCartItems(response.items);
        setSummary(response.summary);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCart();
  };

  const subtotal = summary.subtotal;
  const shipping = summary.shipping;
  const total = selectedShipping === 'express' ? subtotal + (shipping * 1.8) : summary.total;
  const savings = cartItems.reduce((sum, item) => sum + ((item.original_price || item.price) - item.price), 0);

  const handleRemoveItem = async (productId: string) => {
    const doRemove = async () => {
      try {
        await cartService.removeFromCart(productId);
        setCartItems(prev => prev.filter((item) => item.id !== productId));
        setSummary(prev => ({
          ...prev,
          itemCount: prev.itemCount - 1,
          subtotal: prev.subtotal - (cartItems.find(i => i.id === productId)?.price || 0),
        }));
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert('Não foi possível remover o item');
        } else {
          Alert.alert('Erro', 'Não foi possível remover o item');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Deseja remover este item da sacola?')) {
        await doRemove();
      }
    } else {
      Alert.alert('Remover item', 'Deseja remover este item da sacola?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('Checkout');
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>Sacola</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.guestContainer}>
          <View style={styles.guestIcon}>
            <Ionicons name="bag-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Sua sacola está vazia</Text>
          <Text style={styles.guestSubtitle}>
            Faça login para adicionar itens à sacola
          </Text>
          <Pressable style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>Entrar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>Sacola</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bag-outline" size={64} color="#E8E8E8" />
          </View>
          <Text style={styles.emptyTitle}>Sua sacola tá vazia...</Text>
          <Text style={styles.emptyText}>Bora garimpar umas peças?</Text>
          <Pressable style={styles.exploreBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.exploreBtnText}>Bora garimpar!</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Sacola ({cartItems.length})</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Items */}
        <View style={styles.section}>
          {cartItems.map((item, index) => (
            <View key={item.id} style={[styles.cartItem, index > 0 && styles.cartItemBorder]}>
              <Image source={{ uri: item.image_url }} style={styles.itemImage} contentFit="cover" />
              <View style={styles.itemContent}>
                <Text style={styles.itemBrand}>{item.brand || 'Marca'}</Text>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                {item.size && <Text style={styles.itemSize}>Tam. {item.size}</Text>}
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPrice}>R$ {formatPrice(item.price)}</Text>
                  {item.original_price && (
                    <Text style={styles.itemOldPrice}>R$ {formatPrice(item.original_price)}</Text>
                  )}
                </View>
                <Text style={styles.itemSeller}>Vendido por {item.seller_name}</Text>
              </View>
              <Pressable style={styles.removeBtn} onPress={() => handleRemoveItem(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Shipping */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entrega</Text>
          <Pressable
            style={[styles.shippingOption, selectedShipping === 'standard' && styles.shippingOptionActive]}
            onPress={() => setSelectedShipping('standard')}
          >
            <View style={styles.shippingRadio}>
              {selectedShipping === 'standard' && <View style={styles.shippingRadioInner} />}
            </View>
            <View style={styles.shippingContent}>
              <Text style={styles.shippingName}>Padrão</Text>
              <Text style={styles.shippingTime}>5-10 dias úteis</Text>
            </View>
            <Text style={styles.shippingPrice}>R$ {formatPrice(shipping)}</Text>
          </Pressable>
          <Pressable
            style={[styles.shippingOption, selectedShipping === 'express' && styles.shippingOptionActive]}
            onPress={() => setSelectedShipping('express')}
          >
            <View style={styles.shippingRadio}>
              {selectedShipping === 'express' && <View style={styles.shippingRadioInner} />}
            </View>
            <View style={styles.shippingContent}>
              <Text style={styles.shippingName}>Expresso</Text>
              <Text style={styles.shippingTime}>2-3 dias úteis</Text>
            </View>
            <Text style={styles.shippingPrice}>R$ {formatPrice(shipping * 1.8)}</Text>
          </Pressable>
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <Pressable style={styles.couponRow}>
            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
            <Text style={styles.couponText}>Adicionar cupom de desconto</Text>
            <Ionicons name="chevron-forward" size={20} color="#A3A3A3" />
          </Pressable>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({cartItems.length} itens)</Text>
            <Text style={styles.summaryValue}>R$ {formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Frete</Text>
            <Text style={styles.summaryValue}>R$ {formatPrice(shipping)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.savingsLabel}>Você está economizando</Text>
            <Text style={styles.savingsValue}>-R$ {formatPrice(savings)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R$ {formatPrice(total)}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.bottomTotal}>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalValue}>R$ {formatPrice(total)}</Text>
        </View>
        <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.checkoutBtnGrad}>
            <Text style={styles.checkoutBtnText}>Finalizar compra</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 16 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },

  // Guest/Empty
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  guestIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  guestTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' },
  guestSubtitle: { fontSize: 15, color: '#737373', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  loginBtn: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 28 },
  loginBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  emptyText: { fontSize: 14, color: '#737373', marginTop: 8 },
  exploreBtn: { marginTop: 24, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, backgroundColor: colors.primary },
  exploreBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // Section
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },

  // Cart Item
  cartItem: { flexDirection: 'row', paddingVertical: 12 },
  cartItemBorder: { borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  itemImage: { width: 80, height: 100, borderRadius: 8 },
  itemContent: { flex: 1, marginLeft: 12 },
  itemBrand: { fontSize: 11, fontWeight: '600', color: colors.primary, textTransform: 'uppercase' },
  itemTitle: { fontSize: 14, fontWeight: '500', color: '#1A1A1A', marginTop: 2 },
  itemSize: { fontSize: 12, color: '#737373', marginTop: 2 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  itemOldPrice: { fontSize: 12, color: '#A3A3A3', textDecorationLine: 'line-through' },
  itemSeller: { fontSize: 11, color: '#A3A3A3', marginTop: 4 },
  removeBtn: { padding: 8 },

  // Shipping
  shippingOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#F5F5F5', marginBottom: 8 },
  shippingOptionActive: { backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary },
  shippingRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D4D4D4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  shippingRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  shippingContent: { flex: 1 },
  shippingName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  shippingTime: { fontSize: 12, color: '#737373' },
  shippingPrice: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },

  // Coupon
  couponRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  couponText: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.primary },

  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#737373' },
  summaryValue: { fontSize: 14, color: '#1A1A1A' },
  savingsLabel: { fontSize: 14, color: '#10B981' },
  savingsValue: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  divider: { height: 1, backgroundColor: '#E8E8E8', marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },

  // Bottom Bar
  bottomBar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  bottomTotal: { },
  bottomTotalLabel: { fontSize: 12, color: '#737373' },
  bottomTotalValue: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  checkoutBtn: { flex: 1 },
  checkoutBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  checkoutBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default CartScreen;
