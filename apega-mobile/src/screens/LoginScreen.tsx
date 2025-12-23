import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TextInput,
  Image,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

const isWeb = Platform.OS === 'web';

interface LoginScreenProps {
  navigation: any;
  route?: {
    params?: {
      redirectTo?: string;
    };
  };
}

type Screen = 'main' | 'email-login' | 'email-signup' | 'forgot';

// Fashion images for background - Alta resolução
const FASHION_IMAGES = [
  'https://images.unsplash.com/photo-1558171813-01342e9fa63c?w=1920&q=95', // Arara de roupas coloridas
  'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1920&q=95', // Roupas em cabides
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=95', // Loja de moda
];

export default function LoginScreen({ navigation, route }: LoginScreenProps) {
  // Parâmetro de redirecionamento após cadastro
  const redirectTo = route?.params?.redirectTo || null;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 768;
  const styles = useMemo(() => createStyles(isDesktop), [isDesktop]);
  const { login: authLogin, register: authRegister } = useAuth();
  // Se tem redirectTo, vai direto para signup
  const [currentScreen, setCurrentScreen] = useState<Screen>(redirectTo ? 'email-signup' : 'main');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Background image rotation
  useEffect(() => {
    if (currentScreen !== 'main') return;

    const interval = setInterval(() => {
      Animated.timing(imageFade, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentImageIndex((prev) => (prev + 1) % FASHION_IMAGES.length);
        Animated.timing(imageFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentScreen]);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Digite seu email');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Atenção', 'Digite sua senha');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Atenção', 'Digite um email válido');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authLogin(email.trim().toLowerCase(), password);
      if (!result.success) {
        throw new Error(result.message || 'Email ou senha incorretos. Verifique seus dados e tente novamente.');
      }
      if (redirectTo) {
        navigation.reset({
          index: 1,
          routes: [
            { name: 'Home' },
            { name: redirectTo },
          ],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Erro no Login',
        error.message || 'Email ou senha incorretos. Verifique seus dados e tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupName.trim() || signupName.length < 2) {
      Alert.alert('Atenção', 'Digite seu nome (mínimo 2 caracteres)');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      Alert.alert('Atenção', 'Digite um email válido');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authRegister(signupEmail.trim().toLowerCase(), signupPassword, signupName.trim());
      if (!result.success) {
        throw new Error(result.message || 'NÇœo foi possÇðvel criar sua conta. Tente novamente.');
      }
      // Se tem redirectTo, vai para lá após criar conta
      if (redirectTo) {
        navigation.reset({
          index: 1,
          routes: [
            { name: 'Home' },
            { name: redirectTo },
          ],
        });
      } else {
        // Após criar conta, vai para EditProfile para completar cadastro
        navigation.reset({
          index: 1,
          routes: [
            { name: 'Home' },
            { name: 'EditProfile' },
          ],
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Erro no Cadastro', error.message || 'Não foi possível criar sua conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Em breve', `Login com ${provider} estará disponível em breve!`);
  };

  // Main Welcome Screen
  if (currentScreen === 'main') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Full Screen Background */}
        <View style={StyleSheet.absoluteFill}>
          <Animated.Image
            source={{ uri: FASHION_IMAGES[currentImageIndex] }}
            style={[styles.backgroundImage, { opacity: imageFade }]}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(255,255,255,0.95)', '#fff']}
            locations={[0, 0.3, 0.5, 0.6]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Content */}
        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
            }
          ]}
        >
          {/* Logo Area at Top */}
          <View style={[styles.logoArea, { marginTop: insets.top + 20 }]}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoMain}>apega</Text>
              <Text style={styles.logoAccent}>desapega</Text>
            </View>
            <Text style={styles.tagline}>moda circular com propósito</Text>
          </View>

          {/* Bottom Card */}
          <View style={styles.bottomCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cardContent}
            >
              {/* Welcome Text */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>Bem-vinda!</Text>
                <Text style={styles.welcomeSubtitle}>
                  Descubra peças únicas e dê uma nova vida{'\n'}ao seu guarda-roupa
                </Text>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>50k+</Text>
                  <Text style={styles.statLabel}>peças</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>10k+</Text>
                  <Text style={styles.statLabel}>vendedoras</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>4.9</Text>
                  <Text style={styles.statLabel}>avaliação</Text>
                </View>
              </View>

              {/* Primary CTA */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setCurrentScreen('email-signup')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[COLORS.primary, '#4a7c59']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="person-add-outline" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Criar Conta Grátis</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Secondary CTA */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setCurrentScreen('email-login')}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou entre com</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Buttons */}
              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('Google')}
                >
                  <Image
                    source={{ uri: 'https://www.google.com/favicon.ico' }}
                    style={styles.socialIcon}
                  />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, styles.socialButtonApple]}
                  onPress={() => handleSocialLogin('Apple')}
                >
                  <Ionicons name="logo-apple" size={20} color="#fff" />
                  <Text style={[styles.socialButtonText, { color: '#fff' }]}>Apple</Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Ao continuar, você concorda com nossos{' '}
                  <Text style={styles.footerLink}>Termos</Text> e{' '}
                  <Text style={styles.footerLink}>Privacidade</Text>
                </Text>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    );
  }

  // Login Screen
  if (currentScreen === 'email-login') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <LinearGradient
          colors={['#f8faf9', '#fff']}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={[styles.formHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentScreen('main')}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerLogoContainer}>
            <Text style={styles.headerLogo}>apega</Text>
            <Text style={styles.headerLogoAccent}>desapega</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Icon */}
          <View style={styles.formIconContainer}>
            <LinearGradient
              colors={[COLORS.primaryLight, '#e8f5e9']}
              style={styles.formIconGradient}
            >
              <Ionicons name="leaf" size={32} color={COLORS.primary} />
            </LinearGradient>
          </View>

          <Text style={styles.formTitle}>Entrar</Text>
          <Text style={styles.formSubtitle}>
            Bom te ver de volta! Continue sua{'\n'}jornada sustentável
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Sua senha"
                placeholderTextColor={COLORS.textTertiary}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => setCurrentScreen('forgot')}
          >
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={isLoading ? ['#9ca3af', '#9ca3af'] : [COLORS.primary, '#4a7c59']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Entrar</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Switch to Signup */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => setCurrentScreen('email-signup')}>
              <Text style={styles.switchLink}>Criar conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Signup Screen
  if (currentScreen === 'email-signup') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <LinearGradient
          colors={redirectTo ? ['#fef9e7', '#fff'] : ['#f8faf9', '#fff']}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={[styles.formHeader, { paddingTop: insets.top + 12 }]}>
          {/* Só mostra botão voltar se NÀO veio do fluxo de convite */}
          {!redirectTo ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentScreen('main')}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
          <View style={styles.headerLogoContainer}>
            <Text style={styles.headerLogo}>apega</Text>
            <Text style={styles.headerLogoAccent}>desapega</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Promo Banner - só mostra se veio do onboarding */}
          {redirectTo && (
            <View style={styles.promoBanner}>
              <LinearGradient
                colors={['#7B1FA2', '#9C27B0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.promoBannerGradient}
              >
                <View style={styles.promoBannerContent}>
                  <View style={styles.promoBannerIcon}>
                    <Ionicons name="diamond" size={24} color="#fff" />
                  </View>
                  <View style={styles.promoBannerText}>
                    <Text style={styles.promoBannerTitle}>Oferta de lancamento!</Text>
                    <Text style={styles.promoBannerSubtitle}>Premium gratis + taxa reduzida</Text>
                  </View>
                </View>
                <View style={styles.promoBannerBadge}>
                  <Ionicons name="flash" size={16} color="#7B1FA2" />
                  <Text style={styles.promoBannerBadgeText}>Vagas limitadas</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Form Icon */}
          <View style={styles.formIconContainer}>
            <LinearGradient
              colors={redirectTo ? ['#FFF3CD', '#FFE69C'] : ['#e3f2fd', '#bbdefb']}
              style={styles.formIconGradient}
            >
              <Ionicons name={redirectTo ? 'diamond' : 'sparkles'} size={32} color={redirectTo ? '#D4A574' : '#1976d2'} />
            </LinearGradient>
          </View>

          <Text style={styles.formTitle}>{redirectTo ? 'Garanta sua vaga' : 'Criar Conta'}</Text>
          <Text style={styles.formSubtitle}>
            {redirectTo
              ? 'Crie sua conta agora e aproveite\nPremium gratis + taxa reduzida de 5%'
              : 'Junte-se a milhares de pessoas que\namam moda sustentavel'
            }
          </Text>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Como quer ser chamada?</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                value={signupName}
                onChangeText={setSignupName}
                placeholder="Seu nome ou apelido"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                value={signupEmail}
                onChangeText={setSignupEmail}
                placeholder="seu@email.com"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                value={signupPassword}
                onChangeText={setSignupPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={COLORS.textTertiary}
                secureTextEntry={!showSignupPassword}
                autoComplete="new-password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowSignupPassword(!showSignupPassword)}
              >
                <Ionicons
                  name={showSignupPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            Ao criar sua conta, você concorda com nossos{' '}
            <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text>.
          </Text>

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={isLoading ? ['#9ca3af', '#9ca3af'] : [COLORS.primary, '#4a7c59']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Criar Conta</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Switch to Login */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => setCurrentScreen('email-login')}>
              <Text style={styles.switchLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Forgot Password Screen
  if (currentScreen === 'forgot') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <LinearGradient
          colors={['#fff8e1', '#fff']}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={[styles.formHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentScreen('email-login')}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerLogoContainer}>
            <Text style={styles.headerLogo}>apega</Text>
            <Text style={styles.headerLogoAccent}>desapega</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Icon */}
          <View style={styles.formIconContainer}>
            <LinearGradient
              colors={['#fff3e0', '#ffe0b2']}
              style={styles.formIconGradient}
            >
              <Ionicons name="key" size={32} color="#f57c00" />
            </LinearGradient>
          </View>

          <Text style={styles.formTitle}>Recuperar Senha</Text>
          <Text style={styles.formSubtitle}>
            Digite seu email e enviaremos{'\n'}instruções para redefinir sua senha
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textTertiary} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              if (email && email.includes('@')) {
                Alert.alert(
                  'Email Enviado! ✉️',
                  'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.',
                  [{ text: 'OK', onPress: () => setCurrentScreen('email-login') }]
                );
              } else {
                Alert.alert('Atenção', 'Digite um email válido');
              }
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#ff9800', '#f57c00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="send-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Enviar Link</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => setCurrentScreen('email-login')}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
            <Text style={styles.backToLoginText}>Voltar para o login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return null;
}

const createStyles = (isDesktop: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Background
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  // Main Screen
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
  },

  logoArea: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoMain: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -1,
  },
  logoAccent: {
    fontSize: 36,
    fontWeight: '400',
    color: COLORS.gray[400],
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Bottom Card
  bottomCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 8,
    maxHeight: isDesktop ? '70%' : '65%',
    ...SHADOWS.lg,
  },
  cardContent: {
    paddingHorizontal: isDesktop ? 60 : 28,
    paddingTop: 24,
    paddingBottom: 32,
    maxWidth: isDesktop ? 500 : '100%',
    alignSelf: 'center',
    width: '100%',
  },

  // Welcome Section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  // Buttons
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },

  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 16,
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: '700',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: COLORS.textTertiary,
    fontSize: 13,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
  },
  socialButtonApple: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Footer
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Form Header
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  headerLogo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  headerLogoAccent: {
    fontSize: 28,
    fontWeight: '400',
    color: COLORS.gray[400],
  },

  // Form Content
  formScrollContent: {
    flexGrow: 1,
    paddingHorizontal: isDesktop ? 80 : 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxWidth: isDesktop ? 500 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  formIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  formIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  // Inputs
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  eyeButton: {
    padding: 8,
  },

  // Forgot Password
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Switch Row
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  switchText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  switchLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Terms
  termsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Back to Login
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  backToLoginText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Promo Banner (quando vem do onboarding)
  promoBanner: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(123, 31, 162, 0.3)' },
      default: {
        shadowColor: '#7B1FA2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  promoBannerGradient: {
    padding: 16,
  },
  promoBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  promoBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  promoBannerText: {
    flex: 1,
  },
  promoBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  promoBannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  promoBannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  promoBannerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7B1FA2',
  },
});
