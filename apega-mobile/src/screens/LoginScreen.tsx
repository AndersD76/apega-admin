import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, BRAND, SHADOWS } from '../constants/theme';
import { Input, Button, BrandLogo } from '../components';
import { login, register } from '../services/auth';

interface LoginScreenProps {
  navigation: any;
}

type Screen = 'login' | 'signup' | 'forgot' | 'onboarding';

const { width, height } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: 1,
    icon: 'bag-handle',
    color: '#FF6B6B',
    bgColor: '#FEE2E2',
    title: 'Compre moda sustentável',
    description: 'Encontre peças únicas com até 70% de desconto',
  },
  {
    id: 2,
    icon: 'cash',
    color: '#10B981',
    bgColor: '#D1FAE5',
    title: 'Venda o que não usa mais',
    description: 'Transforme seu guarda-roupa parado em dinheiro',
  },
  {
    id: 3,
    icon: 'leaf',
    color: COLORS.primary,
    bgColor: '#E8F5E9',
    title: 'Impacto positivo',
    description: 'Cada compra ajuda o planeta e apoia pequenas vendedoras',
  },
];

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupPasswordConfirm, setShowSignupPasswordConfirm] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha no login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupName || signupName.length < 3) {
      Alert.alert('Erro', 'Nome deve ter no mínimo 3 caracteres');
      return;
    }
    if (!signupEmail || !signupEmail.includes('@')) {
      Alert.alert('Erro', 'Email inválido');
      return;
    }
    if (!signupPassword || signupPassword.length < 8) {
      Alert.alert('Erro', 'Senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (signupPassword !== signupPasswordConfirm) {
      Alert.alert('Erro', 'Senhas não coincidem');
      return;
    }
    if (!acceptTerms) {
      Alert.alert('Erro', 'Você deve aceitar os termos de uso');
      return;
    }

    setIsLoading(true);
    try {
      await register(signupEmail, signupPassword, signupName);
      setCurrentScreen('onboarding');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha no cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!forgotEmail || !forgotEmail.includes('@')) {
      Alert.alert('Erro', 'Email inválido');
      return;
    }
    setEmailSent(true);
  };

  const handleOnboardingNext = () => {
    if (onboardingStep < ONBOARDING_SLIDES.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      navigation.navigate('Home');
    }
  };

  const handleOnboardingSkip = () => {
    navigation.navigate('Home');
  };

  // Onboarding View
  if (currentScreen === 'onboarding') {
    const slide = ONBOARDING_SLIDES[onboardingStep];
    const isLastSlide = onboardingStep === ONBOARDING_SLIDES.length - 1;

    return (
      <View style={styles.onboardingContainer}>
        <StatusBar barStyle="dark-content" />

        {!isLastSlide && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleOnboardingSkip}
          >
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        )}

        <View style={styles.onboardingContent}>
          <View style={[styles.onboardingIconWrapper, { backgroundColor: slide.bgColor }]}>
            <Ionicons name={slide.icon as any} size={64} color={slide.color} />
          </View>

          <Text style={styles.onboardingTitle}>{slide.title}</Text>
          <Text style={styles.onboardingDescription}>{slide.description}</Text>

          <View style={styles.onboardingDots}>
            {ONBOARDING_SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === onboardingStep && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.onboardingFooter}>
          <TouchableOpacity
            style={styles.onboardingButton}
            onPress={handleOnboardingNext}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.onboardingButtonGradient}
            >
              <Text style={styles.onboardingButtonText}>
                {isLastSlide ? 'Começar' : 'Próximo'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Login View
  if (currentScreen === 'login') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" />
        <ScrollView
          contentContainerStyle={styles.loginContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.loginHeader}
          >
            <View style={styles.loginHeaderContent}>
              <View style={styles.logoCircle}>
                <Ionicons name="leaf" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.loginBrandName}>apegadesapega</Text>
            </View>

            {/* Decorative elements */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </LinearGradient>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeTitle}>Bem-vinda de volta!</Text>
            <Text style={styles.welcomeSubtitle}>Entre para continuar comprando e vendendo</Text>

            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Ionicons name="mail-outline" size={20} color={COLORS.gray[400]} />
              </View>
              <Input
                label=""
                value={email}
                onChangeText={setEmail}
                placeholder="Seu e-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                hasLeftIcon
              />
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />
              </View>
              <Input
                label=""
                value={password}
                onChangeText={setPassword}
                placeholder="Sua senha"
                secureTextEntry={!showPassword}
                hasLeftIcon
                hasRightIcon
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={COLORS.gray[400]}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => setCurrentScreen('forgot')}
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                {isLoading ? (
                  <Text style={styles.primaryButtonText}>Entrando...</Text>
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Entrar</Text>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem conta? </Text>
              <TouchableOpacity onPress={() => setCurrentScreen('signup')}>
                <Text style={styles.footerLink}>Criar conta grátis</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Signup View
  if (currentScreen === 'signup') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" />
        <ScrollView
          contentContainerStyle={styles.signupContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentScreen('login')}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </View>
          </TouchableOpacity>

          <View style={styles.signupHeader}>
            <Text style={styles.signupTitle}>Crie sua conta</Text>
            <Text style={styles.signupSubtitle}>Comece a comprar e vender moda sustentável</Text>
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Ionicons name="person-outline" size={20} color={COLORS.gray[400]} />
            </View>
            <Input
              label=""
              value={signupName}
              onChangeText={setSignupName}
              placeholder="Nome completo"
              hasLeftIcon
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Ionicons name="mail-outline" size={20} color={COLORS.gray[400]} />
            </View>
            <Input
              label=""
              value={signupEmail}
              onChangeText={setSignupEmail}
              placeholder="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              hasLeftIcon
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />
            </View>
            <Input
              label=""
              value={signupPassword}
              onChangeText={setSignupPassword}
              placeholder="Senha (mín. 8 caracteres)"
              secureTextEntry={!showSignupPassword}
              hasLeftIcon
              hasRightIcon
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowSignupPassword(!showSignupPassword)}
            >
              <Ionicons
                name={showSignupPassword ? 'eye' : 'eye-off'}
                size={20}
                color={COLORS.gray[400]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.gray[400]} />
            </View>
            <Input
              label=""
              value={signupPasswordConfirm}
              onChangeText={setSignupPasswordConfirm}
              placeholder="Confirmar senha"
              secureTextEntry={!showSignupPasswordConfirm}
              hasLeftIcon
              hasRightIcon
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowSignupPasswordConfirm(!showSignupPasswordConfirm)}
            >
              <Ionicons
                name={showSignupPasswordConfirm ? 'eye' : 'eye-off'}
                size={20}
                color={COLORS.gray[400]}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            <View style={[styles.checkboxBox, acceptTerms && styles.checkboxBoxActive]}>
              {acceptTerms && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
            </View>
            <Text style={styles.checkboxLabel}>
              Aceito os <Text style={styles.checkboxLink}>termos de uso</Text> e <Text style={styles.checkboxLink}>política de privacidade</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAcceptMarketing(!acceptMarketing)}
          >
            <View style={[styles.checkboxBox, acceptMarketing && styles.checkboxBoxActive]}>
              {acceptMarketing && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
            </View>
            <Text style={styles.checkboxLabel}>
              Quero receber novidades e ofertas por e-mail
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: SPACING.lg }]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Criando...' : 'Criar conta'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => setCurrentScreen('login')}>
              <Text style={styles.footerLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Forgot Password View
  if (currentScreen === 'forgot') {
    if (emailSent) {
      return (
        <View style={styles.successContainer}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.successIconWrapper}>
            <Ionicons name="mail" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.successTitle}>E-mail enviado!</Text>
          <Text style={styles.successDescription}>
            Confira sua caixa de entrada em {forgotEmail}
          </Text>

          <TouchableOpacity onPress={() => setEmailSent(false)}>
            <Text style={styles.resendLink}>Não recebeu? Reenviar e-mail</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { marginTop: SPACING.xl }]}
            onPress={() => {
              setCurrentScreen('login');
              setEmailSent(false);
            }}
          >
            <Text style={styles.secondaryButtonText}>Voltar para login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" />
        <ScrollView
          contentContainerStyle={styles.forgotContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentScreen('login')}
          >
            <View style={styles.backButtonCircle}>
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </View>
          </TouchableOpacity>

          <View style={styles.forgotHeader}>
            <View style={styles.forgotIconWrapper}>
              <Ionicons name="key-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.forgotTitle}>Esqueceu sua senha?</Text>
            <Text style={styles.forgotDescription}>
              Sem problemas! Digite seu e-mail e enviaremos um link para redefinir sua senha.
            </Text>
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.inputIcon}>
              <Ionicons name="mail-outline" size={20} color={COLORS.gray[400]} />
            </View>
            <Input
              label=""
              value={forgotEmail}
              onChangeText={setForgotEmail}
              placeholder="Seu e-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              hasLeftIcon
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: SPACING.lg }]}
            onPress={handleForgotPassword}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Enviar link</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: SPACING.xl, alignItems: 'center' }}
            onPress={() => setCurrentScreen('login')}
          >
            <Text style={styles.backToLoginText}>Voltar para login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // Login Screen
  loginContent: {
    flexGrow: 1,
  },
  loginHeader: {
    paddingTop: 70,
    paddingBottom: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  loginHeaderContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.lg,
  },
  loginBrandName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  loginBrandTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -50,
    right: -50,
  },
  decorCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -30,
    left: -30,
  },
  formContainer: {
    padding: SPACING.xl,
    paddingTop: SPACING['2xl'],
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  dividerText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    paddingHorizontal: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Signup Screen
  signupContent: {
    padding: SPACING.xl,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: SPACING.lg,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupHeader: {
    marginBottom: SPACING.xl,
  },
  signupTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  signupSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxBoxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  checkboxLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Forgot Password Screen
  forgotContent: {
    padding: SPACING.xl,
    paddingTop: 50,
  },
  forgotHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  forgotIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  forgotTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  forgotDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  backToLoginText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Success Screen
  successContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  resendLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray[100],
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Onboarding Screen
  onboardingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: SPACING.lg,
    zIndex: 10,
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  onboardingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  onboardingIconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING['3xl'],
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  onboardingDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING['3xl'],
    maxWidth: 280,
  },
  onboardingDots: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray[300],
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  onboardingFooter: {
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  onboardingButton: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  onboardingButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  onboardingButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
