import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const PREMIUM_BENEFITS = [
  {
    icon: 'infinite-outline',
    title: 'Anúncios ilimitados',
    description: 'Sem limite de produtos ativos',
    free: '5 produtos',
    premium: 'Ilimitado',
  },
  {
    icon: 'sparkles-outline',
    title: 'IA para fotos',
    description: 'Melhoria automática de imagens',
    free: false,
    premium: true,
  },
  {
    icon: 'pricetag-outline',
    title: 'Sugestão de preço',
    description: 'IA sugere o melhor preço',
    free: false,
    premium: true,
  },
  {
    icon: 'star-outline',
    title: 'Destaque nos resultados',
    description: 'Apareça primeiro nas buscas',
    free: false,
    premium: true,
  },
  {
    icon: 'cut-outline',
    title: 'Remoção de fundo',
    description: 'Fotos profissionais em 1 clique',
    free: false,
    premium: true,
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Suporte prioritário',
    description: 'Atendimento em até 2h',
    free: false,
    premium: true,
  },
  {
    icon: 'cash-outline',
    title: 'Taxa reduzida',
    description: 'Apenas 10% sobre vendas',
    free: '20%',
    premium: '10%',
  },
];

const PLANS = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 19.90,
    period: '/mês',
    popular: false,
  },
  {
    id: 'yearly',
    name: 'Anual',
    price: 14.90,
    originalPrice: 19.90,
    period: '/mês',
    totalPrice: 178.80,
    savings: 'Economize R$ 60/ano',
    popular: true,
  },
];

export function PremiumScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [loading, setLoading] = useState(false);

  const isPremium = user?.subscription_type === 'premium' || user?.subscription_type === 'premium_plus';

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login necessário',
        'Faça login para assinar o Premium',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Entrar', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    setLoading(true);

    // Simular processo de checkout
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Em breve!',
        'O pagamento via app estará disponível em breve.\n\nPor enquanto, entre em contato conosco para ativar seu Premium:\n\nWhatsApp: (54) 99999-9999\nEmail: premium@largo.com.br',
        [
          { text: 'OK' },
          {
            text: 'WhatsApp',
            onPress: () => {
              // Linking.openURL('https://wa.me/5554999999999?text=Quero%20assinar%20o%20Premium');
            },
          },
        ]
      );
    }, 1000);
  };

  if (isPremium) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>Premium</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.alreadyPremium}>
          <View style={styles.premiumBadgeLarge}>
            <Ionicons name="star" size={48} color="#F59E0B" />
          </View>
          <Text style={styles.alreadyPremiumTitle}>Você é Premium!</Text>
          <Text style={styles.alreadyPremiumText}>
            Aproveite todos os recursos exclusivos do Largô Premium
          </Text>

          <View style={styles.premiumStatusCard}>
            <View style={styles.premiumStatusRow}>
              <Text style={styles.premiumStatusLabel}>Status</Text>
              <View style={styles.premiumStatusBadge}>
                <Text style={styles.premiumStatusBadgeText}>Ativo</Text>
              </View>
            </View>
            {(user as any)?.subscription_expires_at && (
              <View style={styles.premiumStatusRow}>
                <Text style={styles.premiumStatusLabel}>Válido até</Text>
                <Text style={styles.premiumStatusValue}>
                  {new Date((user as any).subscription_expires_at).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            )}
          </View>

          <Pressable style={styles.managePlanBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.managePlanBtnText}>Voltar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#F59E0B', '#EAB308']}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="star" size={40} color="#F59E0B" />
          </View>
          <Text style={styles.heroTitle}>Largô Premium</Text>
          <Text style={styles.heroSubtitle}>
            Desbloqueie recursos exclusivos e venda mais!
          </Text>
        </LinearGradient>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>O que você ganha</Text>

          {PREMIUM_BENEFITS.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name={benefit.icon as any} size={24} color={colors.primary} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDesc}>{benefit.description}</Text>
              </View>
              <Ionicons name="checkmark" size={24} color={colors.primary} />
            </View>
          ))}
        </View>

        {/* Comparison Section */}
        <View style={styles.comparisonSection}>
          <Text style={styles.sectionTitle}>Comparação de planos</Text>

          <View style={styles.comparisonTable}>
            <View style={styles.comparisonHeader}>
              <Text style={styles.comparisonHeaderText}>Recurso</Text>
              <Text style={styles.comparisonHeaderText}>Grátis</Text>
              <Text style={[styles.comparisonHeaderText, styles.comparisonHeaderPremium]}>Premium</Text>
            </View>

            {PREMIUM_BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.comparisonRow}>
                <Text style={styles.comparisonFeature} numberOfLines={1}>{benefit.title}</Text>
                <View style={styles.comparisonCell}>
                  {typeof benefit.free === 'string' ? (
                    <Text style={styles.comparisonValue}>{benefit.free}</Text>
                  ) : benefit.free ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  ) : (
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  )}
                </View>
                <View style={[styles.comparisonCell, styles.comparisonCellPremium]}>
                  {typeof benefit.premium === 'string' ? (
                    <Text style={[styles.comparisonValue, styles.comparisonValuePremium]}>{benefit.premium}</Text>
                  ) : (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Plans Section */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Escolha seu plano</Text>

          <View style={styles.plansGrid}>
            {PLANS.map((plan) => (
              <Pressable
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.planCardActive,
                  plan.popular && styles.planCardPopular,
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Mais popular</Text>
                  </View>
                )}
                <View style={styles.planRadio}>
                  {selectedPlan === plan.id && <View style={styles.planRadioInner} />}
                </View>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.planPriceRow}>
                  {plan.originalPrice && (
                    <Text style={styles.planOriginalPrice}>R$ {plan.originalPrice.toFixed(2)}</Text>
                  )}
                  <Text style={styles.planPrice}>R$ {plan.price.toFixed(2)}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
                {plan.savings && <Text style={styles.planSavings}>{plan.savings}</Text>}
                {plan.totalPrice && (
                  <Text style={styles.planTotal}>Total: R$ {plan.totalPrice.toFixed(2)}/ano</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Subscribe Button */}
        <Pressable onPress={handleSubscribe} disabled={loading}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.subscribeBtn}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="star" size={20} color="#fff" />
                <Text style={styles.subscribeBtnText}>Assinar Premium</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        {/* Guarantee */}
        <View style={styles.guaranteeSection}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <Text style={styles.guaranteeText}>
            Garantia de 7 dias. Cancele quando quiser.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { paddingHorizontal: 16 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },

  // Hero
  heroSection: { borderRadius: 20, padding: 32, alignItems: 'center', marginBottom: 24 },
  heroIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: '#fff', opacity: 0.9, textAlign: 'center' },

  // Section
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },

  // Benefits
  benefitsSection: { marginBottom: 32 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  benefitIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  benefitContent: { flex: 1 },
  benefitTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  benefitDesc: { fontSize: 13, color: '#737373' },

  // Comparison
  comparisonSection: { marginBottom: 32 },
  comparisonTable: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E8E8E8' },
  comparisonHeader: { flexDirection: 'row', backgroundColor: '#F5F5F5', paddingVertical: 12, paddingHorizontal: 16 },
  comparisonHeaderText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#737373', textAlign: 'center' },
  comparisonHeaderPremium: { color: colors.primary },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  comparisonFeature: { flex: 1.2, fontSize: 13, color: '#1A1A1A' },
  comparisonCell: { flex: 0.8, alignItems: 'center' },
  comparisonCellPremium: { backgroundColor: colors.primaryMuted, marginVertical: -14, paddingVertical: 14, marginRight: -16, paddingRight: 16 },
  comparisonValue: { fontSize: 12, color: '#737373', fontWeight: '500' },
  comparisonValuePremium: { color: colors.primary, fontWeight: '600' },

  // Plans
  plansSection: { marginBottom: 24 },
  plansGrid: { flexDirection: 'row', gap: 12 },
  planCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#E8E8E8', position: 'relative' },
  planCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  planCardPopular: {},
  popularBadge: { position: 'absolute', top: -10, left: '50%', transform: [{ translateX: -45 }], backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  popularBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  planRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D4D4D4', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  planRadioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  planName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 4 },
  planOriginalPrice: { fontSize: 14, color: '#A3A3A3', textDecorationLine: 'line-through' },
  planPrice: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  planPeriod: { fontSize: 14, color: '#737373' },
  planSavings: { fontSize: 12, color: '#10B981', fontWeight: '500', marginTop: 4 },
  planTotal: { fontSize: 11, color: '#737373', marginTop: 4 },

  // Subscribe
  subscribeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16 },
  subscribeBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },

  // Guarantee
  guaranteeSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  guaranteeText: { fontSize: 13, color: '#737373' },

  // Already Premium
  alreadyPremium: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  premiumBadgeLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  alreadyPremiumTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  alreadyPremiumText: { fontSize: 15, color: '#737373', textAlign: 'center', marginBottom: 32 },
  premiumStatusCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E8E8E8', marginBottom: 24 },
  premiumStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  premiumStatusLabel: { fontSize: 14, color: '#737373' },
  premiumStatusValue: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  premiumStatusBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  premiumStatusBadgeText: { fontSize: 13, fontWeight: '600', color: '#10B981' },
  managePlanBtn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28 },
  managePlanBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default PremiumScreen;
