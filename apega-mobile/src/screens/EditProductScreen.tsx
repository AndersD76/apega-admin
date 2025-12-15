import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, CATEGORIES, CONDITIONS, SIZES, SUBSCRIPTION_PLANS } from '../constants/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { getProduct, updateProduct, uploadProductImages, deleteProduct, Product } from '../services/products';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProduct'>;

export default function EditProductScreen({ navigation, route }: Props) {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const isPremium = user?.subscription_type === 'premium';
  const maxPhotos = isPremium ? SUBSCRIPTION_PLANS.premium.limits.maxPhotos : SUBSCRIPTION_PLANS.free.limits.maxPhotos;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  // Imagens existentes (URLs) e novas imagens (URIs locais)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);

  // Dados da peça
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [condition, setCondition] = useState('seminovo');
  const [status, setStatus] = useState<'active' | 'paused'>('active');

  // Modais
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Carregar dados do produto
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProduct(productId);
        const p = response.product;
        setProduct(p);

        setTitle(p.title || '');
        setDescription(p.description || '');
        setBrand(p.brand || '');
        setSize(p.size || '');
        setColor(p.color || '');
        setCondition(p.condition || 'seminovo');
        setStatus(p.status === 'paused' ? 'paused' : 'active');

        // Formatar preço
        if (p.price) {
          const priceNum = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
          setPrice(priceNum.toFixed(2).replace('.', ','));
        }
        if (p.original_price) {
          const origPriceNum = typeof p.original_price === 'string' ? parseFloat(p.original_price) : p.original_price;
          setOriginalPrice(origPriceNum.toFixed(2).replace('.', ','));
        }

        // Categoria
        if (p.category_name) {
          setCategory(p.category_name);
        }

        // Imagens existentes
        if (p.images && p.images.length > 0) {
          setExistingImages(p.images.map(img => img.image_url));
        } else if (p.image_url) {
          setExistingImages([p.image_url]);
        }
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
        Alert.alert('Erro', 'Não foi possível carregar o produto');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const totalImages = existingImages.length + newImages.length;

  const pickImage = async () => {
    if (totalImages >= maxPhotos) {
      Alert.alert(
        'Limite atingido',
        isPremium
          ? `Você pode ter no máximo ${maxPhotos} fotos.`
          : `Usuários gratuitos podem ter até ${maxPhotos} fotos. Seja Premium para até 10 fotos!`,
        isPremium ? [{ text: 'OK' }] : [
          { text: 'Continuar', style: 'cancel' },
          { text: 'Ser Premium', onPress: () => navigation.navigate('Subscription' as any) }
        ]
      );
      setShowImagePicker(false);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos');
        return;
      }

      const remainingSlots = maxPhotos - totalImages;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled) {
        const newUris = result.assets.map(asset => asset.uri).slice(0, remainingSlots);
        setNewImages([...newImages, ...newUris]);
      }
      setShowImagePicker(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const takePhoto = async () => {
    if (totalImages >= maxPhotos) {
      Alert.alert('Limite atingido', `Você pode ter no máximo ${maxPhotos} fotos.`);
      setShowImagePicker(false);
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de permissão para acessar sua câmera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setNewImages([...newImages, result.assets[0].uri]);
      }
      setShowImagePicker(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Preencha o título da peça');
      return;
    }

    if (!price.trim()) {
      Alert.alert('Erro', 'Preencha o preço');
      return;
    }

    setSaving(true);

    try {
      const priceValue = parseFloat(price.replace(',', '.'));
      const originalPriceValue = originalPrice ? parseFloat(originalPrice.replace(',', '.')) : undefined;

      await updateProduct(productId, {
        title: title.trim(),
        description: description.trim() || undefined,
        brand: brand.trim() || undefined,
        size: size || undefined,
        color: color.trim() || undefined,
        condition: condition as 'novo' | 'seminovo' | 'usado',
        price: priceValue,
        original_price: originalPriceValue,
        status: status,
      });

      // Upload novas imagens se houver
      if (newImages.length > 0) {
        try {
          await uploadProductImages(productId, newImages);
        } catch (uploadError) {
          console.error('Erro ao fazer upload das imagens:', uploadError);
        }
      }

      Alert.alert(
        'Sucesso!',
        'Produto atualizado com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', error.message || 'Não foi possível salvar as alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setDeleting(true);

    try {
      await deleteProduct(productId);
      Alert.alert(
        'Produto removido',
        'O produto foi removido com sucesso.',
        [{ text: 'OK', onPress: () => navigation.navigate('MyStore') }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível remover o produto');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = status === 'active' ? 'paused' : 'active';
    setStatus(newStatus);
  };

  const formatPrice = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (!numbers) return '';
    const value = parseInt(numbers) / 100;
    if (isNaN(value)) return '0,00';
    return value.toFixed(2).replace('.', ',');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando produto...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Produto</Text>
        <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
          <Ionicons name="trash-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status do produto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <TouchableOpacity style={styles.statusToggle} onPress={handleToggleStatus}>
            <View style={[styles.statusIndicator, status === 'active' ? styles.statusActive : styles.statusPaused]} />
            <Text style={styles.statusText}>
              {status === 'active' ? 'Ativo - visível para compradores' : 'Pausado - não visível'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Fotos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fotos</Text>
          <Text style={styles.photoCounter}>{totalImages}/{maxPhotos} fotos</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesList}>
            {/* Botão de adicionar foto */}
            {totalImages < maxPhotos && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={() => setShowImagePicker(true)}>
                <Ionicons name="add" size={32} color={COLORS.textSecondary} />
                <Text style={styles.addPhotoText}>Adicionar</Text>
              </TouchableOpacity>
            )}

            {/* Imagens existentes */}
            {existingImages.map((uri, index) => (
              <View key={`existing-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => removeExistingImage(index)}>
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
                {index === 0 && existingImages.length > 0 && (
                  <View style={styles.mainPhotoBadge}>
                    <Text style={styles.mainPhotoText}>PRINCIPAL</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Novas imagens */}
            {newImages.map((uri, index) => (
              <View key={`new-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => removeNewImage(index)}>
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
                <View style={styles.newPhotoBadge}>
                  <Text style={styles.newPhotoText}>NOVA</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Informações Básicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Vestido Floral Midi"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva a peça, tecido, detalhes..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Marca</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="Ex: Farm, Zara, etc"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>
        </View>

        {/* Detalhes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes</Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Categoria</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowCategoryModal(true)}>
                <Text style={category ? styles.selectText : styles.selectPlaceholder}>
                  {category || 'Selecione'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Condição *</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowConditionModal(true)}>
                <Text style={styles.selectText}>
                  {CONDITIONS.find(c => c.id === condition)?.label || 'Selecione'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Tamanho</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowSizeModal(true)}>
                <Text style={size ? styles.selectText : styles.selectPlaceholder}>
                  {size || 'Selecione'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Cor</Text>
              <TextInput
                style={styles.input}
                value={color}
                onChangeText={setColor}
                placeholder="Ex: Azul"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Preço */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preço</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preço de venda *</Text>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.currencySymbol}>R$</Text>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={(text) => setPrice(formatPrice(text))}
                placeholder="0,00"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preço original (opcional)</Text>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.currencySymbol}>R$</Text>
              <TextInput
                style={styles.priceInput}
                value={originalPrice}
                onChangeText={(text) => setOriginalPrice(formatPrice(text))}
                placeholder="0,00"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer com botão de salvar */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
        <TouchableOpacity
          style={[styles.saveButton, (saving || deleting) && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving || deleting}
          activeOpacity={0.9}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Categoria */}
      <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'premium').map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.modalOption}
                  onPress={() => { setCategory(cat.name); setShowCategoryModal(false); }}
                >
                  <Text style={styles.modalOptionText}>{cat.name}</Text>
                  {category === cat.name && <Ionicons name="checkmark" size={24} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Condição */}
      <Modal visible={showConditionModal} transparent animationType="slide" onRequestClose={() => setShowConditionModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowConditionModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Condição</Text>
              <TouchableOpacity onPress={() => setShowConditionModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CONDITIONS.map((cond) => (
                <TouchableOpacity
                  key={cond.id}
                  style={styles.modalOption}
                  onPress={() => { setCondition(cond.id); setShowConditionModal(false); }}
                >
                  <Text style={styles.modalOptionText}>{cond.label}</Text>
                  {condition === cond.id && <Ionicons name="checkmark" size={24} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Tamanho */}
      <Modal visible={showSizeModal} transparent animationType="slide" onRequestClose={() => setShowSizeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSizeModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Tamanho</Text>
              <TouchableOpacity onPress={() => setShowSizeModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.sizeGrid}>
                {SIZES.feminino.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sizeOption, size === s && styles.sizeOptionSelected]}
                    onPress={() => { setSize(s); setShowSizeModal(false); }}
                  >
                    <Text style={[styles.sizeOptionText, size === s && styles.sizeOptionTextSelected]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Seleção de Imagem */}
      <Modal visible={showImagePicker} transparent animationType="fade" onRequestClose={() => setShowImagePicker(false)}>
        <View style={styles.imagePickerOverlay}>
          <TouchableOpacity style={styles.imagePickerBackdrop} activeOpacity={1} onPress={() => setShowImagePicker(false)} />
          <View style={styles.imagePickerModal}>
            <TouchableOpacity style={styles.imagePickerOption} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color={COLORS.primary} />
              <Text style={styles.imagePickerText}>Tirar Foto</Text>
            </TouchableOpacity>
            <View style={styles.imagePickerDivider} />
            <TouchableOpacity style={styles.imagePickerOption} onPress={pickImage}>
              <Ionicons name="images" size={24} color={COLORS.primary} />
              <Text style={styles.imagePickerText}>Escolher da Galeria</Text>
            </TouchableOpacity>
            <View style={styles.imagePickerDivider} />
            <TouchableOpacity style={styles.imagePickerCancelOption} onPress={() => setShowImagePicker(false)}>
              <Text style={styles.imagePickerCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Ionicons name="trash-outline" size={48} color={COLORS.error} style={{ marginBottom: SPACING.md }} />
            <Text style={styles.deleteModalTitle}>Remover produto?</Text>
            <Text style={styles.deleteModalText}>
              Esta ação não pode ser desfeita. O produto será removido permanentemente.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={handleDelete}
              >
                <Text style={styles.deleteModalConfirmText}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  statusActive: {
    backgroundColor: COLORS.success,
  },
  statusPaused: {
    backgroundColor: COLORS.warning,
  },
  statusText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  photoCounter: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  imagesList: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addPhotoText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray[100],
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: COLORS.primary,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    alignItems: 'center',
  },
  mainPhotoText: {
    fontSize: 8,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  newPhotoBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: COLORS.success,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    alignItems: 'center',
  },
  newPhotoText: {
    fontSize: 8,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 100,
    paddingTop: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  selectText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  selectPlaceholder: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textTertiary,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  currencySymbol: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    paddingLeft: SPACING.md,
  },
  priceInput: {
    flex: 1,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalOptionText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  sizeOption: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  sizeOptionText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  sizeOptionTextSelected: {
    color: COLORS.white,
  },
  imagePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imagePickerModal: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    width: '85%',
    overflow: 'hidden',
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  imagePickerText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  imagePickerCancelOption: {
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
  },
  imagePickerCancelText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
  },
  imagePickerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  deleteModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
  },
  deleteModalTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  deleteModalText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  deleteModalCancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  deleteModalConfirmButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
});
