import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { productsService } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';
import { colors } from '../theme';

const MAIN_CATEGORIES = [
  {
    id: 'roupas',
    name: 'Roupas',
    icon: 'shirt-outline',
    subcategories: [
      { id: 'vestidos', name: 'Vestidos' },
      { id: 'blusas', name: 'Blusas' },
      { id: 'calcas', name: 'Calças' },
      { id: 'saias', name: 'Saias' },
      { id: 'shorts', name: 'Shorts' },
      { id: 'conjuntos', name: 'Conjuntos' },
    ],
  },
  {
    id: 'bolsas',
    name: 'Bolsas',
    icon: 'bag-handle-outline',
    subcategories: [{ id: 'bolsas', name: 'Bolsas' }],
  },
  {
    id: 'calcados',
    name: 'Calçados',
    icon: 'footsteps-outline',
    subcategories: [{ id: 'calcados', name: 'Calçados' }],
  },
  {
    id: 'acessorios',
    name: 'Acessórios',
    icon: 'watch-outline',
    subcategories: [{ id: 'acessorios', name: 'Acessórios' }],
  },
];

const CONDITIONS: Array<{ id: 'novo' | 'seminovo' | 'usado' | 'vintage'; name: string; desc: string }> = [
  { id: 'novo', name: 'Novo', desc: 'Com etiqueta ou nunca usado' },
  { id: 'seminovo', name: 'Seminovo', desc: 'Usado poucas vezes, ótimo estado' },
  { id: 'usado', name: 'Usado', desc: 'Sinais de uso, bom estado' },
  { id: 'vintage', name: 'Vintage', desc: 'Peça antiga, estilo retrô' },
];

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG', '34', '36', '38', '40', '42', '44'];

interface ExistingImage {
  id: string;
  url: string;
  isExisting: true;
}

interface NewImage {
  uri: string;
  isExisting: false;
}

type ProductImage = ExistingImage | NewImage;

export function EditProductScreen({ route, navigation }: any) {
  const { product } = route.params || {};
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Dynamic commission rate based on subscription
  const isPremiumUser = user?.subscription_type === 'premium' || user?.subscription_type === 'premium_plus';
  const commissionRate = isPremiumUser ? 0.10 : 0.20; // 10% premium, 20% free
  const commissionPercent = isPremiumUser ? 10 : 20;

  const [images, setImages] = useState<ProductImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<'novo' | 'seminovo' | 'usado' | 'vintage' | ''>('');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const currentMainCategory = MAIN_CATEGORIES.find(c => c.id === mainCategory);
  const subcategories = currentMainCategory?.subcategories || [];

  // Calcular preço final com taxa
  const sellerPrice = parseFloat(price) || 0;
  const finalPrice = Math.ceil(sellerPrice * (1 + commissionRate) * 100) / 100;

  useEffect(() => {
    if (product) {
      setTitle(product.title || '');
      setDescription(product.description || '');
      setBrand(product.brand || '');
      setCondition(product.condition || '');
      setSize(product.size || '');

      // Reverter a comissão para mostrar o preço do vendedor
      // O preço salvo no BD já inclui a comissão, então precisamos remover
      if (product.price) {
        const savedPrice = parseFloat(product.price);
        const sellerPrice = savedPrice / (1 + commissionRate);
        setPrice(sellerPrice.toFixed(2));
      } else {
        setPrice('');
      }

      // Original price (preço original/de comparação) - não tem comissão
      setOriginalPrice(product.original_price ? String(product.original_price) : '');

      // Determinar categoria principal
      const cat = product.category || product.category_name || '';
      const roupasCategories = ['vestidos', 'blusas', 'calcas', 'saias', 'shorts', 'conjuntos'];
      if (roupasCategories.includes(cat.toLowerCase())) {
        setMainCategory('roupas');
        setCategory(cat.toLowerCase());
      } else if (cat.toLowerCase() === 'bolsas') {
        setMainCategory('bolsas');
        setCategory('bolsas');
      } else if (cat.toLowerCase() === 'calcados') {
        setMainCategory('calcados');
        setCategory('calcados');
      } else if (cat.toLowerCase() === 'acessorios') {
        setMainCategory('acessorios');
        setCategory('acessorios');
      }

      // Carregar imagens existentes
      if (product.images && product.images.length > 0) {
        const existingImages: ProductImage[] = product.images.map((img: any) => ({
          id: img.id,
          url: typeof img === 'string' ? img : img.image_url,
          isExisting: true,
        }));
        setImages(existingImages);
      } else if (product.image_url) {
        setImages([{ id: 'main', url: product.image_url, isExisting: true }]);
      }
    }
  }, [product]);

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const handleAddImage = async () => {
    if (images.length >= 10) {
      showAlert('Limite atingido', 'Você pode adicionar no máximo 10 fotos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permissão necessária', 'Precisamos de acesso à galeria para adicionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, { uri: result.assets[0].uri, isExisting: false }]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const imageToRemove = images[index];
    if (imageToRemove.isExisting) {
      setImagesToDelete([...imagesToDelete, imageToRemove.id]);
    }
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validação detalhada
    const missingFields = [];
    if (!title) missingFields.push('título');
    if (!category) missingFields.push('categoria');
    if (!condition) missingFields.push('condição');
    if (!price) missingFields.push('preço');

    if (missingFields.length > 0) {
      showAlert('Campos obrigatórios', `Preencha: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      // 1. Atualizar dados do produto
      await productsService.updateProduct(product.id, {
        title,
        description,
        brand,
        category,
        condition: condition as 'novo' | 'seminovo' | 'usado' | 'vintage',
        size,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : undefined,
      } as any);

      // 2. Upload de novas imagens
      const newImages = images.filter(img => !img.isExisting) as NewImage[];
      const isWeb = typeof document !== 'undefined';

      for (let i = 0; i < newImages.length; i++) {
        const imageUri = newImages[i].uri;
        const formData = new FormData();

        if (isWeb && imageUri.startsWith('blob:')) {
          const blobResponse = await fetch(imageUri);
          const blob = await blobResponse.blob();
          const file = new File([blob], `photo_${i}.jpg`, { type: blob.type || 'image/jpeg' });
          formData.append('images', file);
        } else {
          const filename = imageUri.split('/').pop() || `photo_${i}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          // @ts-ignore
          formData.append('images', {
            uri: imageUri,
            name: filename,
            type,
          });
        }

        await productsService.uploadProductImages(product.id, formData);
      }

      showAlert('✓ Pronto!', 'Sua peça foi atualizada com sucesso.', () => {
        navigation.navigate('MyProducts');
      });
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      showAlert('Erro', error?.response?.data?.message || 'Não foi possível atualizar o produto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Editar Anúncio</Text>
              <Text style={styles.headerSubtitle}>Atualize as informações</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fotos</Text>
          <Text style={styles.sectionHint}>Adicione até 10 fotos. A primeira será a capa.</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            <Pressable style={styles.addPhotoBtn} onPress={handleAddImage}>
              <Ionicons name="camera" size={28} color={colors.primary} />
              <Text style={styles.addPhotoText}>Adicionar</Text>
            </Pressable>
            {images.map((img, index) => (
              <View key={index} style={styles.photoItem}>
                <Image
                  source={{ uri: img.isExisting ? img.url : img.uri }}
                  style={styles.photoImg}
                  contentFit="cover"
                />
                <Pressable style={styles.removePhotoBtn} onPress={() => handleRemoveImage(index)}>
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>
                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Capa</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Vestido floral Farm tamanho M"
            placeholderTextColor="#A3A3A3"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descreva detalhes da peça, medidas, defeitos se houver..."
            placeholderTextColor="#A3A3A3"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
        </View>

        {/* Brand */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marca</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Farm, Zara, Nike..."
            placeholderTextColor="#A3A3A3"
            value={brand}
            onChangeText={setBrand}
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoria *</Text>
          <View style={styles.optionsGrid}>
            {MAIN_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.optionCard, mainCategory === cat.id && styles.optionCardActive]}
                onPress={() => {
                  setMainCategory(cat.id);
                  if (cat.subcategories.length === 1) {
                    setCategory(cat.subcategories[0].id);
                  } else {
                    setCategory('');
                  }
                }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={24}
                  color={mainCategory === cat.id ? '#fff' : '#525252'}
                />
                <Text style={[styles.optionText, mainCategory === cat.id && styles.optionTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Subcategories */}
        {mainCategory && subcategories.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de {currentMainCategory?.name} *</Text>
            <View style={styles.subcategoriesGrid}>
              {subcategories.map((sub) => (
                <Pressable
                  key={sub.id}
                  style={[styles.subcategoryChip, category === sub.id && styles.subcategoryChipActive]}
                  onPress={() => setCategory(sub.id)}
                >
                  <Text style={[styles.subcategoryText, category === sub.id && styles.subcategoryTextActive]}>
                    {sub.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Condition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condição *</Text>
          <View style={styles.conditionList}>
            {CONDITIONS.map((cond) => (
              <Pressable
                key={cond.id}
                style={[styles.conditionItem, condition === cond.id && styles.conditionItemActive]}
                onPress={() => setCondition(cond.id)}
              >
                <View style={styles.conditionRadio}>
                  {condition === cond.id && <View style={styles.conditionRadioInner} />}
                </View>
                <View style={styles.conditionContent}>
                  <Text style={[styles.conditionName, condition === cond.id && styles.conditionNameActive]}>
                    {cond.name}
                  </Text>
                  <Text style={styles.conditionDesc}>{cond.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tamanho</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.sizesRow}>
              {SIZES.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.sizeChip, size === s && styles.sizeChipActive]}
                  onPress={() => setSize(s)}
                >
                  <Text style={[styles.sizeText, size === s && styles.sizeTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preço *</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceInputWrap}>
              <Text style={styles.priceLabel}>Você recebe</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.currency}>R$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0,00"
                  placeholderTextColor="#A3A3A3"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.priceInputWrap}>
              <Text style={styles.priceLabel}>Preço original</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.currency}>R$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0,00"
                  placeholderTextColor="#A3A3A3"
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Preço final com taxa */}
          {sellerPrice > 0 && (
            <View style={styles.finalPriceBox}>
              <View style={styles.finalPriceRow}>
                <Text style={styles.finalPriceLabel}>Preço anunciado</Text>
                <Text style={styles.finalPriceValue}>R$ {formatPrice(finalPrice)}</Text>
              </View>
              <View style={styles.feeBreakdown}>
                <Text style={styles.feeBreakdownText}>
                  Seu valor: R$ {formatPrice(sellerPrice)} + Taxa {commissionPercent}%: R$ {formatPrice(finalPrice - sellerPrice)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.feeInfo}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.feeText}>
              {isPremiumUser
                ? 'Taxa de 10% sobre vendas (você é Premium!)'
                : 'Taxa de 20% sobre vendas (10% para Premium)'}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <Pressable onPress={handleSave} disabled={loading}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.saveBtn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Salvar alterações</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { paddingHorizontal: 16 },

  // Header
  header: { paddingVertical: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  headerSubtitle: { fontSize: 14, color: '#737373', marginTop: 2 },

  // Sections
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  sectionHint: { fontSize: 13, color: '#737373', marginBottom: 12 },

  // Photos
  photosScroll: { flexDirection: 'row' },
  addPhotoBtn: { width: 100, height: 100, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addPhotoText: { fontSize: 12, fontWeight: '500', color: colors.primary, marginTop: 4 },
  photoItem: { width: 100, height: 100, borderRadius: 12, marginRight: 12, position: 'relative' },
  photoImg: { width: '100%', height: '100%', borderRadius: 12 },
  removePhotoBtn: { position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', elevation: 4, ...(Platform.OS === 'web' ? { boxShadow: '0 2px 4px rgba(0,0,0,0.2)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 }) } as any,
  coverBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  coverBadgeText: { fontSize: 10, fontWeight: '600', color: '#fff' },

  // Input
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1A1A1A', borderWidth: 1, borderColor: '#E8E8E8' },
  textArea: { height: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#A3A3A3', textAlign: 'right', marginTop: 4 },

  // Options Grid
  optionsGrid: { flexDirection: 'row', gap: 8 },
  optionCard: { flex: 1, aspectRatio: 1, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8E8E8' },
  optionCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: 11, fontWeight: '500', color: '#525252', marginTop: 4, textAlign: 'center' },
  optionTextActive: { color: '#fff' },

  // Subcategories
  subcategoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subcategoryChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E8E8' },
  subcategoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  subcategoryText: { fontSize: 14, fontWeight: '500', color: '#525252' },
  subcategoryTextActive: { color: '#fff' },

  // Condition
  conditionList: { gap: 10 },
  conditionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E8E8E8' },
  conditionItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  conditionRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D4D4D4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  conditionRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  conditionContent: { flex: 1 },
  conditionName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  conditionNameActive: { color: colors.primary },
  conditionDesc: { fontSize: 12, color: '#737373', marginTop: 2 },

  // Sizes
  sizesRow: { flexDirection: 'row', gap: 8 },
  sizeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E8E8' },
  sizeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sizeText: { fontSize: 14, fontWeight: '500', color: '#525252' },
  sizeTextActive: { color: '#fff' },

  // Price
  priceRow: { flexDirection: 'row', gap: 12 },
  priceInputWrap: { flex: 1 },
  priceLabel: { fontSize: 13, color: '#737373', marginBottom: 6 },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E8E8E8' },
  currency: { fontSize: 16, fontWeight: '600', color: '#737373', marginRight: 4 },
  priceInput: { flex: 1, fontSize: 18, fontWeight: '600', color: '#1A1A1A', paddingVertical: 12 },
  feeInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: colors.primaryMuted, padding: 12, borderRadius: 8 },
  feeText: { fontSize: 13, color: colors.primary, fontWeight: '500' },

  // Final Price Box
  finalPriceBox: { marginTop: 16, backgroundColor: '#FFF7ED', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#FB923C' },
  finalPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finalPriceLabel: { fontSize: 14, color: '#9A3412', fontWeight: '500' },
  finalPriceValue: { fontSize: 20, color: '#EA580C', fontWeight: '700' },
  feeBreakdown: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#FDBA74' },
  feeBreakdownText: { fontSize: 12, color: '#C2410C' },

  // Save
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, marginTop: 32 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default EditProductScreen;
