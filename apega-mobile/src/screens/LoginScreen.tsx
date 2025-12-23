import React, { useState, useEffect, useRef } from 'react';
import {
  YStack,
  XStack,
  Text,
  Input,
  ScrollView,
  Stack,
  styled,
  useTheme,
  Spinner,
  Image,
} from 'tamagui';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Alert,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui';

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

// Fashion images for background
const FASHION_IMAGES = [
  'https://images.unsplash.com/photo-1558171813-01342e9fa63c?w=1920&q=95',
  'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1920&q=95',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=95',
];

// Styled Components
const Container = styled(Stack, {
  flex: 1,
  backgroundColor: '$background',
});

const Header = styled(XStack, {
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const Logo = styled(Text, {
  fontSize: 28,
  fontWeight: '800',
  color: '$color',
});

const LogoAccent = styled(Text, {
  fontSize: 28,
  fontWeight: '400',
  color: '$placeholderColor',
});

const BackButton = styled(Stack, {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '$backgroundStrong',
  alignItems: 'center',
  justifyContent: 'center',
  pressStyle: {
    opacity: 0.7,
    scale: 0.95,
  },
  animation: 'fast',
});

const FormContainer = styled(YStack, {
  flex: 1,
  paddingHorizontal: '$5',
  paddingTop: '$4',
});

const FormIcon = styled(Stack, {
  width: 72,
  height: 72,
  borderRadius: 36,
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  marginBottom: '$4',
});

const FormTitle = styled(Text, {
  fontSize: 28,
  fontWeight: '800',
  color: '$color',
  textAlign: 'center',
  marginBottom: '$2',
});

const FormSubtitle = styled(Text, {
  fontSize: 15,
  color: '$placeholderColor',
  textAlign: 'center',
  lineHeight: 22,
  marginBottom: '$6',
});

const InputContainer = styled(YStack, {
  marginBottom: '$4',
});

const InputLabel = styled(Text, {
  fontSize: 14,
  fontWeight: '600',
  color: '$color',
  marginBottom: '$2',
});

const InputWrapper = styled(XStack, {
  backgroundColor: '$backgroundStrong',
  borderWidth: 2,
  borderColor: '$borderColor',
  borderRadius: '$3',
  paddingHorizontal: '$3',
  alignItems: 'center',
  gap: '$2',
});

const StyledInput = styled(Input, {
  flex: 1,
  backgroundColor: 'transparent',
  borderWidth: 0,
  fontSize: 16,
  color: '$color',
  paddingVertical: '$3',
});

const EyeButton = styled(Stack, {
  padding: '$2',
  pressStyle: {
    opacity: 0.7,
  },
});

const ErrorBanner = styled(XStack, {
  backgroundColor: '#FEE2E2',
  borderWidth: 1,
  borderColor: '#FECACA',
  borderRadius: '$3',
  padding: '$3',
  marginBottom: '$4',
  alignItems: 'center',
  gap: '$2',
});

const ErrorText = styled(Text, {
  flex: 1,
  fontSize: 14,
  fontWeight: '500',
  color: '#DC2626',
});

const SwitchRow = styled(XStack, {
  justifyContent: 'center',
  marginTop: '$4',
  gap: '$1',
});

const SwitchText = styled(Text, {
  fontSize: 14,
  color: '$placeholderColor',
});

const SwitchLink = styled(Text, {
  fontSize: 14,
  color: '$brand',
  fontWeight: '700',
});

const WelcomeCard = styled(YStack, {
  backgroundColor: '$background',
  borderTopLeftRadius: 32,
  borderTopRightRadius: 32,
  paddingTop: '$5',
  paddingHorizontal: '$5',
  paddingBottom: '$6',
  shadowColor: '$shadowColorStrong',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 1,
  shadowRadius: 20,
  elevation: 10,
});

const WelcomeTitle = styled(Text, {
  fontSize: 32,
  fontWeight: '800',
  color: '$color',
  textAlign: 'center',
  marginBottom: '$2',
});

const WelcomeSubtitle = styled(Text, {
  fontSize: 16,
  color: '$placeholderColor',
  textAlign: 'center',
  lineHeight: 24,
  marginBottom: '$5',
});

const StatsRow = styled(XStack, {
  backgroundColor: '$backgroundStrong',
  borderRadius: '$4',
  padding: '$4',
  marginBottom: '$5',
  justifyContent: 'center',
});

const StatItem = styled(YStack, {
  flex: 1,
  alignItems: 'center',
});

const StatNumber = styled(Text, {
  fontSize: 20,
  fontWeight: '800',
  color: '$brand',
});

const StatLabel = styled(Text, {
  fontSize: 12,
  color: '$placeholderColor',
  marginTop: '$1',
});

const StatDivider = styled(Stack, {
  width: 1,
  backgroundColor: '$borderColor',
  marginHorizontal: '$3',
});

const Divider = styled(XStack, {
  alignItems: 'center',
  marginVertical: '$4',
});

const DividerLine = styled(Stack, {
  flex: 1,
  height: 1,
  backgroundColor: '$borderColor',
});

const DividerText = styled(Text, {
  paddingHorizontal: '$4',
  color: '$placeholderColor',
  fontSize: 13,
});

const SocialRow = styled(XStack, {
  gap: '$3',
  marginBottom: '$5',
});

const SocialButton = styled(XStack, {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
  paddingVertical: '$3',
  borderRadius: '$3',
  borderWidth: 1,
  borderColor: '$borderColor',
  backgroundColor: '$background',
  pressStyle: {
    opacity: 0.7,
    scale: 0.98,
  },
  animation: 'fast',
});

const FooterText = styled(Text, {
  fontSize: 12,
  color: '$placeholderColor',
  textAlign: 'center',
  lineHeight: 18,
});

const FooterLink = styled(Text, {
  color: '$brand',
  fontWeight: '500',
});

const TermsText = styled(Text, {
  fontSize: 12,
  color: '$placeholderColor',
  textAlign: 'center',
  lineHeight: 18,
  marginBottom: '$4',
});

export default function LoginScreen({ navigation, route }: LoginScreenProps) {
  const redirectTo = route?.params?.redirectTo || null;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const isDesktop = isWeb && width > 768;
  const { login: authLogin, register: authRegister } = useAuth();

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

  // Loading & Error state
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (currentScreen !== 'main') return;
    const interval = setInterval(() => {
      Animated.timing(imageFade, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setCurrentImageIndex((prev) => (prev + 1) % FASHION_IMAGES.length);
        Animated.timing(imageFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentScreen]);

  const handleLogin = async () => {
    setLoginError(null);
    if (!email.trim()) { setLoginError('Digite seu email'); return; }
    if (!password.trim()) { setLoginError('Digite sua senha'); return; }
    if (!email.includes('@')) { setLoginError('Digite um email válido'); return; }

    setIsLoading(true);
    try {
      const result = await authLogin(email.trim().toLowerCase(), password);
      if (!result.success) throw new Error(result.message || 'Email ou senha incorretos');

      navigation.reset({
        index: redirectTo ? 1 : 0,
        routes: redirectTo ? [{ name: 'Home' }, { name: redirectTo }] : [{ name: 'Home' }],
      });
    } catch (error: any) {
      setLoginError(error.message || 'Email ou senha incorretos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setSignupError(null);
    if (!signupName.trim() || signupName.length < 2) { setSignupError('Digite seu nome (mínimo 2 caracteres)'); return; }
    if (!signupEmail.trim() || !signupEmail.includes('@')) { setSignupError('Digite um email válido'); return; }
    if (!signupPassword || signupPassword.length < 6) { setSignupError('A senha deve ter no mínimo 6 caracteres'); return; }

    setIsLoading(true);
    try {
      const result = await authRegister(signupEmail.trim().toLowerCase(), signupPassword, signupName.trim());
      if (!result.success) throw new Error(result.message || 'Não foi possível criar sua conta');

      navigation.reset({
        index: 1,
        routes: [{ name: 'Home' }, { name: redirectTo || 'EditProfile' }],
      });
    } catch (error: any) {
      setSignupError(error.message || 'Não foi possível criar sua conta');
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
      <Container>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Background */}
        <Stack position="absolute" top={0} left={0} right={0} bottom={0}>
          <Animated.Image
            source={{ uri: FASHION_IMAGES[currentImageIndex] }}
            style={{ width: '100%', height: '100%', position: 'absolute', opacity: imageFade }}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(255,255,255,0.95)', '#fff']}
            locations={[0, 0.3, 0.5, 0.6]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </Stack>

        {/* Content */}
        <Animated.View style={{ flex: 1, justifyContent: 'space-between', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Logo */}
          <YStack alignItems="center" paddingTop={insets.top + 20} paddingHorizontal="$5">
            <XStack alignItems="baseline">
              <Logo>apega</Logo>
              <LogoAccent>desapega</LogoAccent>
            </XStack>
            <Text fontSize={12} color="$placeholderColor" marginTop="$1" letterSpacing={2} textTransform="uppercase">
              moda circular com propósito
            </Text>
          </YStack>

          {/* Bottom Card */}
          <WelcomeCard>
            <ScrollView showsVerticalScrollIndicator={false}>
              <WelcomeTitle>Bem-vinda!</WelcomeTitle>
              <WelcomeSubtitle>
                Descubra peças únicas e dê uma nova vida{'\n'}ao seu guarda-roupa
              </WelcomeSubtitle>

              <StatsRow>
                <StatItem>
                  <StatNumber>50k+</StatNumber>
                  <StatLabel>peças</StatLabel>
                </StatItem>
                <StatDivider />
                <StatItem>
                  <StatNumber>10k+</StatNumber>
                  <StatLabel>vendedoras</StatLabel>
                </StatItem>
                <StatDivider />
                <StatItem>
                  <StatNumber>4.9</StatNumber>
                  <StatLabel>avaliação</StatLabel>
                </StatItem>
              </StatsRow>

              <Button variant="primary" size="lg" fullWidth onPress={() => setCurrentScreen('email-signup')}>
                Criar Conta Grátis
              </Button>

              <Button variant="secondary" size="lg" fullWidth marginTop="$3" onPress={() => setCurrentScreen('email-login')}>
                Já tenho conta
              </Button>

              <Divider>
                <DividerLine />
                <DividerText>ou entre com</DividerText>
                <DividerLine />
              </Divider>

              <SocialRow>
                <Pressable style={{ flex: 1 }} onPress={() => handleSocialLogin('Google')}>
                  <SocialButton>
                    <Image source={{ uri: 'https://www.google.com/favicon.ico' }} width={20} height={20} />
                    <Text fontSize={15} fontWeight="600" color="$color">Google</Text>
                  </SocialButton>
                </Pressable>
                <Pressable style={{ flex: 1 }} onPress={() => handleSocialLogin('Apple')}>
                  <SocialButton backgroundColor="$color" borderColor="$color">
                    <Ionicons name="logo-apple" size={20} color={theme.background?.val} />
                    <Text fontSize={15} fontWeight="600" color="$background">Apple</Text>
                  </SocialButton>
                </Pressable>
              </SocialRow>

              <FooterText>
                Ao continuar, você concorda com nossos{' '}
                <FooterLink>Termos</FooterLink> e{' '}
                <FooterLink>Privacidade</FooterLink>
              </FooterText>
            </ScrollView>
          </WelcomeCard>
        </Animated.View>
      </Container>
    );
  }

  // Login Screen
  if (currentScreen === 'email-login') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Container>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />

          <Header paddingTop={isWeb ? '$3' : insets.top + 12}>
            <Pressable onPress={() => setCurrentScreen('main')}>
              <BackButton>
                <Ionicons name="arrow-back" size={24} color={theme.color?.val} />
              </BackButton>
            </Pressable>
            <XStack alignItems="baseline">
              <Logo fontSize={24}>apega</Logo>
              <LogoAccent fontSize={24}>desapega</LogoAccent>
            </XStack>
            <Stack width={44} />
          </Header>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <FormContainer maxWidth={isDesktop ? 400 : '100%'} alignSelf="center" width="100%">
              <FormIcon>
                <LinearGradient colors={['#E8F0ED', '#D4E5DE']} style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="leaf" size={32} color={theme.brand?.val} />
                </LinearGradient>
              </FormIcon>

              <FormTitle>Entrar</FormTitle>
              <FormSubtitle>Bom te ver de volta! Continue sua{'\n'}jornada sustentável</FormSubtitle>

              {loginError && (
                <ErrorBanner>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <ErrorText>{loginError}</ErrorText>
                  <Pressable onPress={() => setLoginError(null)}>
                    <Ionicons name="close-circle" size={20} color="#DC2626" />
                  </Pressable>
                </ErrorBanner>
              )}

              <InputContainer>
                <InputLabel>Email</InputLabel>
                <InputWrapper>
                  <Ionicons name="mail-outline" size={20} color={theme.placeholderColor?.val} />
                  <StyledInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seu@email.com"
                    placeholderTextColor={theme.placeholderColor?.val}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </InputWrapper>
              </InputContainer>

              <InputContainer>
                <InputLabel>Senha</InputLabel>
                <InputWrapper>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.placeholderColor?.val} />
                  <StyledInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Sua senha"
                    placeholderTextColor={theme.placeholderColor?.val}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <EyeButton>
                      <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color={theme.placeholderColor?.val} />
                    </EyeButton>
                  </Pressable>
                </InputWrapper>
              </InputContainer>

              <Pressable onPress={() => setCurrentScreen('forgot')}>
                <Text fontSize={14} color="$brand" fontWeight="500" textAlign="right" marginBottom="$5">
                  Esqueci minha senha
                </Text>
              </Pressable>

              <Button variant="primary" size="lg" fullWidth loading={isLoading} onPress={handleLogin}>
                Entrar
              </Button>

              <SwitchRow>
                <SwitchText>Não tem conta? </SwitchText>
                <Pressable onPress={() => setCurrentScreen('email-signup')}>
                  <SwitchLink>Criar conta</SwitchLink>
                </Pressable>
              </SwitchRow>
            </FormContainer>
          </ScrollView>
        </Container>
      </KeyboardAvoidingView>
    );
  }

  // Signup Screen
  if (currentScreen === 'email-signup') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Container>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />

          <Header paddingTop={isWeb ? '$3' : insets.top + 12}>
            {!redirectTo ? (
              <Pressable onPress={() => setCurrentScreen('main')}>
                <BackButton>
                  <Ionicons name="arrow-back" size={24} color={theme.color?.val} />
                </BackButton>
              </Pressable>
            ) : (
              <Stack width={44} />
            )}
            <XStack alignItems="baseline">
              <Logo fontSize={24}>apega</Logo>
              <LogoAccent fontSize={24}>desapega</LogoAccent>
            </XStack>
            <Stack width={44} />
          </Header>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <FormContainer maxWidth={isDesktop ? 400 : '100%'} alignSelf="center" width="100%">
              <FormIcon>
                <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="sparkles" size={32} color="#1976D2" />
                </LinearGradient>
              </FormIcon>

              <FormTitle>Criar Conta</FormTitle>
              <FormSubtitle>Junte-se a milhares de pessoas que{'\n'}amam moda sustentável</FormSubtitle>

              {signupError && (
                <ErrorBanner>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <ErrorText>{signupError}</ErrorText>
                  <Pressable onPress={() => setSignupError(null)}>
                    <Ionicons name="close-circle" size={20} color="#DC2626" />
                  </Pressable>
                </ErrorBanner>
              )}

              <InputContainer>
                <InputLabel>Como quer ser chamada?</InputLabel>
                <InputWrapper>
                  <Ionicons name="person-outline" size={20} color={theme.placeholderColor?.val} />
                  <StyledInput
                    value={signupName}
                    onChangeText={setSignupName}
                    placeholder="Seu nome ou apelido"
                    placeholderTextColor={theme.placeholderColor?.val}
                    autoCapitalize="words"
                  />
                </InputWrapper>
              </InputContainer>

              <InputContainer>
                <InputLabel>Email</InputLabel>
                <InputWrapper>
                  <Ionicons name="mail-outline" size={20} color={theme.placeholderColor?.val} />
                  <StyledInput
                    value={signupEmail}
                    onChangeText={setSignupEmail}
                    placeholder="seu@email.com"
                    placeholderTextColor={theme.placeholderColor?.val}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </InputWrapper>
              </InputContainer>

              <InputContainer>
                <InputLabel>Senha</InputLabel>
                <InputWrapper>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.placeholderColor?.val} />
                  <StyledInput
                    value={signupPassword}
                    onChangeText={setSignupPassword}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={theme.placeholderColor?.val}
                    secureTextEntry={!showSignupPassword}
                  />
                  <Pressable onPress={() => setShowSignupPassword(!showSignupPassword)}>
                    <EyeButton>
                      <Ionicons name={showSignupPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color={theme.placeholderColor?.val} />
                    </EyeButton>
                  </Pressable>
                </InputWrapper>
              </InputContainer>

              <TermsText>
                Ao criar sua conta, você concorda com nossos{' '}
                <FooterLink>Termos de Uso</FooterLink> e{' '}
                <FooterLink>Política de Privacidade</FooterLink>.
              </TermsText>

              <Button variant="primary" size="lg" fullWidth loading={isLoading} onPress={handleSignup}>
                Criar Conta
              </Button>

              <SwitchRow>
                <SwitchText>Já tem conta? </SwitchText>
                <Pressable onPress={() => setCurrentScreen('email-login')}>
                  <SwitchLink>Entrar</SwitchLink>
                </Pressable>
              </SwitchRow>
            </FormContainer>
          </ScrollView>
        </Container>
      </KeyboardAvoidingView>
    );
  }

  // Forgot Password Screen
  if (currentScreen === 'forgot') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Container>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />

          <Header paddingTop={isWeb ? '$3' : insets.top + 12}>
            <Pressable onPress={() => setCurrentScreen('email-login')}>
              <BackButton>
                <Ionicons name="arrow-back" size={24} color={theme.color?.val} />
              </BackButton>
            </Pressable>
            <XStack alignItems="baseline">
              <Logo fontSize={24}>apega</Logo>
              <LogoAccent fontSize={24}>desapega</LogoAccent>
            </XStack>
            <Stack width={44} />
          </Header>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <FormContainer maxWidth={isDesktop ? 400 : '100%'} alignSelf="center" width="100%">
              <FormIcon>
                <LinearGradient colors={['#FFF3E0', '#FFE0B2']} style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="key" size={32} color="#F57C00" />
                </LinearGradient>
              </FormIcon>

              <FormTitle>Recuperar Senha</FormTitle>
              <FormSubtitle>Digite seu email e enviaremos{'\n'}instruções para redefinir sua senha</FormSubtitle>

              <InputContainer>
                <InputLabel>Email</InputLabel>
                <InputWrapper>
                  <Ionicons name="mail-outline" size={20} color={theme.placeholderColor?.val} />
                  <StyledInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seu@email.com"
                    placeholderTextColor={theme.placeholderColor?.val}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </InputWrapper>
              </InputContainer>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => {
                  if (email && email.includes('@')) {
                    Alert.alert(
                      'Email Enviado!',
                      'Verifique sua caixa de entrada e siga as instruções.',
                      [{ text: 'OK', onPress: () => setCurrentScreen('email-login') }]
                    );
                  } else {
                    Alert.alert('Atenção', 'Digite um email válido');
                  }
                }}
              >
                Enviar Link
              </Button>

              <Pressable onPress={() => setCurrentScreen('email-login')}>
                <XStack justifyContent="center" alignItems="center" gap="$2" marginTop="$4">
                  <Ionicons name="arrow-back" size={16} color={theme.placeholderColor?.val} />
                  <Text fontSize={14} color="$placeholderColor">Voltar para o login</Text>
                </XStack>
              </Pressable>
            </FormContainer>
          </ScrollView>
        </Container>
      </KeyboardAvoidingView>
    );
  }

  return null;
}
