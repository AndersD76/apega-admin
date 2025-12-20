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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { login, register } from '../services/auth';

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
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />

        {/* Hero Gradient */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroGradient, { paddingTop: insets.top + 20 }]}
        >
          <TouchableOpacity
            style={styles.backButtonLight}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="leaf" size={48} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Apega Desapega</Text>
            <Text style={styles.heroSubtitle}>
              Moda com propósito.{'\n'}Sustentabilidade com estilo.
            </Text>
          </View>

          <View style={styles.heroDecor}>
            <Ionicons name="shirt-outline" size={100} color="rgba(255,255,255,0.08)" />
          </View>
        </LinearGradient>

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
              colors={[COLORS.primary, '#4a7c59']}
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
              <Ionicons name="logo-google" size={22} color="#EA4335" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() => handleSocialLogin('Facebook')}
            >
              <Ionicons name="logo-facebook" size={22} color="#1877F2" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() => handleSocialLogin('Apple')}
            >
              <Ionicons name="logo-apple" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            De Passo Fundo para o mundo{'\n'}com amor e sustentabilidade
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
  heroGradient: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  backButtonLight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  heroDecor: {
    position: 'absolute',
    right: -30,
    bottom: -20,
  },

  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },

  // Primary Button
  primaryBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 12,
  },
  primaryBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Secondary Button
  secondaryBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 28,
    marginBottom: 24,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    backgroundColor: '#fafafa',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
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
