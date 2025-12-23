import React, { useEffect, useState } from 'react';
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
  Platform,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, CATEGORIES, CONDITIONS, SIZES, SUBSCRIPTION_PLANS } from '../constants/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { createProduct, uploadProductImages } from '../services/products';
import { Header, MainHeader } from '../components';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'NewItem'>;

export default function NewItemScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 900;
  const { user, isAuthenticated, isLoading } = useAuth();

  const isPremium = user?.subscription_type === 'premium';
  const maxPhotos = isPremium ? SUBSCRIPTION_PLANS.premium.limits.maxPhotos : SUBSCRIPTION_PLANS.free.limits.maxPhotos;

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [condition, setCondition] = useState('seminovo');

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigation.navigate('Login', { redirectTo: 'NewItem' });
    }
  }, [isAuthenticated, isLoading, navigation]);

  const getCategoryLabel = (value: string) => CATEGORIES.find((item) => item.id === value)?.name || value;

  const formatPrice = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (!numbers) return '';
    const value = parseInt(numbers, 10) / 100;
    if (Number.isNaN(value)) return '0,00';
    return value.toFixed(2).replace('.', ',');
  };

  const ensurePhotoSlots = () => {
    if (images.length < maxPhotos) return true;
    Alert.alert(
      'Limite atingido',
      isPremium
        ? `Voce pode adicionar no maximo ${maxPhotos} fotos.`
        : `Usuarios gratuitos podem adicionar ate ${maxPhotos} fotos.`
    );
    return false;
  };

  const pickImage = async () => {
    if (!ensurePhotoSlots()) {
      setShowImagePicker(false);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissao negada', 'Precisamos acessar suas fotos.');
        return;
      }

      const remainingSlots = maxPhotos - images.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => asset.uri).slice(0, remainingSlots);
        setImages([...images, ...newImages]);
      }
      setShowImagePicker(false);
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel selecionar a imagem.');
    }
  };

  const takePhoto = async () => {
    if (!ensurePhotoSlots()) {
      setShowImagePicker(false);
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissao negada', 'Precisamos acessar a camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImages([...images, result.assets[0].uri]);
      }
      setShowImagePicker(false);
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel tirar a foto.');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login', { redirectTo: 'NewItem' });
      return;
    }

    if (images.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos uma foto.');
      return;
    }
    if (!title.trim() || !description.trim() || !price.trim() || !category.trim()) {
      Alert.alert('Erro', 'Preencha os campos obrigatorios.');
      return;
    }

    setUploading(true);

    try {
      const priceValue = parseFloat(price.replace(',', '.'));
      const originalPriceValue = originalPrice ? parseFloat(originalPrice.replace(',', '.')) : undefined;

      const conditionMap: { [key: string]: 'novo' | 'seminovo' | 'usado' } = {
        novo: 'novo',
        seminovo: 'seminovo',
        usado: 'usado',
      };

      const result = await createProduct({
        title: title.trim(),
        description: description.trim(),
        brand: brand.trim() || undefined,
        size: size || undefined,
        color: color.trim() || undefined,
        condition: conditionMap[condition] || 'seminovo',
        price: priceValue,
        original_price: originalPriceValue,
        category: category || undefined,
      });

      if (result.product && images.length > 0) {
        await uploadProductImages(result.product.id, images);
      }

      Alert.alert('Sucesso!', 'Seu anuncio foi publicado.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel publicar.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {isWeb ? (
        <MainHeader navigation={navigation} title="Nova peca" />
      ) : (
        <Header navigation={navigation} title="Nova peca" />
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Fotos</Text>
          <Text style={styles.sectionSubtitle}>
            {isPremium ? `Ate ${maxPhotos} fotos` : `Ate ${maxPhotos} fotos (Premium ate 10)`}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {images.length < maxPhotos && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={() => setShowImagePicker(true)}>
                <Ionicons name="add" size={24} color={COLORS.textSecondary} />
                <Text style={styles.addPhotoText}>Adicionar</Text>
              </TouchableOpacity>
            )}

            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrap}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
                {index === 0 && (
                  <View style={styles.mainPhotoBadge}>
                    <Text style={styles.mainPhotoText}>PRINCIPAL</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Informacoes basicas</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Titulo *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Vestido floral midi"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descricao *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva a peca, tecido, detalhes"
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Marca</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="Ex: Farm, Zara"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Detalhes</Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputGroupFlex]}>
              <Text style={styles.label}>Categoria *</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowCategoryModal(true)}>
                <Text style={category ? styles.selectText : styles.selectPlaceholder}>
                  {category ? getCategoryLabel(category) : 'Selecione'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, styles.inputGroupFlex]}>
              <Text style={styles.label}>Condicao *</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowConditionModal(true)}>
                <Text style={condition ? styles.selectText : styles.selectPlaceholder}>
                  {CONDITIONS.find((c) => c.id === condition)?.label || 'Selecione'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputGroupFlex]}>
              <Text style={styles.label}>Tamanho</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setShowSizeModal(true)}>
                <Text style={size ? styles.selectText : styles.selectPlaceholder}>{size || 'Selecione'}</Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, styles.inputGroupFlex]}>
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

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Preco</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preco de venda *</Text>
            <View style={styles.priceInputWrap}>
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
            <Text style={styles.label}>Preco original (opcional)</Text>
            <View style={styles.priceInputWrap}>
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

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
        <TouchableOpacity
          style={[styles.publishButton, uploading && styles.publishButtonDisabled]}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.publishButtonText}>Publicar anuncio</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CATEGORIES.filter((c) => c.id !== 'all' && c.id !== 'premium').map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setCategory(cat.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{cat.name}</Text>
                  {category === cat.id && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showConditionModal} transparent animationType="slide" onRequestClose={() => setShowConditionModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowConditionModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a condicao</Text>
              <TouchableOpacity onPress={() => setShowConditionModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CONDITIONS.map((cond) => (
                <TouchableOpacity
                  key={cond.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setCondition(cond.id);
                    setShowConditionModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{cond.label}</Text>
                  {condition === cond.id && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSizeModal} transparent animationType="slide" onRequestClose={() => setShowSizeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSizeModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o tamanho</Text>
              <TouchableOpacity onPress={() => setShowSizeModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.sizeGrid}>
              {SIZES.feminino.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sizeOption, size === s && styles.sizeOptionSelected]}
                  onPress={() => {
                    setSize(s);
                    setShowSizeModal(false);
                  }}
                >
                  <Text style={[styles.sizeOptionText, size === s && styles.sizeOptionTextSelected]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showImagePicker} transparent animationType="fade" onRequestClose={() => setShowImagePicker(false)}>
        <View style={styles.imagePickerOverlay}>
          <TouchableOpacity style={styles.imagePickerBackdrop} activeOpacity={1} onPress={() => setShowImagePicker(false)} />
          <View style={styles.imagePickerModal}>
            <TouchableOpacity style={styles.imagePickerOption} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
              <Text style={styles.imagePickerText}>Tirar foto</Text>
            </TouchableOpacity>
            <View style={styles.imagePickerDivider} />
            <TouchableOpacity style={styles.imagePickerOption} onPress={pickImage}>
              <Ionicons name="images-outline" size={20} color={COLORS.primary} />
              <Text style={styles.imagePickerText}>Escolher da galeria</Text>
            </TouchableOpacity>
            <View style={styles.imagePickerDivider} />
            <TouchableOpacity style={styles.imagePickerCancelOption} onPress={() => setShowImagePicker(false)}>
              <Text style={styles.imagePickerCancelText}>Cancelar</Text>
            </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  sectionDesktop: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  imagesRow: {
    marginTop: SPACING.xs,
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addPhotoText: {
    marginTop: 6,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  imageWrap: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.backgroundDark,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 2,
    alignItems: 'center',
  },
  mainPhotoText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.extrabold,
    color: COLORS.textInverse,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputGroupFlex: {
    flex: 1,
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
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
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
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  selectText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  selectPlaceholder: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textTertiary,
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.sm,
  },
  publishButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  publishButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  publishButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS['2xl'],
    borderTopRightRadius: BORDER_RADIUS['2xl'],
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
    gap: SPACING.md,
  },
  sizeOption: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryExtraLight,
  },
  sizeOptionText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  sizeOptionTextSelected: {
    color: COLORS.primary,
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
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    width: '85%',
    ...SHADOWS.md,
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  imagePickerText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  imagePickerCancelOption: {
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  imagePickerCancelText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  imagePickerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});
