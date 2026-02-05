import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAuth } from '../context/AuthContext';
import { productsService } from '../api';
import { formatPrice } from '../utils/format';
import { colors, spacing, radius } from '../theme';
import {
  LOOK_DISCOUNT_PERCENT,
  MIN_ITEMS_PER_LOOK,
  MAX_ITEMS_PER_LOOK,
} from '../constants/looks';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400';

interface ProductItem {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  size?: string;
  brand?: string;
}

export function CreateLookScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [lookName, setLookName] = useState('');
  const [myProducts, setMyProducts] = useState<ProductItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pre-select product if coming from SellScreen
  const preSelectedProductId = route?.params?.productId;

  const fetchMyProducts = useCallback(async () => {
    try {
      const res = await productsService.getMyProducts('active');
      if (res.success && res.products) {
        setMyProducts(res.products);
        // Pre-select product if provided
        if (preSelectedProductId) {
          setSelectedProducts(new Set([preSelectedProductId]));
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Erro', 'Nao foi possivel carregar seus produtos.');
    } finally {
      setLoading(false);
    }
  }, [preSelectedProductId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyProducts();
    }
  }, [isAuthenticated, fetchMyProducts]);

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        if (newSet.size >= MAX_ITEMS_PER_LOOK) {
          Alert.alert('Limite atingido', `Um look pode ter no maximo ${MAX_ITEMS_PER_LOOK} pecas.`);
          return prev;
        }
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Calculate prices
  const selectedProductsList = myProducts.filter((p) => selectedProducts.has(p.id));
  const originalPrice = selectedProductsList.reduce((sum, p) => sum + p.price, 0);
  const discountAmount = originalPrice * (LOOK_DISCOUNT_PERCENT / 100);
  const finalPrice = originalPrice - discountAmount;

  const handleSaveLook = async () => {
    if (!lookName.trim()) {
      Alert.alert('Nome obrigatorio', 'Por favor, de um nome ao seu look.');
      return;
    }

    if (selectedProducts.size < MIN_ITEMS_PER_LOOK) {
      Alert.alert('Pecas insuficientes', `Selecione pelo menos ${MIN_ITEMS_PER_LOOK} pecas para criar um look.`);
      return;
    }

    setSaving(true);
    try {
      // TODO: Implement API call to save look
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert('Sucesso!', 'Seu look foi criado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving look:', error);
      Alert.alert('Erro', 'Nao foi possivel salvar o look. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.guestContainer}>
          <Ionicons name="shirt-outline" size={48} color={colors.primary} />
          <Text style={styles.guestTitle}>Crie looks incriveis</Text>
          <Text style={styles.guestSubtitle}>
            Faca login para criar looks e vender combos de pecas
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
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Criar Look</Text>
          <Text style={styles.headerSubtitle}>Monte um combo de pecas</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Look Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nome do Look *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Look Verao Casual"
            placeholderTextColor={colors.textMuted}
            value={lookName}
            onChangeText={setLookName}
            maxLength={50}
          />
        </View>

        {/* Product Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Selecione as Pecas *</Text>
            <Text style={styles.selectionCount}>
              {selectedProducts.size}/{MAX_ITEMS_PER_LOOK}
            </Text>
          </View>
          <Text style={styles.sectionHint}>
            Selecione de {MIN_ITEMS_PER_LOOK} a {MAX_ITEMS_PER_LOOK} pecas para compor o look
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : myProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bag-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Voce ainda nao tem pecas publicadas</Text>
              <Pressable
                style={styles.sellBtn}
                onPress={() => navigation.navigate('Main', { screen: 'Sell' })}
              >
                <Text style={styles.sellBtnText}>Largar primeira peca</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {myProducts.map((product) => {
                const isSelected = selectedProducts.has(product.id);
                return (
                  <Pressable
                    key={product.id}
                    style={[styles.productItem, isSelected && styles.productItemSelected]}
                    onPress={() => toggleProductSelection(product.id)}
                  >
                    <View style={styles.productImageWrap}>
                      <Image
                        source={{ uri: product.image_url || PLACEHOLDER_IMAGE }}
                        style={styles.productImage}
                        contentFit="cover"
                      />
                      {isSelected && (
                        <View style={styles.selectedOverlay}>
                          <Ionicons name="checkmark-circle" size={28} color={colors.white} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.productTitle} numberOfLines={1}>
                      {product.title}
                    </Text>
                    <Text style={styles.productPrice}>R$ {formatPrice(product.price)}</Text>
                    {product.size && <Text style={styles.productSize}>Tam: {product.size}</Text>}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Look Preview */}
        {selectedProducts.size >= MIN_ITEMS_PER_LOOK && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview do Look</Text>

            {/* Selected Products Grid */}
            <View style={styles.previewGrid}>
              {selectedProductsList.slice(0, 4).map((product, index) => (
                <View key={product.id} style={styles.previewImageWrap}>
                  <Image
                    source={{ uri: product.image_url || PLACEHOLDER_IMAGE }}
                    style={styles.previewImage}
                    contentFit="cover"
                  />
                </View>
              ))}
              {selectedProductsList.length > 4 && (
                <View style={[styles.previewImageWrap, styles.moreOverlay]}>
                  <Text style={styles.moreText}>+{selectedProductsList.length - 4}</Text>
                </View>
              )}
            </View>

            {/* Price Summary */}
            <View style={styles.priceSummary}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Preco original:</Text>
                <Text style={styles.originalPrice}>R$ {formatPrice(originalPrice)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.discountLabel}>
                  Desconto ({LOOK_DISCOUNT_PERCENT}%):
                </Text>
                <Text style={styles.discountValue}>-R$ {formatPrice(discountAmount)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                <Text style={styles.finalLabel}>Preco do combo:</Text>
                <Text style={styles.finalPrice}>R$ {formatPrice(finalPrice)}</Text>
              </View>
            </View>

            {/* Combo Badge */}
            <View style={styles.comboBadge}>
              <Ionicons name="pricetag" size={16} color={colors.lilas} />
              <Text style={styles.comboBadgeText}>
                Compradores economizam {LOOK_DISCOUNT_PERCENT}% comprando este look completo!
              </Text>
            </View>
          </View>
        )}

        {/* Save Button */}
        <Pressable
          onPress={handleSaveLook}
          disabled={saving || selectedProducts.size < MIN_ITEMS_PER_LOOK || !lookName.trim()}
        >
          <LinearGradient
            colors={
              selectedProducts.size >= MIN_ITEMS_PER_LOOK && lookName.trim()
                ? [colors.primary, colors.primaryDark]
                : [colors.gray300, colors.gray400]
            }
            style={styles.saveBtn}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                <Text style={styles.saveBtnText}>Salvar Look</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  // Guest
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  guestSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    lineHeight: 22,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Sections
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Input
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Loading & Empty
  loadingContainer: {
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sellBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  sellBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },

  // Products Grid
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  productItem: {
    width: '30%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productItemSelected: {
    borderColor: colors.primary,
  },
  productImageWrap: {
    aspectRatio: 1,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(199, 92, 58, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingTop: 2,
  },
  productSize: {
    fontSize: 10,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },

  // Preview
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  previewImageWrap: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    backgroundColor: colors.gray700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },

  // Price Summary
  priceSummary: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discountLabel: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  finalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },

  // Combo Badge
  comboBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.lilasLight,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  comboBadgeText: {
    flex: 1,
    fontSize: 13,
    color: colors.lilas,
    fontWeight: '500',
  },

  // Save Button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    marginTop: spacing['2xl'],
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});

export default CreateLookScreen;
