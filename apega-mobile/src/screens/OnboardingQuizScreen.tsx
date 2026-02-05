import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontFamily, radius, shadows } from '../theme';
import {
  STYLE_OPTIONS,
  POPULAR_BRANDS,
  SIZE_OPTIONS_CLOTHES,
  SIZE_OPTIONS_SHOES,
} from '../constants/onboarding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface QuizData {
  clothesSizes: string[];
  shoeSizes: string[];
  styles: string[];
  brands: string[];
}

export function OnboardingQuizScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [quizData, setQuizData] = useState<QuizData>({
    clothesSizes: [],
    shoeSizes: [],
    styles: [],
    brands: [],
  });
  const [brandSearch, setBrandSearch] = useState('');

  // Animacao
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const totalSteps = 4;

  const animateTransition = (nextStep: number) => {
    // Fade out e slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: nextStep > step ? -50 : 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(nextStep > step ? 50 : -50);

      // Fade in e slide back
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (step < totalSteps) {
      animateTransition(step + 1);
    } else {
      // Concluir e ir para Home
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      animateTransition(step - 1);
    }
  };

  const toggleClothesSize = (size: string) => {
    setQuizData(prev => ({
      ...prev,
      clothesSizes: prev.clothesSizes.includes(size)
        ? prev.clothesSizes.filter(s => s !== size)
        : [...prev.clothesSizes, size],
    }));
  };

  const toggleShoeSize = (size: string) => {
    setQuizData(prev => ({
      ...prev,
      shoeSizes: prev.shoeSizes.includes(size)
        ? prev.shoeSizes.filter(s => s !== size)
        : [...prev.shoeSizes, size],
    }));
  };

  const toggleStyle = (styleId: string) => {
    setQuizData(prev => ({
      ...prev,
      styles: prev.styles.includes(styleId)
        ? prev.styles.filter(s => s !== styleId)
        : [...prev.styles, styleId],
    }));
  };

  const toggleBrand = (brandId: string) => {
    setQuizData(prev => ({
      ...prev,
      brands: prev.brands.includes(brandId)
        ? prev.brands.filter(b => b !== brandId)
        : [...prev.brands, brandId],
    }));
  };

  const filteredBrands = POPULAR_BRANDS.filter(brand =>
    brand.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // Progress bar
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: `${(step / totalSteps) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{step} de {totalSteps}</Text>
    </View>
  );

  // Chip component
  const renderChip = (
    label: string,
    isSelected: boolean,
    onPress: () => void,
    small?: boolean
  ) => (
    <Pressable
      style={[
        styles.chip,
        isSelected && styles.chipSelected,
        small && styles.chipSmall,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipText,
          isSelected && styles.chipTextSelected,
          small && styles.chipTextSmall,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  // Style card component
  const renderStyleCard = (style: { id: string; name: string; icon: string }) => {
    const isSelected = quizData.styles.includes(style.id);
    return (
      <Pressable
        key={style.id}
        style={[styles.styleCard, isSelected && styles.styleCardSelected]}
        onPress={() => toggleStyle(style.id)}
      >
        <View style={[styles.styleIconContainer, isSelected && styles.styleIconContainerSelected]}>
          <Ionicons
            name={style.icon as any}
            size={28}
            color={isSelected ? colors.primary : colors.textSecondary}
          />
        </View>
        <Text style={[styles.styleCardLabel, isSelected && styles.styleCardLabelSelected]}>
          {style.name}
        </Text>
        {isSelected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </Pressable>
    );
  };

  // Step 1: Tamanhos
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Vamos personalizar seu Largo!</Text>
      <Text style={styles.subtitle}>Quais tamanhos voce usa?</Text>

      {/* Tamanhos de roupas */}
      <View style={styles.sizeSection}>
        <Text style={styles.sectionLabel}>Roupas</Text>
        <View style={styles.chipsContainer}>
          {SIZE_OPTIONS_CLOTHES.map(size => (
            <View key={size}>
              {renderChip(
                size,
                quizData.clothesSizes.includes(size),
                () => toggleClothesSize(size)
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Tamanhos de calcados */}
      <View style={styles.sizeSection}>
        <Text style={styles.sectionLabel}>Calcados</Text>
        <View style={styles.chipsContainer}>
          {SIZE_OPTIONS_SHOES.map(size => (
            <View key={size}>
              {renderChip(
                size,
                quizData.shoeSizes.includes(size),
                () => toggleShoeSize(size),
                true
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // Step 2: Estilos
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Qual sua vibe?</Text>
      <Text style={styles.subtitle}>Selecione os estilos que combinam com voce</Text>

      <View style={styles.styleGrid}>
        {STYLE_OPTIONS.map(style => renderStyleCard(style))}
      </View>
    </View>
  );

  // Step 3: Marcas
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Marcas que voce ama</Text>
      <Text style={styles.subtitle}>Selecione suas marcas favoritas</Text>

      {/* Campo de busca */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar marca..."
          placeholderTextColor={colors.textMuted}
          value={brandSearch}
          onChangeText={setBrandSearch}
        />
        {brandSearch.length > 0 && (
          <Pressable onPress={() => setBrandSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Chips de marcas */}
      <View style={styles.brandsContainer}>
        <View style={styles.chipsContainer}>
          {filteredBrands.map(brand => (
            <View key={brand.id}>
              {renderChip(
                brand.name,
                quizData.brands.includes(brand.id),
                () => toggleBrand(brand.id)
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // Step 4: Conclusao
  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.conclusionContainer}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={48} color="#fff" />
        </View>
        <Text style={styles.conclusionTitle}>Pronto! Seu feed ta personalizado</Text>
        <Text style={styles.conclusionSubtitle}>
          Agora voce vai ver pecas do seu estilo!
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  const getButtonLabel = () => {
    if (step === totalSteps) {
      return 'Bora garimpar!';
    }
    return 'Proximo';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header com progress */}
      <View style={styles.header}>
        {step > 1 ? (
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        {renderProgressBar()}
        <Pressable
          style={styles.skipButton}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
        >
          <Text style={styles.skipText}>Pular</Text>
        </Pressable>
      </View>

      {/* Content com animacao */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.animatedContent,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {renderCurrentStep()}
        </Animated.View>
      </ScrollView>

      {/* Bottom button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={handleNext}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>{getButtonLabel()}</Text>
            {step < totalSteps && (
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fontFamily.semibold,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  animatedContent: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  sizeSection: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  chipSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipSmall: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
  },
  chipTextSmall: {
    fontSize: 13,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  styleCard: {
    width: (SCREEN_WIDTH - 48 - 12) / 2,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  styleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  styleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  styleIconContainerSelected: {
    backgroundColor: colors.white,
  },
  styleCardLabel: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  styleCardLabelSelected: {
    color: colors.primary,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 15,
    fontFamily: fontFamily.regular,
    color: colors.text,
  },
  brandsContainer: {
    flex: 1,
  },
  conclusionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 24px rgba(91, 140, 90, 0.4)' }
      : {
          shadowColor: colors.success,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 12,
        }
    ),
  },
  conclusionTitle: {
    fontSize: 24,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  conclusionSubtitle: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: radius.lg,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#fff',
  },
});

export default OnboardingQuizScreen;
