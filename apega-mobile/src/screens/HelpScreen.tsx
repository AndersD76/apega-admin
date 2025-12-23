import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Help'>;

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    id: '1',
    question: 'Como faço para vender um produto?',
    answer: 'Para vender, vá até seu perfil e clique em "Anunciar produto". Tire fotos do item, adicione uma descrição e defina o preço. Após a aprovação, seu produto estará visível para compradores.',
  },
  {
    id: '2',
    question: 'Como funciona o frete?',
    answer: 'O frete é calculado automaticamente com base no CEP do comprador. Você pode gerar a etiqueta de envio diretamente pelo app e despachar o produto nos Correios ou transportadora parceira.',
  },
  {
    id: '3',
    question: 'Quando recebo o pagamento pela venda?',
    answer: 'O pagamento é liberado após o comprador confirmar o recebimento do produto ou automaticamente após 14 dias da entrega confirmada pelos Correios.',
  },
  {
    id: '4',
    question: 'Como funciona o cashback?',
    answer: 'Você ganha 5% de cashback em todas as compras realizadas no app. O valor fica disponível na sua carteira e pode ser usado em compras futuras ou sacado.',
  },
  {
    id: '5',
    question: 'Posso devolver um produto?',
    answer: 'Sim, você tem até 7 dias após o recebimento para solicitar a devolução se o produto não corresponder à descrição ou apresentar defeitos não informados.',
  },
];

export default function HelpScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 768;
  const isTablet = isWeb && width > 480 && width <= 768;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openWhatsApp = () => {
    const phoneNumber = '5554999648368';
    const message = 'Olá! Preciso de ajuda com o app Apega Desapega.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(
            'WhatsApp não encontrado',
            'Instale o WhatsApp para entrar em contato conosco.',
            [{ text: 'OK' }]
          );
        }
      })
      .catch(() => {
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
      });
  };

  const renderFAQItem = (faq: FAQ) => (
    <TouchableOpacity
      key={faq.id}
      style={[
        styles.faqItem,
        isDesktop && { padding: SPACING.lg }
      ]}
      onPress={() => toggleExpand(faq.id)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={[
          styles.faqQuestion,
          isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }
        ]}>{faq.question}</Text>
        <Ionicons
          name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
          size={isDesktop ? 24 : 20}
          color={COLORS.textSecondary}
        />
      </View>
      {expandedId === faq.id && (
        <Text style={[
          styles.faqAnswer,
          isDesktop && { fontSize: TYPOGRAPHY.sizes.base, lineHeight: 26 }
        ]}>{faq.answer}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajuda e Suporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: isDesktop ? 60 : isTablet ? 40 : SPACING.md,
            maxWidth: isDesktop ? 800 : isTablet ? 600 : '100%',
          }
        ]}
      >
        {/* Contact Options */}
        <View style={styles.contactSection}>
          <Text style={[
            styles.sectionTitle,
            isDesktop && { fontSize: TYPOGRAPHY.sizes.base }
          ]}>fale conosco</Text>
          <TouchableOpacity style={[
            styles.whatsappCard,
            isDesktop && { padding: SPACING.lg }
          ]} onPress={openWhatsApp}>
            <View style={[
              styles.whatsappIconContainer,
              isDesktop && { width: 64, height: 64 }
            ]}>
              <Ionicons name="logo-whatsapp" size={isDesktop ? 40 : 32} color="#25D366" />
            </View>
            <View style={styles.whatsappInfo}>
              <Text style={[
                styles.whatsappTitle,
                isDesktop && { fontSize: TYPOGRAPHY.sizes.xl }
              ]}>WhatsApp</Text>
              <Text style={[
                styles.whatsappNumber,
                isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }
              ]}>(54) 99964-8368</Text>
              <Text style={[
                styles.whatsappHint,
                isDesktop && { fontSize: TYPOGRAPHY.sizes.sm }
              ]}>Toque para abrir</Text>
            </View>
            <Ionicons name="chevron-forward" size={isDesktop ? 28 : 24} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={[
            styles.sectionTitle,
            isDesktop && { fontSize: TYPOGRAPHY.sizes.base }
          ]}>perguntas frequentes</Text>
          {FAQS.map(renderFAQItem)}
        </View>

        {/* Quick Links */}
        <View style={[
          styles.linksSection,
          isDesktop && { padding: SPACING.lg }
        ]}>
          <Text style={[
            styles.sectionTitle,
            isDesktop && { fontSize: TYPOGRAPHY.sizes.base }
          ]}>links úteis</Text>

          <TouchableOpacity style={[
            styles.linkItem,
            isDesktop && { paddingVertical: SPACING.lg }
          ]}>
            <Ionicons name="book-outline" size={isDesktop ? 24 : 20} color={COLORS.textSecondary} />
            <Text style={[
              styles.linkText,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }
            ]}>guia do vendedor</Text>
            <Ionicons name="chevron-forward" size={isDesktop ? 24 : 20} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[
            styles.linkItem,
            isDesktop && { paddingVertical: SPACING.lg }
          ]}>
            <Ionicons name="shield-outline" size={isDesktop ? 24 : 20} color={COLORS.textSecondary} />
            <Text style={[
              styles.linkText,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }
            ]}>política de segurança</Text>
            <Ionicons name="chevron-forward" size={isDesktop ? 24 : 20} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[
            styles.linkItem,
            isDesktop && { paddingVertical: SPACING.lg }
          ]}>
            <Ionicons name="return-down-back-outline" size={isDesktop ? 24 : 20} color={COLORS.textSecondary} />
            <Text style={[
              styles.linkText,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }
            ]}>política de devolução</Text>
            <Ionicons name="chevron-forward" size={isDesktop ? 24 : 20} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[
            styles.linkItem,
            isDesktop && { paddingVertical: SPACING.lg }
          ]}>
            <Ionicons name="help-circle-outline" size={isDesktop ? 24 : 20} color={COLORS.textSecondary} />
            <Text style={[
              styles.linkText,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }
            ]}>central de ajuda completa</Text>
            <Ionicons name="chevron-forward" size={isDesktop ? 24 : 20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    padding: SPACING.md,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  contactSection: {
    marginBottom: SPACING.lg,
  },
  whatsappCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  whatsappIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#E8F5E9',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  whatsappInfo: {
    flex: 1,
  },
  whatsappTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  whatsappNumber: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: '#25D366',
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginTop: 2,
  },
  whatsappHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  faqSection: {
    marginBottom: SPACING.lg,
  },
  faqItem: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.xs,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  faqAnswer: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    lineHeight: 22,
  },
  linksSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.xs,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  linkText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
});
