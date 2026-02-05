import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../theme';
import { Button } from '../components';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'welcome' | 'login' | 'register' | 'forgot';

interface LoginScreenProps {
  navigation: any;
}

export function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<AuthMode>('welcome');
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Erro', 'Preencha email e senha');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigation.replace('Main');
    } catch (error: any) {
      showAlert('Erro', error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      showAlert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, phone: phone || undefined });
      navigation.replace('Main');
    } catch (error: any) {
      showAlert('Erro', error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const renderWelcome = () => (
    <View style={styles.welcomeContent}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Largô</Text>
      </View>

      <Text style={styles.welcomeTitle}>
        Largou?{'\n'}Pegou!
      </Text>
      <Text style={styles.welcomeSubtitle}>
        Moda circular para um mundo melhor.{'\n'}Larga o que não usa e pega o que ama!
      </Text>

      <View style={styles.welcomeButtons}>
        <Button
          title="Criar conta"
          onPress={() => setMode('register')}
          variant="primary"
          size="lg"
          fullWidth
        />
        <Button
          title="Já tenho conta"
          onPress={() => setMode('login')}
          variant="outline"
          size="lg"
          fullWidth
        />
        <Pressable
          style={styles.skipButton}
          onPress={() => navigation.replace('Main')}
        >
          <Text style={styles.skipText}>Entrar sem conta</Text>
        </Pressable>
      </View>

      <View style={styles.features}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="leaf" size={20} color={colors.primary} />
          </View>
          <Text style={styles.featureText}>Moda circular</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          </View>
          <Text style={styles.featureText}>Compra segura</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="wallet" size={20} color={colors.primary} />
          </View>
          <Text style={styles.featureText}>Ganhe dinheiro</Text>
        </View>
      </View>
    </View>
  );

  const renderLogin = () => (
    <View style={styles.formContent}>
      <Pressable style={styles.backButton} onPress={() => setMode('welcome')}>
        <Ionicons name="arrow-back" size={24} color={colors.gray700} />
      </Pressable>

      <Text style={styles.formTitle}>Entrar na conta</Text>
      <Text style={styles.formSubtitle}>
        Bora voltar? Suas peças estão te esperando!
      </Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={colors.gray400} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.gray400}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.gray400} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={colors.gray400}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.gray400}
            />
          </Pressable>
        </View>

        <Pressable
          style={styles.forgotButton}
          onPress={() => setMode('forgot')}
        >
          <Text style={styles.forgotText}>Esqueci minha senha</Text>
        </Pressable>

        <Button
          title="Entrar"
          onPress={handleLogin}
          loading={loading}
          size="lg"
          fullWidth
        />

        <Pressable
          style={styles.switchMode}
          onPress={() => setMode('register')}
        >
          <Text style={styles.switchText}>
            Não tem conta? <Text style={styles.switchTextBold}>Criar conta</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderRegister = () => (
    <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.formContent}>
        <Pressable style={styles.backButton} onPress={() => setMode('welcome')}>
          <Ionicons name="arrow-back" size={24} color={colors.gray700} />
        </Pressable>

        <Text style={styles.formTitle}>Criar conta</Text>
        <Text style={styles.formSubtitle}>
          Chega mais! Aqui a moda circula
        </Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={colors.gray400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor={colors.gray400}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.gray400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.gray400}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={colors.gray400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Telefone (opcional)"
              placeholderTextColor={colors.gray400}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.gray400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={colors.gray400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.gray400}
              />
            </Pressable>
          </View>

          <Text style={styles.terms}>
            Ao criar conta, você concorda com nossos{' '}
            <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text>
          </Text>

          <Button
            title="Criar conta"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            fullWidth
          />

          <Pressable
            style={styles.switchMode}
            onPress={() => setMode('login')}
          >
            <Text style={styles.switchText}>
              Já tem conta? <Text style={styles.switchTextBold}>Entrar</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primaryMuted, colors.white]}
        style={styles.gradient}
      />

      {/* Decorative circles */}
      <View style={[styles.decorCircle, styles.circle1]} />
      <View style={[styles.decorCircle, styles.circle2]} />
      <View style={[styles.decorCircle, styles.circle3]} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.xl }]}>
          {mode === 'welcome' && renderWelcome()}
          {mode === 'login' && renderLogin()}
          {mode === 'register' && renderRegister()}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.primary,
    opacity: 0.05,
  },
  circle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -80,
  },
  circle3: {
    width: 150,
    height: 150,
    bottom: -50,
    right: -30,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },

  // Welcome
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing['3xl'],
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
  },
  logoAccent: {
    fontSize: 36,
    fontWeight: '300',
    color: colors.gray500,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.gray900,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.gray500,
    lineHeight: 24,
    marginBottom: spacing['3xl'],
  },
  welcomeButtons: {
    gap: spacing.md,
    marginBottom: spacing['3xl'],
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 14,
    color: colors.gray500,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: 12,
    color: colors.gray600,
    textAlign: 'center',
  },

  // Form
  formScroll: {
    flex: 1,
  },
  formContent: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  formSubtitle: {
    fontSize: 15,
    color: colors.gray500,
    marginBottom: spacing['2xl'],
  },
  form: {
    gap: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    height: 56,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.gray900,
  },
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  switchMode: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
  },
  switchText: {
    fontSize: 14,
    color: colors.gray500,
  },
  switchTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
  terms: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '500',
  },
});

export default LoginScreen;
