import React, { useState, useEffect, useMemo } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, CATEGORIES, CONDITIONS, SIZES, SUBSCRIPTION_PLANS } from '../constants/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { createProduct, uploadProductImages } from '../services/products';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'NewItem'>;

export default function NewItemScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 768;
  const styles = useMemo(() => createStyles(isDesktop), [isDesktop]);
  const { user, isAuthenticated, isLoading } = useAuth();

  // Verificar se é premium (default false se não houver user)
  const isPremium = user?.subscription_type === 'premium';
  const maxPhotos = isPremium ? SUBSCRIPTION_PLANS.premium.limits.maxPhotos : SUBSCRIPTION_PLANS.free.limits.maxPhotos;

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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

  // Modais
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigation.navigate('Login', { redirectTo: 'NewItem' });
    }
  }, [isAuthenticated, isLoading, navigation]);


  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((item) => item.id === value)?.name || value;
  };

  const pickImage = async () => {
    // Verificar limite de fotos
    if (images.length >= maxPhotos) {
      Alert.alert(
        'Limite atingido',
        isPremium
          ? `Você pode adicionar no máximo ${maxPhotos} fotos.`
          : `Usuários gratuitos podem adicionar até ${maxPhotos} fotos. Seja Premium para adicionar até 10 fotos!`,
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

      const remainingSlots = maxPhotos - images.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri).slice(0, remainingSlots);
        setImages([...images, ...newImages]);
      }
      setShowImagePicker(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const takePhoto = async () => {
    // Verificar limite de fotos
    if (images.length >= maxPhotos) {
      Alert.alert(
        'Limite atingido',
        isPremium
          ? `Você pode adicionar no máximo ${maxPhotos} fotos.`
          : `Usuários gratuitos podem adicionar até ${maxPhotos} fotos. Seja Premium para adicionar até 10 fotos!`,
        isPremium ? [{ text: 'OK' }] : [
          { text: 'Continuar', style: 'cancel' },
          { text: 'Ser Premium', onPress: () => navigation.navigate('Subscription' as any) }
        ]
      );
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
        setImages([...images, result.assets[0].uri]);
      }
      setShowImagePicker(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível tirar a foto');
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
    // Validações
    if (images.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos uma foto da peça');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Erro', 'Preencha o título da peça');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Erro', 'Preencha a descrição');
      return;
    }

    if (!price.trim()) {
      Alert.alert('Erro', 'Preencha o preço');
      return;
    }

    if (!category.trim()) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }

    setUploading(true);

    try {
      // Converter preços de string para número
      const priceValue = parseFloat(price.replace(',', '.'));
      const originalPriceValue = originalPrice ? parseFloat(originalPrice.replace(',', '.')) : undefined;

      // Mapear condição para o formato esperado pelo backend
      const conditionMap: { [key: string]: 'novo' | 'seminovo' | 'usado' } = {
        'novo': 'novo',
        'seminovo': 'seminovo',
        'usado': 'usado',
      };

      // Criar produto via API
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

      console.log('Produto criado:', result);

      // Upload das imagens
      if (result.product && images.length > 0) {
        console.log('Fazendo upload de', images.length, 'imagens...');
        try {
          const uploadResult = await uploadProductImages(result.product.id, images);
          console.log('Imagens enviadas:', uploadResult);
        } catch (uploadError) {
          console.error('Erro ao fazer upload das imagens:', uploadError);
          // Não bloquear o sucesso - o produto foi criado
        }
      }

      Alert.alert(
        'Sucesso!',
        'Seu anúncio foi publicado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao publicar anúncio:', error);
      Alert.alert('Erro', error.message || 'Não foi possível publicar o anúncio');
    } finally {
      setUploading(false);
    }
  };

  const formatPrice = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (!numbers) return '';
    const value = parseInt(numbers) / 100;
    if (isNaN(value)) return '0,00';
    return value.toFixed(2).replace('.', ',');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        {isDesktop ? (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.logo}>apega<Text style={styles.logoLight}>desapega</Text></Text>
            </TouchableOpacity>
            <View style={styles.navDesktop}>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Text style={styles.navLink}>Explorar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Favorites')}>
                <Text style={styles.navLink}>Favoritos</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Nova Peça</Text>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nova Peça</Text>
            <View style={{ width: 40 }} />
          </>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Fotos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fotos</Text>
          <Text style={styles.sectionSubtitle}>
            {isPremium
              ? `Adicione até ${maxPhotos} fotos da sua peça`
              : `Adicione até ${maxPhotos} fotos (Premium: até 10)`}
          </Text>
          <Text style={styles.photoCounter}>
            {images.length}/{maxPhotos} fotos
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesList}>
            {/* Botão de adicionar foto - só mostra se ainda tem espaço */}
            {images.length < maxPhotos && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={() => setShowImagePicker(true)}
              >
                <Text style={styles.addPhotoIcon}>+</Text>
                <Text style={styles.addPhotoText}>Adicionar</Text>
              </TouchableOpacity>
            )}

            {/* Fotos adicionadas */}
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeImageText}>×</Text>
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
            <Text style={styles.label}>Descrição *</Text>
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
              <Text style={styles.label}>Categoria *</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={category ? styles.selectText : styles.selectPlaceholder}>
                  {category ? getCategoryLabel(category) : 'Selecione'}
                </Text>
                <Text style={styles.selectIcon}>â€º</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Condição *</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowConditionModal(true)}
              >
                <Text style={condition ? styles.selectText : styles.selectPlaceholder}>
                  {CONDITIONS.find(c => c.id === condition)?.label || 'Selecione'}
                </Text>
                <Text style={styles.selectIcon}>â€º</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Tamanho</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowSizeModal(true)}
              >
                <Text style={size ? styles.selectText : styles.selectPlaceholder}>
                  {size || 'Selecione'}
                </Text>
                <Text style={styles.selectIcon}>â€º</Text>
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
            <Text style={styles.hint}>
              Mostre quanto custava para destacar o desconto
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer com botão de publicar */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
        <TouchableOpacity
          style={[styles.publishButton, uploading && styles.publishButtonDisabled]}
          onPress={handleSubmit}
          disabled={uploading}
          activeOpacity={0.9}
        >
          {uploading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.publishButtonText}>Publicar Anúncio</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Categoria */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'premium').map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setCategory(cat.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{cat.name}</Text>
                  {category === cat.id && (
                    <Text style={styles.modalCheck}>âœ“</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Condição */}
      <Modal
        visible={showConditionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConditionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConditionModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Condição</Text>
              <TouchableOpacity onPress={() => setShowConditionModal(false)}>
                <Text style={styles.modalClose}>×</Text>
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
                  {condition === cond.id && (
                    <Text style={styles.modalCheck}>âœ“</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Tamanho */}
      <Modal
        visible={showSizeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSizeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSizeModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Tamanho</Text>
              <TouchableOpacity onPress={() => setShowSizeModal(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.sizeGrid}>
                {SIZES.feminino.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sizeOption, size === s && styles.sizeOptionSelected]}
                    onPress={() => {
                      setSize(s);
                      setShowSizeModal(false);
                    }}
                  >
                    <Text style={[styles.sizeOptionText, size === s && styles.sizeOptionTextSelected]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Seleção de Imagem */}
      <Modal
        visible={showImagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.imagePickerOverlay}>
          <TouchableOpacity
            style={styles.imagePickerBackdrop}
            activeOpacity={1}
            onPress={() => setShowImagePicker(false)}
          />
          <View style={styles.imagePickerModal}>
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={() => {
                console.log('Tirar Foto pressed');
                takePhoto();
              }}
            >
              <Text style={styles.imagePickerIcon}>ðŸ“·</Text>
              <Text style={styles.imagePickerText}>Tirar Foto</Text>
            </TouchableOpacity>
            <View style={styles.imagePickerDivider} />
            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={() => {
                console.log('Escolher da Galeria pressed');
                pickImage();
              }}
            >
              <Text style={styles.imagePickerIcon}>ðŸ–¼ï¸</Text>
              <Text style={styles.imagePickerText}>Escolher da Galeria</Text>
            </TouchableOpacity>
            <View style={styles.imagePickerDivider} />
            <TouchableOpacity
              style={styles.imagePickerCancelOption}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.imagePickerCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (isDesktop: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    paddingHorizontal: isDesktop ? 60 : SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  logoLight: {
    fontWeight: '400',
    color: COLORS.gray[400],
  },
  navDesktop: {
    flexDirection: 'row',
    gap: 32,
  },
  navLink: {
    fontSize: 15,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
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
    maxWidth: isDesktop ? 700 : '100%',
    alignSelf: 'center',
    width: '100%',
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
    marginBottom: SPACING.xs,
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
    width: 120,
    height: 120,
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addPhotoIcon: {
    fontSize: 32,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  addPhotoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.gray[100],
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
    ...SHADOWS.md,
  },
  removeImageText: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  mainPhotoText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.extrabold,
    color: COLORS.white,
    letterSpacing: 0.5,
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
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 120,
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
    borderRadius: BORDER_RADIUS.lg,
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
  selectIcon: {
    fontSize: 24,
    color: COLORS.textTertiary,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
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
  hint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  footer: {
    padding: SPACING.lg,
    paddingHorizontal: isDesktop ? 60 : SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.xl,
  },
  publishButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    maxWidth: isDesktop ? 400 : '100%',
    alignSelf: isDesktop ? 'center' : undefined,
    width: '100%',
    ...SHADOWS.md,
  },
  publishButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  publishButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
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
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  modalClose: {
    fontSize: 36,
    color: COLORS.textSecondary,
    fontWeight: '300',
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
  modalCheck: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
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
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
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
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    width: '85%',
    ...SHADOWS.lg,
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  imagePickerIcon: {
    fontSize: 24,
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
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  imagePickerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});


