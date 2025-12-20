import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { login, register } from '../services/auth';

// Imagens do carousel
const CAROUSEL_IMAGES = [
  { uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80', label: 'Vestidos' },
  { uri: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80', label: 'Moda' },
  { uri: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80', label: 'Bolsas' },
  { uri: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&q=80', label: 'Calçados' },
  { uri: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80', label: 'Blusas' },
];

interface LoginScreenProps {
  navigation: any;
}

type Screen = 'main' | 'email-login' | 'email-signup' | 'forgot';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-rotate carousel
  useEffect(() => {
    if (currentScreen !== 'main') return;

    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change image
        setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentScreen, fadeAnim]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha email e senha');
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
      Alert.alert('Atenção', 'Nome deve ter no mínimo 3 caracteres');
      return;
    }
    if (!signupEmail || !signupEmail.includes('@')) {
      Alert.alert('Atenção', 'Email inválido');
      return;
    }
    if (!signupPassword || signupPassword.length < 8) {
      Alert.alert('Atenção', 'Senha deve ter no mínimo 8 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      await register(signupEmail, signupPassword, signupName);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha no cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Em breve', `Login com ${provider} estará disponível em breve!`);
  };

  // Main screen
  if (currentScreen === 'main') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Hero with Image */}
        <View style={[styles.heroSection, { paddingTop: insets.top }]}>
          {/* Background Image */}
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80' }}
            style={styles.heroBackground}
          />

          {/* Overlay Gradient */}
          <LinearGradient
            colors={['rgba(107, 144, 128, 0.85)', 'rgba(82, 115, 99, 0.95)']}
            style={styles.heroOverlay}
          />

          {/* Geometric Shapes */}
          <View style={styles.heroGeometry1} />
          <View style={styles.heroGeometry2} />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButtonLight}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <Text style={styles.heroLogo}>apegadesapega</Text>
            <Text style={styles.heroTagline}>
              MODA SUSTENTÁVEL{'\n'}É NOSSO MODO DE{'\n'}MUDAR O MUNDO
            </Text>
          </View>

          {/* Hero Carousel */}
          <View style={styles.heroImageArea}>
            <View style={styles.heroImageCircle} />
            <Animated.View style={[styles.carouselContainer, { opacity: fadeAnim }]}>
              <Image
                source={{ uri: CAROUSEL_IMAGES[currentImageIndex].uri }}
                style={styles.heroImage}
              />
              <View style={styles.carouselLabel}>
                <Text style={styles.carouselLabelText}>
                  {CAROUSEL_IMAGES[currentImageIndex].label}
                </Text>
              </View>
            </Animated.View>
            {/* Dots indicator */}
            <View style={styles.dotsContainer}>
              {CAROUSEL_IMAGES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentImageIndex === index && styles.dotActive
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.mainContent}>
          <Text style={styles.welcomeTitle}>Bem-vinda!</Text>
          <Text style={styles.welcomeSubtitle}>
            Entre para descobrir peças incríveis
          </Text>

          {/* Primary Button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setCurrentScreen('email-signup')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Criar Conta Grátis</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Button */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setCurrentScreen('email-login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Já tenho conta</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou continue com</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() => handleSocialLogin('Google')}
            >
              <Text style={styles.socialIconText}>G</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialIconBtn, { backgroundColor: '#1877F2' }]}
              onPress={() => handleSocialLogin('Facebook')}
            >
              <Text style={[styles.socialIconText, { color: '#fff' }]}>f</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialIconBtn, { backgroundColor: '#000' }]}
              onPress={() => handleSocialLogin('Apple')}
            >
              <Text style={[styles.socialIconText, { color: '#fff' }]}></Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            De Passo Fundo para o mundo{'\n'}com amor e sustentabilidade 💚
          </Text>
        </View>
      </View>
    );
  }

  // Email Login
  if (currentScreen === 'email-login') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentScreen('main')}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Apega</Text>
            <Text style={styles.logoAccent}>Desapega</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formHeader}>
            <View style={styles.formIcon}>
              <Ionicons name="mail" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.formTitle}>Entrar</Text>
            <Text style={styles.formSubtitle}>Digite seus dados para continuar</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Sua senha"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={() => setCurrentScreen('forgot')}>
            <Text style={styles.forgotLink}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.primary, '#4a7c59']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

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

  // Email Signup
  if (currentScreen === 'email-signup') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentScreen('main')}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Apega</Text>
            <Text style={styles.logoAccent}>Desapega</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formHeader}>
            <View style={[styles.formIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="person-add" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.formTitle}>Criar Conta</Text>
            <Text style={styles.formSubtitle}>Junte-se à nossa comunidade</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={signupName}
                onChangeText={setSignupName}
                placeholder="Como quer ser chamada?"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={signupEmail}
                onChangeText={setSignupEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={signupPassword}
                onChangeText={setSignupPassword}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>
          </View>

          <Text style={styles.termsText}>
            Ao criar uma conta, você concorda com os{' '}
            <Text style={styles.termsLink}>Termos de Serviço</Text> e{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text>.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.primary, '#4a7c59']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>
                {isLoading ? 'Criando...' : 'Criar Conta'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

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

  // Forgot Password
  if (currentScreen === 'forgot') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentScreen('email-login')}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Apega</Text>
            <Text style={styles.logoAccent}>Desapega</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formHeader}>
            <View style={[styles.formIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="key" size={28} color="#FF9800" />
            </View>
            <Text style={styles.formTitle}>Recuperar Senha</Text>
            <Text style={styles.formSubtitle}>
              Digite seu email e enviaremos um link para redefinir sua senha
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              if (email && email.includes('@')) {
                Alert.alert('Pronto!', 'Enviamos um link para recuperar sua senha');
                setCurrentScreen('email-login');
              } else {
                Alert.alert('Atenção', 'Digite um email válido');
              }
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FF9800', '#F57C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Enviar Link</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLoginBtn}
            onPress={() => setCurrentScreen('email-login')}
          >
            <Text style={styles.backToLoginText}>Voltar para o login</Text>
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
    backgroundColor: '#fff',
  },

  // Hero
  heroSection: {
    position: 'relative',
    height: 320,
    overflow: 'hidden',
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGeometry1: {
    position: 'absolute',
    top: 20,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroGeometry2: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backButtonLight: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backArrow: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },
  heroContent: {
    position: 'absolute',
    left: 24,
    top: 80,
    maxWidth: '50%',
  },
  heroLogo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroTagline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 26,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroImageArea: {
    position: 'absolute',
    right: 16,
    top: 60,
    alignItems: 'center',
  },
  heroImageCircle: {
    position: 'absolute',
    top: -10,
    right: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  carouselContainer: {
    alignItems: 'center',
  },
  heroImage: {
    width: 140,
    height: 180,
    borderRadius: 16,
  },
  carouselLabel: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  carouselLabelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
  },

  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },

  // Primary Button
  primaryBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 14,
  },
  primaryBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // Secondary Button
  secondaryBtn: {
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 28,
    marginBottom: 24,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  socialIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EA4335',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#999',
    fontSize: 13,
  },

  // Social Buttons
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  socialIconBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Footer
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  logoAccent: {
    fontSize: 18,
    fontWeight: '300',
    color: '#333',
    marginLeft: 4,
  },

  // Form
  formContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  formIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f7f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    borderRadius: 16,
    backgroundColor: '#fafafa',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 17,
    color: '#1a1a1a',
  },
  eyeBtn: {
    padding: 12,
  },
  forgotLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  switchText: {
    color: '#666',
    fontSize: 14,
  },
  switchLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  backToLoginBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  backToLoginText: {
    color: '#666',
    fontSize: 14,
  },
});
