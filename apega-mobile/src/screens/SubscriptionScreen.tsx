import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { subscriptionsService, SubscriptionPlan } from '../api';
import { formatPrice } from '../utils/format';
import { colors } from '../theme';
import { MICROCOPY } from '../constants';

export function SubscriptionScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await subscriptionsService.getPlans();
      if (response.success) {
        setPlans(response.plans.filter(p => p.id !== 'free'));
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    setProcessing(true);
    try {
      const response = await subscriptionsService.createPixPayment(selectedPlan as 'monthly' | 'yearly');

      if (response.success) {
        Alert.alert(
          'Pagamento PIX',
          `Escaneie o QR Code ou copie o código PIX para pagar R$ ${formatPrice(response.price)}`,
          [
            { text: 'Copiar Código', onPress: () => {} },
            { text: 'OK', onPress: () => refreshUser?.() },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível processar o pagamento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const isPremium = user?.subscription_type === 'premium' || user?.subscription_type === 'premium_plus';

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.hero}>
          <Ionicons name="star" size={48} color="#fff" />
          <Text style={styles.heroTitle}>{MICROCOPY.premium.title}</Text>
          <Text style={styles.heroSubtitle}>
            Desbloqueie recursos exclusivos e venda mais!
          </Text>
        </LinearGradient>

        {/* Current Status */}
        {isPremium && (
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Você é Premium!</Text>
              <Text style={styles.statusText}>
                Sua assinatura está ativa
              </Text>
            </View>
          </View>
        )}

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>O que você ganha</Text>
          <View style={styles.featuresList}>
            {[
              { icon: 'infinite-outline', title: 'Anúncios ilimitados', desc: 'Sem limite de produtos ativos' },
              { icon: 'sparkles-outline', title: 'IA para fotos', desc: 'Melhoria automática de imagens' },
              { icon: 'pricetag-outline', title: 'Sugestão de preço', desc: 'IA sugere o melhor preço' },
              { icon: 'trending-up-outline', title: 'Destaque nos resultados', desc: 'Apareça primeiro nas buscas' },
              { icon: 'cut-outline', title: 'Remoção de fundo', desc: 'Fotos profissionais em 1 clique' },
              { icon: 'headset-outline', title: 'Suporte prioritário', desc: 'Atendimento em até 2h' },
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={22} color={colors.primary} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
                <Ionicons name="checkmark" size={20} color="#10B981" />
              </View>
            ))}
          </View>
        </View>

        {/* Plans */}
        {!isPremium && (
          <View style={styles.plansSection}>
            <Text style={styles.sectionTitle}>Escolha seu plano</Text>
            <View style={styles.plansList}>
              {plans.map((plan) => (
                <Pressable
                  key={plan.id}
                  style={[styles.planCard, selectedPlan === plan.id && styles.planCardActive]}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>Mais popular</Text>
                    </View>
                  )}
                  <View style={styles.planRadio}>
                    {selectedPlan === plan.id && <View style={styles.planRadioInner} />}
                  </View>
                  <View style={styles.planContent}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.planPriceRow}>
                      <Text style={styles.planPrice}>R$ {formatPrice(plan.price)}</Text>
                      <Text style={styles.planPeriod}>/{plan.period}</Text>
                    </View>
                    {plan.savings && (
                      <Text style={styles.planSavings}>{plan.savings}</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Subscribe Button */}
        {!isPremium && (
          <Pressable onPress={handleSubscribe} disabled={processing}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeBtn}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="star" size={20} color="#fff" />
                  <Text style={styles.subscribeBtnText}>Assinar Premium</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        )}

        {/* Terms */}
        <Text style={styles.terms}>
          Ao assinar, você concorda com nossos Termos de Uso e Política de Privacidade.
          A assinatura é renovada automaticamente. Cancele quando quiser.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },

  // Hero
  hero: { borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 16 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 12 },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 8, textAlign: 'center' },

  // Status
  statusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', borderRadius: 12, padding: 16, marginTop: 16 },
  statusIcon: { marginRight: 12 },
  statusContent: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: '600', color: '#065F46' },
  statusText: { fontSize: 13, color: '#047857', marginTop: 2 },

  // Features
  featuresSection: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  featuresList: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  featureItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  featureIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  featureDesc: { fontSize: 12, color: '#737373', marginTop: 2 },

  // Plans
  plansSection: { marginTop: 24 },
  plansList: { gap: 12 },
  planCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#E8E8E8', position: 'relative', overflow: 'hidden' },
  planCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  popularBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 8 },
  popularText: { fontSize: 10, fontWeight: '600', color: '#fff' },
  planRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D4D4D4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  planRadioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  planContent: { flex: 1 },
  planName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  planPrice: { fontSize: 24, fontWeight: '700', color: colors.primary },
  planPeriod: { fontSize: 14, color: '#737373', marginLeft: 4 },
  planSavings: { fontSize: 12, color: '#10B981', fontWeight: '500', marginTop: 4 },

  // Subscribe
  subscribeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, marginTop: 24 },
  subscribeBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },

  // Terms
  terms: { fontSize: 11, color: '#A3A3A3', textAlign: 'center', marginTop: 16, lineHeight: 16 },
});

export default SubscriptionScreen;
