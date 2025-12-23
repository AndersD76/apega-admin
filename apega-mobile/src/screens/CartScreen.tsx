import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavigation, Button, Header, MainHeader } from '../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

interface CartItem {
  id: string;
  title: string;
  brand: string;
  price: number;
  originalPrice?: number;
  size: string;
  imageUrl: string;
  seller: string;
}

const MOCK_CART: CartItem[] = [];

export default function CartScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 900;

  const [cartItems, setCartItems] = useState<CartItem[]>(MOCK_CART);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    const shipping = cartItems.length > 0 ? 15 : 0;
    return {
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  }, [cartItems]);

  const handleRemoveItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      navigation.navigate('Checkout', { item: cartItems[0] });
    }
  };

  const renderItem = (item: CartItem) => (
    <View key={item.id} style={styles.itemCard}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      ) : (
        <View style={styles.itemImagePlaceholder}>
          <Ionicons name="image-outline" size={24} color={COLORS.textTertiary} />
        </View>
      )}

      <View style={styles.itemInfo}>
        <Text style={styles.itemBrand}>{item.brand}</Text>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.itemMeta}>tam {item.size} • {item.seller}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.itemPrice}>R$ {item.price.toFixed(2)}</Text>
          {item.originalPrice && (
            <Text style={styles.itemOriginalPrice}>R$ {item.originalPrice.toFixed(2)}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveItem(item.id)}>
        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {isWeb ? (
        <MainHeader navigation={navigation} title="Sacola" />
      ) : (
        <Header navigation={navigation} title="Sacola" showBack />
      )}

      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bag-outline" size={48} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Sua sacola esta vazia</Text>
          <Text style={styles.emptySubtitle}>Explore e adicione pecas para continuar.</Text>
          <Button
            label="explorar produtos"
            variant="primary"
            onPress={() => navigation.navigate('Home')}
            style={styles.emptyCta}
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={[styles.listSection, isDesktop && styles.listSectionDesktop]}>
            {cartItems.map(renderItem)}
          </View>

          <View style={[styles.summaryCard, isDesktop && styles.summaryCardDesktop]}>
            <Text style={styles.summaryTitle}>Resumo</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>R$ {totals.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Frete</Text>
              <Text style={styles.summaryValue}>R$ {totals.shipping.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {totals.total.toFixed(2)}</Text>
            </View>
            {isDesktop && (
              <Button
                label="finalizar compra"
                variant="primary"
                onPress={handleCheckout}
                style={{ marginTop: SPACING.md }}
                fullWidth
              />
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {!isDesktop && cartItems.length > 0 && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Total</Text>
            <Text style={styles.footerTotal}>R$ {totals.total.toFixed(2)}</Text>
          </View>
          <Button
            label="finalizar compra"
            variant="primary"
            onPress={handleCheckout}
            fullWidth
          />
        </View>
      )}

      <BottomNavigation navigation={navigation} activeRoute="Cart" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  listSection: {
    gap: SPACING.sm,
  },
  listSectionDesktop: {
    maxWidth: 840,
    alignSelf: 'center',
    width: '100%',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    ...SHADOWS.xs,
  },
  itemImage: {
    width: 80,
    height: 96,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 96,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  itemBrand: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: 4,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  itemOriginalPrice: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    textDecorationLine: 'line-through',
  },
  removeButton: {
    padding: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    ...SHADOWS.xs,
  },
  summaryCardDesktop: {
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  footer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  footerLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  footerTotal: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  emptyCta: {
    marginTop: SPACING.sm,
  },
});
