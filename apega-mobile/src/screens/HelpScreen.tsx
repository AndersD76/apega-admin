import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const FAQ_ITEMS = [
  {
    question: 'Como vender uma peça?',
    answer: 'Clique no botão "Largar" na barra inferior, tire fotos da peça, preencha as informações e publique seu anúncio.',
  },
  {
    question: 'Como funciona o pagamento?',
    answer: 'Os pagamentos são processados de forma segura. O valor fica retido até a confirmação de entrega, garantindo segurança para comprador e vendedor.',
  },
  {
    question: 'Qual o prazo para receber o dinheiro?',
    answer: 'O saldo é liberado 7 dias após a confirmação de entrega pelo comprador. O valor mínimo para saque é R$ 20,00.',
  },
  {
    question: 'Como funciona o envio?',
    answer: 'Após a venda, você recebe a etiqueta de envio. Basta embalar a peça e postar nos Correios ou transportadora indicada.',
  },
  {
    question: 'Posso devolver uma compra?',
    answer: 'Sim! Você tem até 7 dias após o recebimento para solicitar devolução caso o produto não corresponda ao anunciado.',
  },
  {
    question: 'Como entrar em contato com vendedor/comprador?',
    answer: 'Use o chat dentro do app para conversar diretamente. Evite compartilhar dados pessoais fora da plataforma.',
  },
];

const HELP_OPTIONS = [
  { icon: 'chatbubbles-outline', title: 'Chat de Suporte', subtitle: 'Fale com nossa equipe', action: 'chat' },
  { icon: 'mail-outline', title: 'E-mail', subtitle: 'suporte@largo.com.br', action: 'email' },
  { icon: 'logo-whatsapp', title: 'WhatsApp', subtitle: '(11) 99999-9999', action: 'whatsapp' },
  { icon: 'document-text-outline', title: 'Termos de Uso', subtitle: 'Leia nossos termos', action: 'terms' },
  { icon: 'shield-checkmark-outline', title: 'Política de Privacidade', subtitle: 'Sua segurança importa', action: 'privacy' },
];

export function HelpScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  const handleAction = (action: string) => {
    switch (action) {
      case 'email':
        Linking.openURL('mailto:suporte@largo.com.br');
        break;
      case 'whatsapp':
        Linking.openURL('https://wa.me/5511999999999');
        break;
      case 'chat':
        // Navigate to support chat
        navigation.navigate('Messages');
        break;
      default:
        break;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Central de Ajuda</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
          {FAQ_ITEMS.map((item, idx) => (
            <Pressable
              key={idx}
              style={styles.faqItem}
              onPress={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Ionicons
                  name={expandedFaq === idx ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#737373"
                />
              </View>
              {expandedFaq === idx && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fale Conosco</Text>
          <View style={styles.optionsCard}>
            {HELP_OPTIONS.map((item, idx) => (
              <Pressable
                key={idx}
                style={[styles.optionItem, idx === HELP_OPTIONS.length - 1 && styles.optionItemLast]}
                onPress={() => handleAction(item.action)}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{item.title}</Text>
                  <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#A3A3A3" />
              </Pressable>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Largô</Text>
          <Text style={styles.appVersion}>Versão 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 Largô. Todos os direitos reservados.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },

  // Section
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },

  // FAQ
  faqItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1A1A', marginRight: 8 },
  faqAnswer: { fontSize: 13, color: '#737373', marginTop: 12, lineHeight: 20 },

  // Options
  optionsCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  optionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  optionItemLast: { borderBottomWidth: 0 },
  optionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optionContent: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  optionSubtitle: { fontSize: 12, color: '#A3A3A3', marginTop: 2 },

  // App Info
  appInfo: { alignItems: 'center', paddingVertical: 32, marginBottom: 80 },
  appName: { fontSize: 20, fontWeight: '700', color: colors.primary },
  appVersion: { fontSize: 13, color: '#A3A3A3', marginTop: 4 },
  appCopyright: { fontSize: 11, color: '#A3A3A3', marginTop: 8 },
});

export default HelpScreen;
