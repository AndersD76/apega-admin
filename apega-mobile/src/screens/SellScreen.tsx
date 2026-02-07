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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { productsService, aiService, tagsService, Tag, BACKGROUND_OPTIONS, BackgroundType } from '../api';
import { formatPrice } from '../utils/format';
import { colors } from '../theme';
import { CATEGORIES, CONDITIONS, getSizesForSubcategory, MICROCOPY } from '../constants';

// Limits for free users
const FREE_USER_PRODUCT_LIMIT = 20;

export function SellScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();

  // Dynamic commission rate based on subscription
  const isPremiumUser = user?.subscription_type === 'premium' || user?.subscription_type === 'premium_plus';
  const commissionRate = isPremiumUser ? 0.10 : 0.20; // 10% premium, 20% free
  const commissionPercent = isPremiumUser ? 10 : 20;
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [condition, setCondition] = useState<string>('');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [availableTags, setAvailableTags] = useState<{ [key: string]: Tag[] }>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiProcessing, setAiProcessing] = useState<{ type: string; index: number } | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<{ [index: number]: string }>({});
  const [showAiOptions, setShowAiOptions] = useState(false);
  const [showBackgroundOptions, setShowBackgroundOptions] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [userProductCount, setUserProductCount] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [labelImage, setLabelImage] = useState<string | null>(null);
  const [virtualTryOnUrl, setVirtualTryOnUrl] = useState<string | null>(null);
  const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);

  // Check user's product count for free users
  useEffect(() => {
    if (isAuthenticated && !isPremiumUser) {
      productsService.getMyProducts().then(res => {
        if (res.success) {
          setUserProductCount(res.products?.length || 0);
        }
      }).catch(console.error);
    }
  }, [isAuthenticated, isPremiumUser]);

  // Check if free user has reached limit
  const hasReachedLimit = !isPremiumUser && userProductCount >= FREE_USER_PRODUCT_LIMIT;
  const remainingSlots = FREE_USER_PRODUCT_LIMIT - userProductCount;

  // Carregar tags disponiveis
  useEffect(() => {
    tagsService.getTags().then(res => {
      if (res.success) {
        setAvailableTags(res.grouped);
      }
    }).catch(console.error);
  }, []);

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Calcular preço final com taxa
  const sellerPrice = parseFloat(price) || 0;
  const finalPrice = Math.ceil(sellerPrice * (1 + commissionRate) * 100) / 100;

  // Obter categoria, subcategorias e tipos selecionados
  const currentCategory = CATEGORIES.find(c => c.id === selectedCategoryId);
  const subcategories = currentCategory?.subcategories || [];
  const currentSubcategory = subcategories.find(s => s.id === selectedSubcategoryId);
  const types = currentSubcategory?.types || [];

  // Tamanhos dinâmicos baseados na subcategoria
  const availableSizes = selectedSubcategoryId ? getSizesForSubcategory(selectedSubcategoryId) : [];

  const analyzeImageWithAI = async (imageUri: string) => {
    setAiAnalyzing(true);

    // Tentar usar a API real de IA se o usuário estiver autenticado
    if (isAuthenticated) {
      try {
        const response = await aiService.analyzeClothing(imageUri);

        if (response.success && response.analysis) {
          const { analysis, suggestedCategory } = response;

          // Mapear condição da API para o novo formato
          const conditionMap: Record<string, string> = {
            'novo_com_etiqueta': 'novo_etiqueta',
            'seminovo': 'seminovo',
            'bom_estado': 'bom_estado',
            'usado': 'usado',
            'muito_usado': 'usado',
          };

          setTitle(analysis.tituloSugerido || '');
          setDescription(analysis.descricaoSugerida || '');
          setBrand(analysis.marca !== 'Não identificada' ? analysis.marca : '');
          setCondition(conditionMap[analysis.condicao] || 'seminovo');
          setSize(analysis.tamanho || '');

          // Definir categoria baseado na sugestão (mapear para nova estrutura)
          const categoryMappings: Record<string, { cat: string; subcat: string; type?: string }> = {
            'vestidos': { cat: 'feminino', subcat: 'fem-roupas', type: 'vestidos' },
            'blusas': { cat: 'feminino', subcat: 'fem-roupas', type: 'blusas-tops' },
            'calcas': { cat: 'feminino', subcat: 'fem-roupas', type: 'calcas-shorts' },
            'saias': { cat: 'feminino', subcat: 'fem-roupas', type: 'saias' },
            'shorts': { cat: 'feminino', subcat: 'fem-roupas', type: 'calcas-shorts' },
            'conjuntos': { cat: 'feminino', subcat: 'fem-roupas', type: 'conjuntos' },
            'bolsas': { cat: 'acessorios', subcat: 'bolsas-mochilas' },
            'calcados': { cat: 'feminino', subcat: 'fem-calcados' },
            'acessorios': { cat: 'acessorios', subcat: 'bijuterias-joias' },
          };

          const mapping = categoryMappings[suggestedCategory] || { cat: 'feminino', subcat: 'fem-roupas', type: 'blusas-tops' };
          setSelectedCategoryId(mapping.cat);
          setSelectedSubcategoryId(mapping.subcat);
          if (mapping.type) setSelectedTypeId(mapping.type);

          // Sugerir preço se disponível
          // A IA sugere o preço de venda (final), precisamos calcular quanto o vendedor recebe
          if (analysis.precoSugerido?.recomendado) {
            // Converter preço de venda para preço do vendedor (descontando comissão)
            const suggestedDisplayPrice = analysis.precoSugerido.recomendado;
            const sellerReceives = Math.floor(suggestedDisplayPrice / (1 + commissionRate));
            setPrice(sellerReceives.toString());
          }

          setAiAnalyzing(false);

          // Virtual Try-On automático para Premium
          if (isPremiumUser && response.imageUrl) {
            try {
              const tryOnResult = await aiService.virtualTryOn(response.imageUrl);
              if (tryOnResult.success && tryOnResult.result?.outputUrl) {
                setVirtualTryOnUrl(tryOnResult.result.outputUrl);
                setShowVirtualTryOn(true);
              }
            } catch (tryOnError) {
              console.log('Virtual try-on não disponível:', tryOnError);
            }
          }

          Alert.alert(
            '✨ IA Aplicada!',
            'Preenchemos automaticamente: título, descrição, marca, categoria, condição, tamanho e preço sugerido.\n\nRevise os dados e edite o que precisar antes de publicar.',
            [{ text: 'Entendi' }]
          );
          return;
        }
      } catch (error: any) {
        console.log('AI API error:', error?.response?.status || error.message);

        // Se for erro 403 (não premium), mostrar mensagem especial
        if (error?.response?.status === 403) {
          setAiAnalyzing(false);
          Alert.alert(
            'Recurso Premium',
            'A análise com IA é exclusiva para assinantes Premium. Atualize seu plano para desbloquear!',
            [
              { text: 'Depois' },
              { text: 'Ver planos', onPress: () => {} },
            ]
          );
          return;
        }
        // Outros erros: continuar para simulação
        console.log('Usando simulação de IA...');
      }
    }

    // Simulação de fallback (quando API não disponível ou usuário não autenticado)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockAnalysis = {
      title: 'Peça de vestuário',
      categoryId: 'feminino',
      subcategoryId: 'fem-roupas',
      typeId: 'blusas-tops',
      brand: '',
      condition: 'seminovo',
      description: 'Peça em ótimo estado, bem conservada. Ideal para uso casual.',
    };

    setTitle(mockAnalysis.title);
    setSelectedCategoryId(mockAnalysis.categoryId);
    setSelectedSubcategoryId(mockAnalysis.subcategoryId);
    setSelectedTypeId(mockAnalysis.typeId);
    setBrand(mockAnalysis.brand);
    setCondition(mockAnalysis.condition);
    setDescription(mockAnalysis.description);

    setAiAnalyzing(false);
    Alert.alert(
      'Análise Básica',
      'Preenchemos alguns campos. Para análise completa com IA, faça login e assine Premium.',
      [{ text: 'OK' }]
    );
  };

  // Abrir opcoes de IA para imagem
  const handleImagePress = (index: number) => {
    if (isPremiumUser) {
      setSelectedImageIndex(index);
      setShowAiOptions(true);
    }
  };

  // Mostrar opcoes de fundo
  const handleShowBackgroundOptions = () => {
    setShowAiOptions(false);
    setShowBackgroundOptions(true);
  };

  // Substituir fundo da imagem com opcao selecionada
  const handleReplaceBackground = async (backgroundType: BackgroundType) => {
    if (selectedImageIndex === null) return;

    setShowBackgroundOptions(false);
    setAiProcessing({ type: 'background', index: selectedImageIndex });

    try {
      const imageUri = images[selectedImageIndex];

      // Chamar API de substituicao de fundo
      const response = await aiService.replaceBackground(imageUri, backgroundType);

      if (response.success && response.result?.processed_url) {
        // Atualizar imagem com versao com novo fundo
        const newImages = [...images];
        newImages[selectedImageIndex] = response.result.processed_url;
        setImages(newImages);

        const bgOption = BACKGROUND_OPTIONS.find(opt => opt.id === backgroundType);
        Alert.alert('Sucesso!', `Fundo "${bgOption?.name}" aplicado com sucesso!`);
      } else {
        Alert.alert('Erro', 'Não foi possível processar a imagem');
      }
    } catch (error: any) {
      console.error('Error replacing background:', error);
      Alert.alert('Erro', error?.response?.data?.message || 'Erro ao processar imagem');
    } finally {
      setAiProcessing(null);
      setSelectedImageIndex(null);
    }
  };

  // Melhorar qualidade da imagem
  const handleEnhanceImage = async () => {
    if (selectedImageIndex === null) return;

    setShowAiOptions(false);
    setAiProcessing({ type: 'enhance', index: selectedImageIndex });

    try {
      const imageUri = images[selectedImageIndex];

      // Chamar API de melhoria
      const response = await aiService.enhanceImage(imageUri);

      if (response.success && response.result?.enhanced_url) {
        // Atualizar imagem com versao melhorada
        const newImages = [...images];
        newImages[selectedImageIndex] = response.result.enhanced_url;
        setImages(newImages);

        Alert.alert('Sucesso!', 'Imagem melhorada com sucesso!');
      } else {
        Alert.alert('Erro', 'Nao foi possivel melhorar a imagem');
      }
    } catch (error: any) {
      console.error('Error enhancing image:', error);
      Alert.alert('Erro', error?.response?.data?.message || 'Erro ao processar imagem');
    } finally {
      setAiProcessing(null);
      setSelectedImageIndex(null);
    }
  };

  const handleAddImage = async () => {
    if (images.length >= 10) {
      Alert.alert('Limite atingido', 'Você pode adicionar no máximo 10 fotos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para adicionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newUri = result.assets[0].uri;
      const isFirstImage = images.length === 0;
      setImages([...images, newUri]);

      // Analisar com IA apenas na primeira imagem
      if (isFirstImage) {
        analyzeImageWithAI(newUri);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setImages([]);
    setTitle('');
    setDescription('');
    setBrand('');
    setSelectedCategoryId('');
    setSelectedSubcategoryId('');
    setSelectedTypeId('');
    setCondition('');
    setSize('');
    setPrice('');
    setOriginalPrice('');
    setSelectedTags([]);
    setUploadedImageUrls({});
    setSelectedImageIndex(null);
    setShowAiOptions(false);
    setLabelImage(null);
    setVirtualTryOnUrl(null);
    setShowVirtualTryOn(false);
  };

  const handleAddLabelImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao necessaria', 'Precisamos de acesso a galeria para adicionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLabelImage(result.assets[0].uri);
    }
  };

  const handleRemoveLabelImage = () => {
    setLabelImage(null);
  };

  const handlePublish = async () => {
    // Check product limit for free users
    if (hasReachedLimit) {
      setShowLimitModal(true);
      return;
    }

    // Validação - precisa ter categoria e subcategoria pelo menos
    const hasValidCategory = selectedCategoryId && selectedSubcategoryId;
    if (!title || !hasValidCategory || !condition || !price) {
      Alert.alert('Campos obrigatórios', 'Preencha título, categoria, condição e preço');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Adicione fotos', 'Adicione pelo menos uma foto do produto');
      return;
    }

    setLoading(true);
    try {
      // Montar categoria para API (formato: categoria/subcategoria/tipo)
      const categoryPath = selectedTypeId
        ? `${selectedCategoryId}/${selectedSubcategoryId}/${selectedTypeId}`
        : `${selectedCategoryId}/${selectedSubcategoryId}`;

      // Mapear condition para formato da API
      const conditionApiMap: Record<string, string> = {
        'novo_etiqueta': 'novo',
        'seminovo': 'seminovo',
        'bom_estado': 'usado',
        'usado': 'usado',
      };

      // 1. Criar o produto primeiro
      const result = await productsService.createProduct({
        title,
        description,
        brand,
        category: categoryPath,
        condition: conditionApiMap[condition] || 'seminovo',
        size,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : undefined,
        has_label_photo: !!labelImage,
      } as any);

      const productId = result.product.id;

      // 2. Upload das imagens para o Cloudinary
      const isWeb = typeof document !== 'undefined';

      for (let i = 0; i < images.length; i++) {
        const imageUri = images[i];
        const formData = new FormData();

        if (isWeb && imageUri.startsWith('blob:')) {
          // Web: converter blob para File
          const blobResponse = await fetch(imageUri);
          const blob = await blobResponse.blob();
          const file = new File([blob], `photo_${i}.jpg`, { type: blob.type || 'image/jpeg' });
          formData.append('images', file);
        } else {
          // Mobile: usar objeto com uri
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

        await productsService.uploadProductImages(productId, formData);
      }

      // 2.5. Upload da foto da etiqueta (se houver)
      if (labelImage) {
        const labelFormData = new FormData();

        if (isWeb && labelImage.startsWith('blob:')) {
          const blobResponse = await fetch(labelImage);
          const blob = await blobResponse.blob();
          const file = new File([blob], 'label.jpg', { type: blob.type || 'image/jpeg' });
          labelFormData.append('images', file);
          labelFormData.append('is_label', 'true');
        } else {
          const filename = labelImage.split('/').pop() || 'label.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          // @ts-ignore
          labelFormData.append('images', {
            uri: labelImage,
            name: filename,
            type,
          });
          labelFormData.append('is_label', 'true');
        }

        await productsService.uploadProductImages(productId, labelFormData);
      }

      // 3. Salvar tags selecionadas
      if (selectedTags.length > 0) {
        await tagsService.setProductTags(productId, selectedTags);
      }

      // 4. Zerar o formulário
      resetForm();

      Alert.alert(
        'Sucesso!',
        'Seu produto foi publicado com sucesso!',
        [
          { text: 'Ver na Home', onPress: () => navigation.navigate('Home') },
          {
            text: 'Adicionar a um Look',
            onPress: () => navigation.navigate('CreateLook', { productId }),
            style: 'default',
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error('Erro ao publicar:', error);
      Alert.alert('Erro', error?.response?.data?.message || 'Não foi possível publicar o produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIcon}>
            <Ionicons name="camera-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Largue suas peças</Text>
          <Text style={styles.guestSubtitle}>
            Faça login para começar a vender e ganhar dinheiro com peças que não usa mais
          </Text>
          <Pressable style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>Entrar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
              <Text style={styles.headerTitle}>Largar</Text>
              <Text style={styles.headerSubtitle}>Cadastre seu produto</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Remaining Slots Warning for Free Users */}
          {!isPremiumUser && userProductCount > 0 && (
            <Pressable style={styles.slotsWarning} onPress={() => navigation.navigate('Premium')}>
              <Ionicons name="alert-circle" size={20} color="#F59E0B" />
              <Text style={styles.slotsWarningText}>
                {hasReachedLimit
                  ? `Você atingiu o limite de ${FREE_USER_PRODUCT_LIMIT} anúncios`
                  : `Restam ${remainingSlots} de ${FREE_USER_PRODUCT_LIMIT} anúncios grátis`}
              </Text>
              <Text style={styles.slotsWarningLink}>Premium</Text>
            </Pressable>
          )}
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fotos *</Text>
          <Text style={styles.sectionHint}>
            {isPremiumUser
              ? 'Adicione até 10 fotos. Toque na foto para editar com IA.'
              : 'Adicione até 10 fotos. A primeira será a capa.'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            <Pressable style={styles.addPhotoBtn} onPress={handleAddImage}>
              <Ionicons name="camera" size={28} color={colors.primary} />
              <Text style={styles.addPhotoText}>Adicionar</Text>
            </Pressable>
            {images.map((img, index) => (
              <Pressable
                key={index}
                style={styles.photoItem}
                onPress={() => handleImagePress(index)}
                disabled={aiProcessing !== null}
              >
                <Image source={{ uri: img }} style={styles.photoImg} contentFit="cover" />
                <Pressable style={styles.removePhotoBtn} onPress={() => handleRemoveImage(index)}>
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>
                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <Text style={styles.coverBadgeText}>Capa</Text>
                  </View>
                )}
                {isPremiumUser && !aiProcessing && (
                  <View style={styles.aiEditBadge}>
                    <Ionicons name="sparkles" size={12} color="#fff" />
                  </View>
                )}
                {aiProcessing?.index === index && (
                  <View style={styles.photoProcessing}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Label Photo */}
        <View style={styles.section}>
          <View style={styles.labelHeader}>
            <Text style={styles.sectionTitle}>Foto da etiqueta (opcional)</Text>
            {labelImage && (
              <View style={styles.labelVerifiedBadge}>
                <Text style={styles.labelVerifiedText}>Etiqueta verificada</Text>
              </View>
            )}
          </View>
          <Text style={styles.sectionHint}>
            Fotos da etiqueta aumentam a confianca dos compradores!
          </Text>
          <View style={styles.labelPhotoWrap}>
            {labelImage ? (
              <View style={styles.labelPhotoItem}>
                <Image source={{ uri: labelImage }} style={styles.labelPhotoImg} contentFit="cover" />
                <Pressable style={styles.removeLabelPhotoBtn} onPress={handleRemoveLabelImage}>
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>
                <View style={styles.labelBadge}>
                  <Ionicons name="pricetag" size={12} color="#fff" />
                  <Text style={styles.labelBadgeText}>Etiqueta</Text>
                </View>
              </View>
            ) : (
              <Pressable style={styles.addLabelPhotoBtn} onPress={handleAddLabelImage}>
                <Ionicons name="pricetag-outline" size={28} color={colors.success} />
                <Text style={styles.addLabelPhotoText}>Adicionar etiqueta</Text>
              </Pressable>
            )}
          </View>
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

        {/* Category - Main Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoria *</Text>
          <View style={styles.optionsGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.optionCard,
                  selectedCategoryId === cat.id && styles.optionCardActive,
                  selectedCategoryId === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
                ]}
                onPress={() => {
                  setSelectedCategoryId(cat.id);
                  setSelectedSubcategoryId('');
                  setSelectedTypeId('');
                  setSize(''); // Reset size when category changes
                }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={24}
                  color={selectedCategoryId === cat.id ? '#fff' : cat.color}
                />
                <Text style={[styles.optionText, selectedCategoryId === cat.id && styles.optionTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Subcategories */}
        {selectedCategoryId && subcategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subcategoria *</Text>
            <View style={styles.subcategoriesGrid}>
              {subcategories.map((sub) => (
                <Pressable
                  key={sub.id}
                  style={[styles.subcategoryChip, selectedSubcategoryId === sub.id && styles.subcategoryChipActive]}
                  onPress={() => {
                    setSelectedSubcategoryId(sub.id);
                    setSelectedTypeId('');
                    setSize(''); // Reset size when subcategory changes
                  }}
                >
                  <Text style={[styles.subcategoryText, selectedSubcategoryId === sub.id && styles.subcategoryTextActive]}>
                    {sub.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Types - Only show if subcategory has types */}
        {selectedSubcategoryId && types.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo</Text>
            <View style={styles.subcategoriesGrid}>
              {types.map((type) => (
                <Pressable
                  key={type.id}
                  style={[styles.subcategoryChip, selectedTypeId === type.id && styles.subcategoryChipActive]}
                  onPress={() => setSelectedTypeId(type.id)}
                >
                  <Text style={[styles.subcategoryText, selectedTypeId === type.id && styles.subcategoryTextActive]}>
                    {type.name}
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
                <Text style={styles.conditionEmoji}>{cond.emoji}</Text>
                <View style={styles.conditionContent}>
                  <Text style={[styles.conditionName, condition === cond.id && styles.conditionNameActive]}>
                    {cond.name}
                  </Text>
                  <Text style={styles.conditionDesc}>{cond.description}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Size - Only show if subcategory is selected and has sizes */}
        {selectedSubcategoryId && availableSizes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tamanho</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.sizesRow}>
                {availableSizes.map((s) => (
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
        )}

        {/* Tags */}
        {Object.keys(availableTags).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <Text style={styles.sectionHint}>Selecione características especiais do produto</Text>

            {/* Ano */}
            {availableTags.ano && availableTags.ano.length > 0 && (
              <View style={styles.tagGroup}>
                <Text style={styles.tagGroupTitle}>Ano</Text>
                <View style={styles.tagsRow}>
                  {availableTags.ano.map((tag) => (
                    <Pressable
                      key={tag.id}
                      style={[styles.tagChip, selectedTags.includes(tag.id) && styles.tagChipActive]}
                      onPress={() => toggleTag(tag.id)}
                    >
                      <Text style={[styles.tagText, selectedTags.includes(tag.id) && styles.tagTextActive]}>
                        {tag.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Estilo */}
            {availableTags.estilo && availableTags.estilo.length > 0 && (
              <View style={styles.tagGroup}>
                <Text style={styles.tagGroupTitle}>Estilo</Text>
                <View style={styles.tagsRow}>
                  {availableTags.estilo.map((tag) => (
                    <Pressable
                      key={tag.id}
                      style={[styles.tagChip, selectedTags.includes(tag.id) && styles.tagChipActive]}
                      onPress={() => toggleTag(tag.id)}
                    >
                      <Text style={[styles.tagText, selectedTags.includes(tag.id) && styles.tagTextActive]}>
                        {tag.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Coleção */}
            {availableTags.colecao && availableTags.colecao.length > 0 && (
              <View style={styles.tagGroup}>
                <Text style={styles.tagGroupTitle}>Coleção</Text>
                <View style={styles.tagsRow}>
                  {availableTags.colecao.map((tag) => (
                    <Pressable
                      key={tag.id}
                      style={[styles.tagChip, selectedTags.includes(tag.id) && styles.tagChipActive]}
                      onPress={() => toggleTag(tag.id)}
                    >
                      <Text style={[styles.tagText, selectedTags.includes(tag.id) && styles.tagTextActive]}>
                        {tag.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Especial */}
            {availableTags.especial && availableTags.especial.length > 0 && (
              <View style={styles.tagGroup}>
                <Text style={styles.tagGroupTitle}>Características</Text>
                <View style={styles.tagsRow}>
                  {availableTags.especial.map((tag) => (
                    <Pressable
                      key={tag.id}
                      style={[styles.tagChip, selectedTags.includes(tag.id) && styles.tagChipActive]}
                      onPress={() => toggleTag(tag.id)}
                    >
                      <Text style={[styles.tagText, selectedTags.includes(tag.id) && styles.tagTextActive]}>
                        {tag.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

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

        {/* Publish Button */}
        <Pressable onPress={handlePublish} disabled={loading}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.publishBtn}
          >
            <Ionicons name="rocket-outline" size={20} color="#fff" />
            <Text style={styles.publishBtnText}>
              {loading ? 'Largando...' : 'Largar!'}
            </Text>
          </LinearGradient>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* AI Analysis Modal */}
      <Modal visible={aiAnalyzing} transparent animationType="fade">
        <View style={styles.aiOverlay}>
          <View style={styles.aiCard}>
            <View style={styles.aiIconWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={styles.aiTitle}>Analisando imagem...</Text>
            <Text style={styles.aiSubtitle}>
              Nossa IA está identificando o produto e preenchendo os campos automaticamente
            </Text>
          </View>
        </View>
      </Modal>

      {/* AI Image Options Modal */}
      <Modal visible={showAiOptions} transparent animationType="slide">
        <Pressable style={styles.aiOptionsOverlay} onPress={() => setShowAiOptions(false)}>
          <View style={styles.aiOptionsCard}>
            <View style={styles.aiOptionsHandle} />
            <Text style={styles.aiOptionsTitle}>Editar com IA</Text>
            <Text style={styles.aiOptionsSubtitle}>Escolha uma opcao para melhorar sua foto</Text>

            <Pressable style={styles.aiOptionBtn} onPress={handleShowBackgroundOptions}>
              <View style={[styles.aiOptionIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="image-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.aiOptionInfo}>
                <Text style={styles.aiOptionName}>Trocar Fundo</Text>
                <Text style={styles.aiOptionDesc}>Substitui o fundo por um fundo profissional</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A3A3A3" />
            </Pressable>

            <Pressable style={styles.aiOptionBtn} onPress={handleEnhanceImage}>
              <View style={[styles.aiOptionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="sparkles" size={24} color="#F59E0B" />
              </View>
              <View style={styles.aiOptionInfo}>
                <Text style={styles.aiOptionName}>Melhorar Qualidade</Text>
                <Text style={styles.aiOptionDesc}>Ajusta brilho, contraste e nitidez</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A3A3A3" />
            </Pressable>

            <Pressable style={styles.aiOptionCancelBtn} onPress={() => setShowAiOptions(false)}>
              <Text style={styles.aiOptionCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Background Options Modal */}
      <Modal visible={showBackgroundOptions} transparent animationType="slide">
        <Pressable style={styles.aiOptionsOverlay} onPress={() => setShowBackgroundOptions(false)}>
          <View style={styles.aiOptionsCard}>
            <View style={styles.aiOptionsHandle} />
            <Text style={styles.aiOptionsTitle}>Escolha o Fundo</Text>
            <Text style={styles.aiOptionsSubtitle}>Selecione um fundo profissional para sua foto</Text>

            {BACKGROUND_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={styles.aiOptionBtn}
                onPress={() => handleReplaceBackground(option.id)}
              >
                <LinearGradient
                  colors={option.previewColors as [string, string]}
                  style={styles.bgOptionPreview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.aiOptionInfo}>
                  <Text style={styles.aiOptionName}>{option.name}</Text>
                  <Text style={styles.aiOptionDesc}>{option.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#A3A3A3" />
              </Pressable>
            ))}

            <Pressable style={styles.aiOptionCancelBtn} onPress={() => setShowBackgroundOptions(false)}>
              <Text style={styles.aiOptionCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* AI Processing Modal */}
      <Modal visible={aiProcessing !== null} transparent animationType="fade">
        <View style={styles.aiOverlay}>
          <View style={styles.aiCard}>
            <View style={styles.aiIconWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={styles.aiTitle}>
              {aiProcessing?.type === 'background' ? 'Removendo fundo...' : 'Melhorando imagem...'}
            </Text>
            <Text style={styles.aiSubtitle}>
              Aguarde enquanto a IA processa sua foto
            </Text>
          </View>
        </View>
      </Modal>

      {/* Virtual Try-On Modal */}
      <Modal visible={showVirtualTryOn} transparent animationType="fade">
        <View style={styles.aiOverlay}>
          <View style={styles.virtualTryOnCard}>
            <View style={styles.virtualTryOnHeader}>
              <Text style={styles.virtualTryOnTitle}>Prova Virtual</Text>
              <Pressable
                style={styles.virtualTryOnClose}
                onPress={() => {
                  setVirtualTryOnUrl(null);
                  setShowVirtualTryOn(false);
                }}
              >
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </Pressable>
            </View>
            <Text style={styles.virtualTryOnSubtitle}>
              Veja como sua peça fica em um modelo
            </Text>
            {virtualTryOnUrl && (
              <Image
                source={{ uri: virtualTryOnUrl }}
                style={styles.virtualTryOnImage}
                contentFit="contain"
              />
            )}
            <View style={styles.virtualTryOnActions}>
              <Pressable
                style={styles.virtualTryOnDiscardBtn}
                onPress={() => {
                  setVirtualTryOnUrl(null);
                  setShowVirtualTryOn(false);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.virtualTryOnDiscardText}>Descartar</Text>
              </Pressable>
              <Pressable
                style={styles.virtualTryOnUseBtn}
                onPress={() => {
                  // Adicionar imagem do try-on como segunda foto do produto
                  if (virtualTryOnUrl) {
                    setImages(prev => [...prev, virtualTryOnUrl]);
                  }
                  setShowVirtualTryOn(false);
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.virtualTryOnUseText}>Usar como foto</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Product Limit Modal */}
      <Modal visible={showLimitModal} transparent animationType="fade">
        <View style={styles.aiOverlay}>
          <View style={styles.limitCard}>
            <View style={styles.limitIconWrap}>
              <Ionicons name="alert-circle" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.limitTitle}>Limite atingido</Text>
            <Text style={styles.limitSubtitle}>
              Você atingiu o limite de {FREE_USER_PRODUCT_LIMIT} anúncios do plano gratuito.
            </Text>
            <Text style={styles.limitText}>
              Assine o Premium para anúncios ilimitados, IA para fotos e taxa reduzida de apenas 10%!
            </Text>

            <Pressable onPress={() => { setShowLimitModal(false); navigation.navigate('Premium'); }}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.limitPremiumBtn}>
                <Ionicons name="star" size={20} color="#fff" />
                <Text style={styles.limitPremiumBtnText}>Assinar Premium</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.limitCancelBtn} onPress={() => setShowLimitModal(false)}>
              <Text style={styles.limitCancelText}>Agora não</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 16 },

  // Guest
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  guestIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  guestTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' },
  guestSubtitle: { fontSize: 15, color: '#737373', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  loginBtn: { backgroundColor: colors.primary, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 28 },
  loginBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },

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
  conditionRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D4D4D4', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  conditionRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  conditionEmoji: { fontSize: 20, marginRight: 10 },
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

  // Tags
  tagGroup: { marginTop: 16 },
  tagGroupTitle: { fontSize: 13, fontWeight: '600', color: '#525252', marginBottom: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E8E8' },
  tagChipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  tagText: { fontSize: 13, fontWeight: '500', color: '#737373' },
  tagTextActive: { color: colors.primary, fontWeight: '600' },

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

  // Publish
  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, marginTop: 32 },
  publishBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // AI Modal
  aiOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  aiCard: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', width: '100%', maxWidth: 300 },
  aiIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  aiTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' },
  aiSubtitle: { fontSize: 14, color: '#737373', textAlign: 'center', lineHeight: 20 },

  // AI Edit Badge
  aiEditBadge: { position: 'absolute', bottom: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  photoProcessing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

  // AI Options Modal
  aiOptionsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  aiOptionsCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  aiOptionsHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E8E8E8', alignSelf: 'center', marginBottom: 20 },
  aiOptionsTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  aiOptionsSubtitle: { fontSize: 14, color: '#737373', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  aiOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: '#F5F5F5', borderRadius: 14, marginBottom: 12 },
  aiOptionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  bgOptionPreview: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E8E8E8' },
  aiOptionInfo: { flex: 1 },
  aiOptionName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  aiOptionDesc: { fontSize: 13, color: '#737373', marginTop: 2 },
  aiOptionCancelBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  aiOptionCancelText: { fontSize: 16, fontWeight: '500', color: '#737373' },

  // Limit Modal
  limitCard: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', width: '100%', maxWidth: 320 },
  limitIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  limitTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' },
  limitSubtitle: { fontSize: 15, color: '#525252', textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  limitText: { fontSize: 14, color: '#737373', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  limitPremiumBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28 },
  limitPremiumBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  limitCancelBtn: { paddingVertical: 12, marginTop: 8 },
  limitCancelText: { fontSize: 15, color: '#737373' },

  // Remaining Slots Banner
  slotsWarning: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, marginTop: 16 },
  slotsWarningText: { flex: 1, fontSize: 13, color: '#92400E' },
  slotsWarningLink: { fontSize: 13, fontWeight: '600', color: '#F59E0B' },

  // Label Photo
  labelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  labelVerifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  labelVerifiedText: { fontSize: 12, fontWeight: '600', color: '#5B8C5A' },
  labelPhotoWrap: { flexDirection: 'row' },
  addLabelPhotoBtn: { width: 100, height: 100, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#5B8C5A', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5E8' },
  addLabelPhotoText: { fontSize: 10, fontWeight: '500', color: '#5B8C5A', marginTop: 4, textAlign: 'center' },
  labelPhotoItem: { width: 100, height: 100, borderRadius: 12, position: 'relative' },
  labelPhotoImg: { width: '100%', height: '100%', borderRadius: 12 },
  removeLabelPhotoBtn: { position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  labelBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: '#5B8C5A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  labelBadgeText: { fontSize: 10, fontWeight: '600', color: '#fff' },

  // Virtual Try-On Modal
  virtualTryOnCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', width: '90%', maxWidth: 360 },
  virtualTryOnHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  virtualTryOnTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  virtualTryOnClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  virtualTryOnSubtitle: { fontSize: 14, color: '#737373', textAlign: 'center', marginBottom: 16 },
  virtualTryOnImage: { width: '100%', height: 400, borderRadius: 16, marginBottom: 16 },
  virtualTryOnActions: { flexDirection: 'row', gap: 12, width: '100%' },
  virtualTryOnDiscardBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 28 },
  virtualTryOnDiscardText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  virtualTryOnUseBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 28 },
  virtualTryOnUseText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

export default SellScreen;
