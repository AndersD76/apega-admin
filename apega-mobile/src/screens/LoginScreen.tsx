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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { login, register } from '../services/auth';

interface LoginScreenProps {
  navigation: any;
}

type Screen = 'main' | 'email-login' | 'email-signup' | 'forgot';

const { width } = Dimensions.get('window');

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
      Alert.alert('ops', 'preencha email e senha');
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
      Alert.alert('ops', error.message || 'falha no login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupName || signupName.length < 3) {
      Alert.alert('ops', 'nome deve ter no mínimo 3 caracteres');
      return;
    }
    if (!signupEmail || !signupEmail.includes('@')) {
      Alert.alert('ops', 'email inválido');
      return;
    }
    if (!signupPassword || signupPassword.length < 8) {
      Alert.alert('ops', 'senha deve ter no mínimo 8 caracteres');
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
      Alert.alert('ops', error.message || 'falha no cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('em breve', `login com ${provider} estará disponível em breve`);
  };

  // Main screen - Enjoei style
  if (currentScreen === 'main') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.logo}>apegadesapega</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.mainContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>entrar no apega</Text>
            <Text style={styles.mainSubtitle}>a casa é sua, se aprochegue.</Text>
          </View>

          {/* Primary Button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setCurrentScreen('email-signup')}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>criar conta</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Options */}
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleSocialLogin('celular')}
            activeOpacity={0.7}
          >
            <Ionicons name="phone-portrait-outline" size={20} color="#333" />
            <Text style={styles.socialBtnText}>continuar com celular</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => setCurrentScreen('email-login')}
            activeOpacity={0.7}
          >
            <Ionicons name="mail-outline" size={20} color="#333" />
            <Text style={styles.socialBtnText}>continuar com email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleSocialLogin('google')}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.socialBtnText}>continuar com o google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => handleSocialLogin('facebook')}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-facebook" size={20} color="#1877F2" />
            <Text style={styles.socialBtnText}>continuar com o facebook</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Email Login
  if (currentScreen === 'email-login') {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentScreen('main')}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.logo}>apegadesapega</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.formTitle}>entrar com email</Text>
          <Text style={styles.formSubtitle}>bora lá, digite seus dados</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>email</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>senha</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="sua senha"
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
            <Text style={styles.forgotLink}>esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: 24 }]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>
              {isLoading ? 'entrando...' : 'entrar'}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>não tem conta? </Text>
            <TouchableOpacity onPress={() => setCurrentScreen('email-signup')}>
              <Text style={styles.switchLink}>criar conta</Text>
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
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentScreen('main')}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.logo}>apegadesapega</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.formTitle}>criar conta</Text>
          <Text style={styles.formSubtitle}>vem fazer parte da comunidade</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>nome</Text>
            <TextInput
              style={styles.input}
              value={signupName}
              onChangeText={setSignupName}
              placeholder="como quer ser chamada?"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>email</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>senha</Text>
            <TextInput
              style={styles.input}
              value={signupPassword}
              onChangeText={setSignupPassword}
              placeholder="mínimo 8 caracteres"
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>

          <Text style={styles.termsText}>
            ao criar uma conta, você está de acordo com os{' '}
            <Text style={styles.termsLink}>termos de serviço</Text> e a{' '}
            <Text style={styles.termsLink}>política de privacidade</Text> do apega.
          </Text>

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: 24 }]}
            onPress={handleSignup}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>
              {isLoading ? 'criando...' : 'criar conta'}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>já tem conta? </Text>
            <TouchableOpacity onPress={() => setCurrentScreen('email-login')}>
              <Text style={styles.switchLink}>entrar</Text>
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
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentScreen('email-login')}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.logo}>apegadesapega</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.formTitle}>esqueci a senha</Text>
          <Text style={styles.formSubtitle}>
            sem problemas! digite seu email que a gente te ajuda.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>email</Text>
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

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: 24 }]}
            onPress={() => {
              if (email && email.includes('@')) {
                Alert.alert('pronto!', 'enviamos um link para recuperar sua senha');
                setCurrentScreen('email-login');
              } else {
                Alert.alert('ops', 'digite um email válido');
              }
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>enviar link</Text>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },

  // Main Screen
  mainContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#666',
  },

  // Primary Button
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },

  // Social Buttons
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    gap: 10,
  },
  socialBtnText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },

  // Form
  formContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  forgotLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
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
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});
