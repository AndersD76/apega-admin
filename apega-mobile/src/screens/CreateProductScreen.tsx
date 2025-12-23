import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 768;
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, CATEGORIES, FEES } from '../constants/theme';
import { Input, Button, Pill, Modal } from '../components';
import { createProduct, uploadSingleImage } from '../services/products';
import { analyzeClothing, checkAIAccess, AIAnalysisResult, AIAccessStatus } from '../services/ai';

interface CreateProductScreenProps {
  navigation: any;
}

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'Unico'];
const CONDITIONS = ['novo', 'seminovo', 'usado'];
const COLORS_PICKER = ['Branco', 'Preto', 'Vermelho', 'Laranja', 'Amarelo', 'Verde', 'Azul', 'Roxo', 'Marrom'];
const BRANDS = ['farm', 'zara', 'forever 21', 'renner', 'c&a', 'riachuelo', 'outras'];

export default function CreateProductScreen({ navigation }: CreateProductScreenProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [condition, setCondition] = useState('');
  const [composition, setComposition] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [acceptOffers, setAcceptOffers] = useState(false);
  const [minOfferPrice, setMinOfferPrice] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // AI States
  const [aiAccess, setAiAccess] = useState<AIAccessStatus | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [showAiResult, setShowAiResult] = useState(false);

  // Check AI access on mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const access = await checkAIAccess();
        setAiAccess(access);
      } catch (error) {
        console.log('Usuário não tem acesso À  IA');
      }
    };
    checkAccess();
  }, []);

  const handleAddPhoto = async () => {
    if (photos.length >= 8) {
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('PermissÀ‡Å“o necessÀ‡Â­ria', 'Permita acesso À‡À¿ galeria para adicionar fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Erro', 'NÀ‡Å“o foi possÀ‡À°vel acessar a galeria.');
    }
  };

  // AI Analysis function
  const handleAIAnalysis = async () => {
    if (photos.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos uma foto para análise');
      return;
    }

    setIsAnalyzing(true);
    try {
      const imageUri = photos[0];
      let imageUrl = imageUri;
      if (!imageUri.startsWith('http')) {
        const uploadResult = await uploadSingleImage(imageUri);
        imageUrl = uploadResult.url;
      }
      const result = await analyzeClothing(imageUrl);
      setAiResult(result);
      setShowAiResult(true);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao analisar imagem');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply AI suggestions to form
  const applyAISuggestions = () => {
    if (!aiResult) return;

    // Apply title/type
    if (aiResult.tipo && !title) {
      setTitle(aiResult.tipo);
    }

    // Apply description
    if (aiResult.descricaoSugerida && !description) {
      setDescription(aiResult.descricaoSugerida);
    }

    // Apply brand
    if (aiResult.marca && !brand) {
      const marcaLower = aiResult.marca.toLowerCase();
      if (BRANDS.includes(marcaLower)) {
        setBrand(marcaLower);
      }
    }

    // Apply size
    if (aiResult.tamanho && !selectedSize) {
      const tamanhoUpper = aiResult.tamanho.toUpperCase();
      if (SIZES.includes(tamanhoUpper)) {
        setSelectedSize(tamanhoUpper);
      }
    }

    // Apply condition
    if (aiResult.condicao && !condition) {
      const condicaoLower = aiResult.condicao.toLowerCase();
      if (CONDITIONS.includes(condicaoLower)) {
        setCondition(condicaoLower);
      }
    }

    // Apply suggested price
    if (aiResult.precoSugerido?.recomendado && !price) {
      setPrice(aiResult.precoSugerido.recomendado.toString());
    }

    // Apply materials to composition
    if (aiResult.materiais?.length > 0 && !composition) {
      setComposition(aiResult.materiais.join(', '));
    }

    setShowAiResult(false);
    Alert.alert('Sucesso', 'Sugestões aplicadas! Revise e ajuste se necessário.');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleColorToggle = (color: string) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter((c) => c !== color));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const handlePublish = async () => {
    // Validations
    if (!title || title.length < 10) {
      Alert.alert('Erro', 'Título deve ter no mínimo 10 caracteres');
      return;
    }
    if (!description || description.length < 20) {
      Alert.alert('Erro', 'Descrição deve ter no mínimo 20 caracteres');
      return;
    }
    if (!category) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }
    if (!selectedSize) {
      Alert.alert('Erro', 'Selecione um tamanho');
      return;
    }
    if (!condition) {
      Alert.alert('Erro', 'Selecione a condição do produto');
      return;
    }
    if (!price || parseFloat(price) < 5) {
      Alert.alert('Erro', 'Preço deve ser maior que R$ 5,00');
      return;
    }

    setIsLoading(true);
    try {
      await createProduct({
        title,
        description,
        brand: brand || undefined,
        size: selectedSize,
        color: selectedColors.join(', ') || undefined,
        condition: condition as 'novo' | 'seminovo' | 'usado',
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : undefined,
        category: category || undefined,
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao criar produto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const discountPercentage = originalPrice && price
    ? Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>anunciar produto</Text>
        <TouchableOpacity onPress={handlePublish}>
          <Ionicons name="checkmark" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Photos Upload */}
        <Text style={styles.label}>
          fotos do produto <Text style={styles.required}>*</Text>
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
        >
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoNumber}>{index + 1}</Text>
                <Ionicons name="image" size={32} color={COLORS.textTertiary} />
              </View>
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() => handleRemovePhoto(index)}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 8 && (
            <TouchableOpacity style={styles.photoAdd} onPress={handleAddPhoto}>
              <Ionicons name="add" size={32} color={COLORS.textTertiary} />
              <Ionicons name="camera" size={24} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </ScrollView>

        <Text style={styles.photoHint}>←“ arraste para ordenar</Text>

        {/* AI Analysis Button */}
        {aiAccess?.hasAccess && photos.length > 0 && (
          <TouchableOpacity
            style={styles.aiButton}
            onPress={handleAIAnalysis}
            disabled={isAnalyzing}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiButtonGradient}
            >
              {isAnalyzing ? (
                <>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.aiButtonText}>Analisando com IA...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#FFF" />
                  <Text style={styles.aiButtonText}>Analisar com IA</Text>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>
                      {aiAccess.isPremium ? 'Premium' : 'Grátis'}
                    </Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* AI Access Promo (for users without access) */}
        {!aiAccess?.hasAccess && photos.length > 0 && (
          <TouchableOpacity style={styles.aiPromoButton}>
            <View style={styles.aiPromoContent}>
              <Ionicons name="sparkles" size={20} color={COLORS.primary} />
              <View style={styles.aiPromoTextContainer}>
                <Text style={styles.aiPromoTitle}>IA Premium</Text>
                <Text style={styles.aiPromoSubtitle}>
                  Análise automática, sugestão de preço e mais
                </Text>
              </View>
              <Ionicons name="lock-closed" size={16} color={COLORS.textTertiary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Tip Banner */}
        <View style={styles.tipBanner}>
          <Text style={styles.tipIcon}>ðŸ’¡</Text>
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>dica:</Text> use fotos com boa luz e mostre detalhes do produto
          </Text>
        </View>

        {renderDivider()}

        {/* Informações Básicas */}
        <Text style={styles.sectionTitle}>informações básicas</Text>

        <Input
          label="título"
          required
          value={title}
          onChangeText={setTitle}
          placeholder="Vestido floral midi"
          maxLength={60}
          showCharCounter
        />

        <Input
          type="textarea"
          label="descrição"
          required
          value={description}
          onChangeText={setDescription}
          placeholder="Vestido midi floral lindo, super fresquinho..."
          maxLength={500}
          showCharCounter
        />

        <View style={styles.tipBanner}>
          <Text style={styles.tipIcon}>ðŸ’¡</Text>
          <Text style={styles.tipText}>
            seja detalhista! quanto mais informações, mais confiança
          </Text>
        </View>

        <Text style={styles.label}>
          categoria <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.dropdown}>
          <RNTextInput
            style={styles.dropdownText}
            value={category}
            placeholder="Selecione a categoria"
            editable={false}
          />
          <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
        </View>

        <Text style={styles.label}>marca</Text>
        <View style={styles.dropdown}>
          <RNTextInput
            style={styles.dropdownText}
            value={brand}
            placeholder="Selecione a marca"
            editable={false}
          />
          <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
        </View>

        <Text style={styles.label}>
          tamanho <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.pillsContainer}>
          {SIZES.map((size) => (
            <Pill
              key={size}
              label={size}
              active={selectedSize === size}
              onPress={() => setSelectedSize(size)}
              style={styles.pillItem}
            />
          ))}
        </View>

        <Text style={styles.label}>cor</Text>
        <View style={styles.colorsContainer}>
          {COLORS_PICKER.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorItem,
                selectedColors.includes(color) && styles.colorItemActive,
              ]}
              onPress={() => handleColorToggle(color)}
            >
              <Text style={styles.colorEmoji}>{color}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>
          condição <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.pillsContainer}>
          {CONDITIONS.map((cond) => (
            <Pill
              key={cond}
              label={cond}
              active={condition === cond}
              onPress={() => setCondition(cond)}
              style={styles.pillItem}
            />
          ))}
        </View>

        <Input
          label="composição"
          value={composition}
          onChangeText={setComposition}
          placeholder="algodão"
        />

        {renderDivider()}

        {/* Preço e Negociação */}
        <Text style={styles.sectionTitle}>preço e negociação</Text>

        <Input
          label="preço de venda"
          required
          value={price}
          onChangeText={setPrice}
          placeholder="R$"
          keyboardType="numeric"
        />

        <Input
          label="preço original (opcional)"
          value={originalPrice}
          onChangeText={setOriginalPrice}
          placeholder="R$"
          keyboardType="numeric"
        />

        {/* Commission Calculator */}
        {price && parseFloat(price) > 0 && (
          <View style={styles.earningsCard}>
            <Text style={styles.earningsTitle}>
              <Ionicons name="calculator" size={16} color={COLORS.textPrimary} /> seu ganho estimado
            </Text>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Preço de venda</Text>
              <Text style={styles.earningsValue}>R$ {parseFloat(price).toFixed(2)}</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Comissão ({FEES.commissionPercentage}%)</Text>
              <Text style={styles.earningsCommission}>- R$ {(parseFloat(price) * FEES.commissionRate).toFixed(2)}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsRow}>
              <Text style={styles.earningsTotalLabel}>Você recebe</Text>
              <Text style={styles.earningsTotalValue}>R$ {(parseFloat(price) * (1 - FEES.commissionRate)).toFixed(2)}</Text>
            </View>
            <Text style={styles.earningsNote}>
              Assinantes Premium não pagam comissão
            </Text>
          </View>
        )}

        {originalPrice && price && discountPercentage > 0 && (
          <View style={styles.tipBanner}>
            <Text style={styles.tipIcon}>ðŸ’¡</Text>
            <Text style={styles.tipText}>
              mostre o desconto de {discountPercentage}% que está oferecendo
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setAcceptOffers(!acceptOffers)}
        >
          <Ionicons
            name={acceptOffers ? 'checkbox' : 'square-outline'}
            size={24}
            color={acceptOffers ? COLORS.primary : COLORS.gray[400]}
          />
          <Text style={styles.checkboxLabel}>aceito ofertas</Text>
        </TouchableOpacity>

        {acceptOffers && (
          <Input
            label="valor mínimo para ofertas"
            value={minOfferPrice}
            onChangeText={setMinOfferPrice}
            placeholder="R$"
            keyboardType="numeric"
          />
        )}

        {renderDivider()}

        {/* Preview */}
        <Text style={styles.sectionTitle}>prévia do anúncio</Text>
        <Text style={styles.previewLabel}>veja como ficará:</Text>

        <View style={styles.previewCard}>
          <View style={styles.previewImage}>
            {photos.length > 0 ? (
              <Text style={styles.previewImageText}>[IMAGEM]</Text>
            ) : (
              <Ionicons name="image-outline" size={48} color={COLORS.textTertiary} />
            )}
            {discountPercentage > 0 && (
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>{discountPercentage}%</Text>
              </View>
            )}
            <View style={styles.previewHeart}>
              <Ionicons name="heart-outline" size={16} color={COLORS.textPrimary} />
            </View>
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewPrice}>R$ {price || '0,00'}</Text>
            <Text style={styles.previewTitle} numberOfLines={2}>
              {title || 'Título do produto'}
            </Text>
            <Text style={styles.previewMeta}>
              {brand || 'marca'} â€¢ {selectedSize || 'M'} â€¢ {condition || 'usado'}
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Actions */}
      <View style={styles.actions}>
        <Button
          label="cancelar"
          variant="secondary"
          onPress={handleCancel}
          style={styles.actionButton}
        />
        <Button
          label={isLoading ? 'publicando...' : 'publicar'}
          variant="primary"
          onPress={handlePublish}
          disabled={isLoading}
          style={styles.actionButton}
        />
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
        type="center"
        showCloseButton={false}
      >
        <View style={styles.successModal}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          <Text style={styles.successTitle}>produto publicado!</Text>
          <Text style={styles.successText}>
            seu produto está no ar e pronto para receber visitas
          </Text>
          <Button
            label="ver produto"
            variant="primary"
            onPress={() => {
              setShowSuccessModal(false);
              navigation.goBack();
            }}
            fullWidth
            style={{ marginBottom: SPACING.sm }}
          />
          <Button
            label="anunciar outro"
            variant="secondary"
            onPress={() => {
              setShowSuccessModal(false);
              // Reset form
            }}
            fullWidth
          />
        </View>
      </Modal>

      {/* AI Results Modal */}
      <Modal
        visible={showAiResult}
        onClose={() => setShowAiResult(false)}
        type="center"
      >
        <View style={styles.aiResultModal}>
          <View style={styles.aiResultHeader}>
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              style={styles.aiResultIcon}
            >
              <Ionicons name="sparkles" size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.aiResultTitle}>Análise da IA</Text>
            <Text style={styles.aiResultSubtitle}>powered by Claude</Text>
          </View>

          {aiResult && (
            <ScrollView style={styles.aiResultContent}>
              {/* Product Type */}
              <View style={styles.aiResultItem}>
                <Text style={styles.aiResultLabel}>Tipo de Peça</Text>
                <Text style={styles.aiResultValue}>{aiResult.tipo}</Text>
              </View>

              {/* Brand */}
              {aiResult.marca && (
                <View style={styles.aiResultItem}>
                  <Text style={styles.aiResultLabel}>Marca Identificada</Text>
                  <Text style={styles.aiResultValue}>{aiResult.marca}</Text>
                </View>
              )}

              {/* Condition */}
              <View style={styles.aiResultItem}>
                <Text style={styles.aiResultLabel}>Condição</Text>
                <Text style={styles.aiResultValue}>{aiResult.condicao}</Text>
              </View>

              {/* Size */}
              {aiResult.tamanho && (
                <View style={styles.aiResultItem}>
                  <Text style={styles.aiResultLabel}>Tamanho</Text>
                  <Text style={styles.aiResultValue}>{aiResult.tamanho}</Text>
                </View>
              )}

              {/* Materials */}
              {aiResult.materiais?.length > 0 && (
                <View style={styles.aiResultItem}>
                  <Text style={styles.aiResultLabel}>Materiais</Text>
                  <Text style={styles.aiResultValue}>
                    {aiResult.materiais.join(', ')}
                  </Text>
                </View>
              )}

              {/* Colors */}
              {aiResult.cores?.length > 0 && (
                <View style={styles.aiResultItem}>
                  <Text style={styles.aiResultLabel}>Cores</Text>
                  <Text style={styles.aiResultValue}>
                    {aiResult.cores.join(', ')}
                  </Text>
                </View>
              )}

              {/* Suggested Price */}
              <View style={styles.aiPriceCard}>
                <Text style={styles.aiPriceLabel}>Preço Sugerido</Text>
                <Text style={styles.aiPriceValue}>
                  R$ {aiResult.precoSugerido?.recomendado?.toFixed(2) || '0,00'}
                </Text>
                <Text style={styles.aiPriceRange}>
                  Faixa: R$ {aiResult.precoSugerido?.minimo?.toFixed(2) || '0'} -{' '}
                  R$ {aiResult.precoSugerido?.maximo?.toFixed(2) || '0'}
                </Text>
              </View>

              {/* Suggested Description */}
              {aiResult.descricaoSugerida && (
                <View style={styles.aiDescriptionCard}>
                  <Text style={styles.aiDescriptionLabel}>Descrição Sugerida</Text>
                  <Text style={styles.aiDescriptionText}>
                    {aiResult.descricaoSugerida}
                  </Text>
                </View>
              )}

              {/* Keywords */}
              {aiResult.palavrasChave?.length > 0 && (
                <View style={styles.aiResultItem}>
                  <Text style={styles.aiResultLabel}>Palavras-chave</Text>
                  <View style={styles.aiKeywordsContainer}>
                    {aiResult.palavrasChave.map((keyword, index) => (
                      <View key={index} style={styles.aiKeyword}>
                        <Text style={styles.aiKeywordText}>{keyword}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          <View style={styles.aiResultActions}>
            <Button
              label="Aplicar Sugestões"
              variant="primary"
              onPress={applyAISuggestions}
              fullWidth
              style={{ marginBottom: SPACING.sm }}
            />
            <Button
              label="Fechar"
              variant="secondary"
              onPress={() => setShowAiResult(false)}
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const renderDivider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isDesktop ? 60 : SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  content: {
    paddingHorizontal: isDesktop ? 60 : SPACING.md,
    paddingTop: SPACING.lg,
    maxWidth: isDesktop ? 700 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  photosScroll: {
    marginBottom: SPACING.sm,
  },
  photoItem: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoNumber: {
    position: 'absolute',
    top: 4,
    left: 4,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    backgroundColor: COLORS.textPrimary,
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  photoRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
  },
  photoAdd: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginBottom: SPACING.md,
  },
  tipBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  tipText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    marginBottom: SPACING.md,
  },
  dropdownText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  pillItem: {
    marginBottom: 0,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorItemActive: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    ...SHADOWS.sm,
  },
  colorEmoji: {
    fontSize: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  checkboxLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  earningsCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.xs,
  },
  earningsTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  earningsLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  earningsValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
  },
  earningsCommission: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  earningsDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  earningsTotalLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  earningsTotalValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.success,
  },
  earningsNote: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  previewLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 0.8,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImageText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textTertiary,
  },
  previewBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.full,
  },
  previewBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#92400E',
  },
  previewHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    padding: SPACING.sm,
  },
  previewPrice: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: 2,
  },
  previewTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    marginBottom: 2,
    lineHeight: 18,
  },
  previewMeta: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingHorizontal: isDesktop ? 60 : SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionButton: {
    flex: 1,
  },
  successModal: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  successText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    maxWidth: 280,
  },
  // AI Styles
  aiButton: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  aiButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  aiButtonText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  aiBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  aiBadgeText: {
    color: '#FFF',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  aiPromoButton: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    borderStyle: 'dashed',
  },
  aiPromoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  aiPromoTextContainer: {
    flex: 1,
  },
  aiPromoTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  aiPromoSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  // AI Results Modal Styles
  aiResultModal: {
    maxHeight: '80%',
  },
  aiResultHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  aiResultIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  aiResultTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  aiResultSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  aiResultContent: {
    maxHeight: 400,
  },
  aiResultItem: {
    marginBottom: SPACING.md,
  },
  aiResultLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiResultValue: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  aiPriceCard: {
    backgroundColor: '#F0FDF4',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  aiPriceLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  aiPriceValue: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#16A34A',
  },
  aiPriceRange: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  aiDescriptionCard: {
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  aiDescriptionLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  aiDescriptionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  aiKeywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: 4,
  },
  aiKeyword: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  aiKeywordText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
  },
  aiResultActions: {
    marginTop: SPACING.lg,
  },
});

