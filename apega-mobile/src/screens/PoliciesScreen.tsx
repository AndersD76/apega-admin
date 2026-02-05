import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const POLICIES: Record<string, { title: string; icon: string; sections: { title: string; content: string }[] }> = {
  terms: {
    title: 'Termos de Uso',
    icon: 'document-text-outline',
    sections: [
      {
        title: '1. Aceitação dos Termos',
        content: 'Ao acessar e usar o aplicativo Largô, você concorda com estes termos de uso. Se você não concordar com algum termo, não utilize nossos serviços.',
      },
      {
        title: '2. Cadastro e Conta',
        content: 'Para utilizar nossos serviços, você deve criar uma conta com informações verdadeiras e atualizadas. Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.',
      },
      {
        title: '3. Uso da Plataforma',
        content: 'O Largô é uma plataforma de marketplace para compra e venda de itens usados e seminovos. É proibido anunciar produtos falsificados, ilegais, roubados ou que violem direitos de terceiros.',
      },
      {
        title: '4. Responsabilidades',
        content: 'Os vendedores são responsáveis pela veracidade das informações dos produtos anunciados. Os compradores devem verificar as informações antes de confirmar a compra. A plataforma não se responsabiliza por disputas entre usuários.',
      },
      {
        title: '5. Taxas e Comissões',
        content: 'A plataforma cobra uma taxa de 20% sobre o valor das vendas para usuários gratuitos e 10% para usuários Premium. As taxas são deduzidas automaticamente do valor recebido pelo vendedor.',
      },
      {
        title: '6. Propriedade Intelectual',
        content: 'Todo o conteúdo do aplicativo, incluindo marca, logo e design, são propriedade do Largô e protegidos por leis de propriedade intelectual.',
      },
    ],
  },
  privacy: {
    title: 'Política de Privacidade',
    icon: 'lock-closed-outline',
    sections: [
      {
        title: '1. Coleta de Dados',
        content: 'Coletamos informações que você fornece diretamente, como nome, e-mail, telefone, endereço e dados de pagamento. Também coletamos dados de uso do aplicativo para melhorar nossos serviços.',
      },
      {
        title: '2. Uso das Informações',
        content: 'Utilizamos seus dados para: processar transações, enviar comunicações sobre pedidos, melhorar nossos serviços, prevenir fraudes e cumprir obrigações legais.',
      },
      {
        title: '3. Compartilhamento',
        content: 'Compartilhamos dados apenas com: parceiros de pagamento e envio para processar transações, quando exigido por lei, e com seu consentimento expresso. Nunca vendemos seus dados.',
      },
      {
        title: '4. Segurança',
        content: 'Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, incluindo criptografia, controle de acesso e monitoramento contínuo.',
      },
      {
        title: '5. Seus Direitos',
        content: 'Você tem direito a: acessar seus dados, corrigir informações incorretas, solicitar exclusão de dados, revogar consentimento e portabilidade de dados, conforme a LGPD.',
      },
      {
        title: '6. Cookies',
        content: 'Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do aplicativo e personalizar conteúdo.',
      },
    ],
  },
  shipping: {
    title: 'Política de Envio',
    icon: 'cube-outline',
    sections: [
      {
        title: '1. Opções de Envio',
        content: 'Oferecemos envio pelos Correios (PAC, SEDEX) e transportadoras parceiras. O prazo e valor do frete são calculados com base no CEP de destino e dimensões do produto.',
      },
      {
        title: '2. Prazo de Postagem',
        content: 'O vendedor tem até 3 dias úteis após a confirmação do pagamento para postar o produto. O não cumprimento pode resultar em penalidades ou cancelamento do pedido.',
      },
      {
        title: '3. Rastreamento',
        content: 'Todos os envios incluem código de rastreamento. O status pode ser acompanhado diretamente no aplicativo na seção "Meus Pedidos".',
      },
      {
        title: '4. Problemas de Entrega',
        content: 'Em caso de extravio, dano durante o transporte ou atraso significativo, entre em contato conosco. Analisaremos o caso e tomaremos as medidas cabíveis.',
      },
      {
        title: '5. Embalagem',
        content: 'O vendedor é responsável por embalar o produto de forma adequada para evitar danos durante o transporte. Recomendamos uso de caixas resistentes e material de proteção.',
      },
    ],
  },
  refund: {
    title: 'Política de Reembolso',
    icon: 'cash-outline',
    sections: [
      {
        title: '1. Direito de Arrependimento',
        content: 'Conforme o Código de Defesa do Consumidor, você pode desistir da compra em até 7 dias após o recebimento do produto, sem necessidade de justificativa.',
      },
      {
        title: '2. Condições para Reembolso',
        content: 'O produto deve ser devolvido em sua condição original, sem sinais de uso além do necessário para verificação. A embalagem original, etiquetas e acessórios devem estar inclusos.',
      },
      {
        title: '3. Processo de Reembolso',
        content: 'Após aprovação da devolução, o reembolso será processado em até 10 dias úteis. O valor será creditado na mesma forma de pagamento utilizada na compra.',
      },
      {
        title: '4. Custos de Devolução',
        content: 'Em caso de arrependimento, o comprador arca com os custos de envio da devolução. Se o produto apresentar defeito ou divergência, os custos são do vendedor.',
      },
      {
        title: '5. Reembolso Parcial',
        content: 'Podemos oferecer reembolso parcial em casos específicos, como pequenas divergências que não impeçam o uso do produto, mediante acordo entre as partes.',
      },
    ],
  },
  exchange: {
    title: 'Política de Troca e Devolução',
    icon: 'swap-horizontal-outline',
    sections: [
      {
        title: '1. Quando Solicitar Troca',
        content: 'Você pode solicitar troca quando: o produto apresentar defeito não informado, o tamanho divergir do anunciado, ou o produto recebido for diferente do anunciado.',
      },
      {
        title: '2. Prazo para Solicitação',
        content: 'A solicitação de troca ou devolução deve ser feita em até 7 dias após o recebimento do produto através da seção "Meus Pedidos" no aplicativo.',
      },
      {
        title: '3. Análise do Pedido',
        content: 'Nossa equipe analisará a solicitação em até 2 dias úteis. Podemos solicitar fotos ou informações adicionais para avaliar o caso.',
      },
      {
        title: '4. Envio do Produto',
        content: 'Após aprovação, você receberá as instruções para envio do produto. Use uma embalagem adequada para proteger o item durante o transporte.',
      },
      {
        title: '5. Produtos Não Elegíveis',
        content: 'Não aceitamos troca/devolução de: produtos de higiene pessoal, roupas íntimas, produtos personalizados, ou itens danificados pelo comprador.',
      },
      {
        title: '6. Disputa entre Usuários',
        content: 'Em caso de desacordo entre comprador e vendedor, nossa equipe de suporte mediará a situação buscando uma solução justa para ambas as partes.',
      },
    ],
  },
};

export function PoliciesScreen({ route, navigation }: any) {
  const { policyType } = route.params || { policyType: 'terms' };
  const insets = useSafeAreaInsets();
  const policy = POLICIES[policyType] || POLICIES.terms;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>{policy.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name={policy.icon as any} size={40} color={colors.primary} />
        </View>

        {/* Last Updated */}
        <Text style={styles.lastUpdated}>Última atualização: Dezembro 2024</Text>

        {/* Sections */}
        {policy.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {/* Contact */}
        <View style={styles.contactBox}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={styles.contactText}>
            Dúvidas? Entre em contato: suporte@largo.com.br
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FAFAFA' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },

  // Icon
  iconContainer: { alignItems: 'center', marginVertical: 20, width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryMuted, alignSelf: 'center', justifyContent: 'center' },

  // Updated
  lastUpdated: { fontSize: 12, color: '#A3A3A3', textAlign: 'center', marginBottom: 24 },

  // Section
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  sectionContent: { fontSize: 14, color: '#525252', lineHeight: 22 },

  // Contact
  contactBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primaryMuted, borderRadius: 12, padding: 16, marginTop: 12 },
  contactText: { flex: 1, fontSize: 13, color: colors.primary },
});

export default PoliciesScreen;
