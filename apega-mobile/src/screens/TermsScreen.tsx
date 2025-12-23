import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 768;
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, FEES, BRAND } from '../constants/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Terms'>;

interface Section {
  id: string;
  title: string;
  icon: string;
  content: string;
}

const LEGAL_SECTIONS: Section[] = [
  {
    id: 'terms',
    title: 'Termos de Uso',
    icon: 'document-text',
    content: `TERMOS DE USO - APEGA DESAPEGA

Última atualização: Dezembro de 2024

1. ACEITAÇÀO DOS TERMOS
Ao acessar e usar o aplicativo Apega Desapega, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá usar nossos serviços.

2. DESCRIÇÀO DO SERVIÇO
O Apega Desapega é uma plataforma de marketplace para compra e venda de roupas, acessórios e artigos de moda circular. Conectamos vendedoras independentes a compradores interessados em moda sustentável.

3. CADASTRO E CONTA
- Você deve ter pelo menos 18 anos para criar uma conta
- As informações fornecidas devem ser verdadeiras e atualizadas
- Você é responsável por manter a confidencialidade de sua senha
- Uma pessoa pode ter apenas uma conta ativa

4. RESPONSABILIDADES DO VENDEDOR
- Descrever os produtos de forma precisa e honesta
- Fornecer fotos reais e atuais dos itens
- Informar quaisquer defeitos ou imperfeições
- Enviar os produtos dentro do prazo estipulado
- Embalar adequadamente os produtos

5. RESPONSABILIDADES DO COMPRADOR
- Ler atentamente as descrições antes de comprar
- Efetuar o pagamento de forma correta
- Informar endereço de entrega válido
- Confirmar o recebimento do produto

6. PROIBIÇÕES
É proibido anunciar:
- Produtos falsificados ou réplicas
- Itens roubados ou de origem ilícita
- Produtos que violem direitos autorais
- Itens que não sejam de vestuário/acessórios
- Conteúdo ofensivo ou inadequado

7. PAGAMENTOS
Todos os pagamentos são processados através de nossa plataforma segura. O valor só é liberado ao vendedor após a confirmação de entrega.

8. LIMITAÇÀO DE RESPONSABILIDADE
O Apega Desapega atua como intermediário entre compradores e vendedores. Não nos responsabilizamos pela qualidade dos produtos vendidos por terceiros.

9. MODIFICAÇÕES
Reservamos o direito de modificar estes termos a qualquer momento. Usuários serão notificados sobre mudanças significativas.

10. CONTATO
${BRAND.email}
${BRAND.phone}
${BRAND.address}, ${BRAND.city}`,
  },
  {
    id: 'privacy',
    title: 'Política de Privacidade',
    icon: 'shield-checkmark',
    content: `POLÍTICA DE PRIVACIDADE - APEGA DESAPEGA

Última atualização: Dezembro de 2024

1. COLETA DE DADOS
Coletamos os seguintes dados pessoais:
- Nome completo
- E-mail
- Telefone
- Endereço de entrega
- CPF (para vendedores)
- Dados de pagamento (processados por terceiros)

2. USO DOS DADOS
Utilizamos seus dados para:
- Processar compras e vendas
- Comunicação sobre pedidos
- Melhorar nossos serviços
- Enviar notificações importantes
- Prevenir fraudes

3. COMPARTILHAMENTO
Seus dados podem ser compartilhados com:
- Processadores de pagamento
- Transportadoras (apenas dados de entrega)
- Autoridades (quando exigido por lei)

Não vendemos seus dados pessoais a terceiros.

4. ARMAZENAMENTO
Seus dados são armazenados em servidores seguros com criptografia. Mantemos seus dados pelo tempo necessário para fornecer os serviços.

5. SEUS DIREITOS (LGPD)
Você tem direito a:
- Acessar seus dados pessoais
- Corrigir dados incorretos
- Solicitar exclusão de dados
- Revogar consentimento
- Portabilidade dos dados

6. SEGURANÇA
Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição.

7. COOKIES
Utilizamos cookies para melhorar sua experiência. Consulte nossa Política de Cookies para mais detalhes.

8. MENORES DE IDADE
Nossos serviços não são destinados a menores de 18 anos. Não coletamos intencionalmente dados de menores.

9. ALTERAÇÕES
Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas.

10. CONTATO DO DPO
Para questões sobre privacidade:
${BRAND.email}`,
  },
  {
    id: 'cookies',
    title: 'Política de Cookies',
    icon: 'information-circle',
    content: `POLÍTICA DE COOKIES - APEGA DESAPEGA

1. O QUE SÀO COOKIES?
Cookies são pequenos arquivos de texto armazenados em seu dispositivo quando você acessa nosso aplicativo. Eles nos ajudam a melhorar sua experiência.

2. TIPOS DE COOKIES QUE UTILIZAMOS

Cookies Essenciais:
- Autenticação e login
- Segurança da sessão
- Preferências básicas
Estes são necessários para o funcionamento do app.

Cookies de Desempenho:
- Análise de uso
- Identificação de erros
- Métricas de navegação
Nos ajudam a melhorar o aplicativo.

Cookies de Funcionalidade:
- Preferências salvas
- Histórico de navegação
- Produtos visualizados
Personalizam sua experiência.

3. COMO GERENCIAR COOKIES
Você pode gerenciar cookies através das configurações do seu dispositivo. Note que desativar cookies essenciais pode afetar o funcionamento do app.

4. COOKIES DE TERCEIROS
Utilizamos serviços de terceiros que podem definir seus próprios cookies:
- Google Analytics (análise)
- Serviços de pagamento
- Redes sociais (compartilhamento)

5. PERÍODO DE RETENÇÀO
- Cookies de sessão: até você fechar o app
- Cookies persistentes: até 12 meses

6. ATUALIZAÇÕES
Esta política pode ser atualizada. Verifique periodicamente para mudanças.`,
  },
  {
    id: 'community',
    title: 'Regras da Comunidade',
    icon: 'people',
    content: `REGRAS DA COMUNIDADE - APEGA DESAPEGA

Nossa comunidade é baseada em respeito, honestidade e sustentabilidade. Siga estas diretrizes:

1. RESPEITO MÚTUO
- Trate todos com cordialidade
- Não use linguagem ofensiva
- Respeite a diversidade
- Evite discussões desnecessárias

2. HONESTIDADE NAS TRANSAÇÕES
- Descreva produtos com precisão
- Use fotos reais e atuais
- Informe defeitos claramente
- Não inflacione preços artificialmente

3. COMUNICAÇÀO ADEQUADA
- Responda mensagens em até 24h
- Seja clara e objetiva
- Mantenha conversas no app
- Não compartilhe dados pessoais publicamente

4. FOTOS E DESCRIÇÕES
- Use fotos de boa qualidade
- Mostre o produto de diferentes ângulos
- Inclua medidas quando relevante
- Seja específica sobre condição

5. PREÇOS JUSTOS
- Pesquise preços de mercado
- Considere condição do item
- Seja razoável nas negociações

6. PROIBIÇÕES
Não é permitido:
- Produtos falsificados
- Linguagem discriminatória
- Spam ou publicidade externa
- Informações falsas
- Assédio a outros usuários

7. CONSEQUÊNCIAS
Violações podem resultar em:
- Aviso formal
- Suspensão temporária
- Banimento permanente
- Ações legais (casos graves)

8. DENÚNCIAS
Encontrou algo irregular? Use o botão "Denunciar" ou entre em contato conosco.`,
  },
  {
    id: 'returns',
    title: 'Política de Devolução',
    icon: 'return-down-back',
    content: `POLÍTICA DE DEVOLUÇÀO - APEGA DESAPEGA

1. PRAZO PARA DEVOLUÇÀO
Você tem até 7 (sete) dias corridos após o recebimento para solicitar devolução, conforme o Código de Defesa do Consumidor.

2. MOTIVOS ACEITOS
A devolução é aceita quando:
- Produto diferente do anunciado
- Defeitos não informados
- Tamanho incorreto (erro do vendedor)
- Produto danificado no transporte
- Falsificação comprovada

3. MOTIVOS NÀO ACEITOS
Não aceitamos devolução por:
- Arrependimento após prazo legal
- Defeitos já informados no anúncio
- Mau uso pelo comprador
- Produto usado após recebimento

4. COMO SOLICITAR
1. Acesse "Meus Pedidos"
2. Selecione o pedido
3. Clique em "Solicitar Devolução"
4. Descreva o motivo
5. Anexe fotos (se necessário)
6. Aguarde análise

5. PROCESSO DE ANÁLISE
Nossa equipe analisará em até 3 dias úteis. Podemos solicitar informações adicionais.

6. ENVIO DE VOLTA
Se aprovado:
- Você receberá etiqueta de envio
- Embale adequadamente o produto
- Envie no prazo indicado
- Mantenha comprovante de postagem

7. REEMBOLSO
Após recebermos e conferirmos o produto:
- Reembolso em até 10 dias úteis
- Mesmo meio de pagamento original
- Frete de envio não é reembolsado (arrependimento)
- Frete reembolsado (erro do vendedor)

8. PRODUTOS NÀO DEVOLVIDOS
Se você não enviar no prazo, a solicitação será cancelada.

9. DISPUTAS
Não resolveu? Abra uma disputa e nossa equipe mediará a situação.`,
  },
  {
    id: 'fees',
    title: 'Taxas e Comissões',
    icon: 'cash',
    content: `TAXAS E COMISSÕES - APEGA DESAPEGA

1. COMISSÀO POR VENDA
Taxa padrão: ${FEES.commissionPercentage}% sobre o valor da venda
Comissão mínima: R$ ${FEES.minCommission.toFixed(2)}

A comissão é descontada automaticamente quando o pagamento é liberado para o vendedor.

2. ASSINATURA PREMIUM
Valor: R$ 49,90/mês ou R$ 499,90/ano

Benefícios Premium:
- Taxa reduzida: apenas ${FEES.premiumCommissionPercentage}%
- Anúncios ilimitados
- Até 10 fotos por anúncio
- Destaque nos resultados
- Badge Premium no perfil
- Suporte prioritário
- Estatísticas avançadas

3. EXEMPLO DE CÁLCULO

Venda de R$ 100,00:
- Usuário comum: R$ 100 - R$ 10 = R$ 90,00
- Usuário Premium: R$ 100 - R$ 1 = R$ 99,00

4. QUANDO A COMISSÀO É COBRADA
A comissão só é cobrada quando:
- A venda é confirmada
- O produto é entregue
- O pagamento é liberado

Não cobramos por:
- Anunciar produtos
- Cancelamentos
- Devoluções aceitas

5. FORMAS DE RECEBIMENTO
- Transferência bancária (sem taxa)
- PIX (sem taxa)
- Saque mínimo: R$ 20,00

6. PRAZO DE LIBERAÇÀO
O valor fica disponível após:
- Confirmação de recebimento pelo comprador
- Ou 14 dias após entrega confirmada pelos Correios

7. ALTERAÇÕES
Nos reservamos o direito de alterar as taxas, com aviso prévio de 30 dias aos usuários.`,
  },
];

export default function TermsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderSection = (section: Section) => (
    <View key={section.id} style={styles.sectionContainer}>
      <TouchableOpacity
        style={[
          styles.sectionCard,
          expandedId === section.id && styles.sectionCardExpanded,
        ]}
        onPress={() => toggleSection(section.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name={section.icon as any} size={24} color={COLORS.primary} />
          </View>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionHint}>
              {expandedId === section.id ? 'toque para fechar' : 'toque para expandir'}
            </Text>
          </View>
          <Ionicons
            name={expandedId === section.id ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textTertiary}
          />
        </View>
      </TouchableOpacity>

      {expandedId === section.id && (
        <View style={styles.contentContainer}>
          <Text style={styles.contentText}>{section.content}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>termos e privacidade</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        {/* Intro */}
        <View style={styles.introCard}>
          <Ionicons name="document-text" size={40} color={COLORS.primary} />
          <Text style={styles.introTitle}>documentos legais</Text>
          <Text style={styles.introText}>
            Conheça nossos termos, políticas e diretrizes que regem o uso da plataforma Apega Desapega.
          </Text>
        </View>

        {/* Commission Highlight Card */}
        <View style={styles.commissionHighlight}>
          <View style={styles.commissionHeader}>
            <Ionicons name="cash" size={28} color={COLORS.warning} />
            <Text style={styles.commissionTitle}>Resumo das Taxas</Text>
          </View>
          <View style={styles.commissionDetails}>
            <View style={styles.commissionItem}>
              <Text style={styles.commissionLabel}>Comissão por venda</Text>
              <Text style={styles.commissionValue}>{FEES.commissionPercentage}%</Text>
            </View>
            <View style={styles.commissionItem}>
              <Text style={styles.commissionLabel}>Comissão mínima</Text>
              <Text style={styles.commissionValue}>R$ {FEES.minCommission.toFixed(2)}</Text>
            </View>
            <View style={styles.commissionItem}>
              <Text style={styles.commissionLabel}>Assinantes Premium</Text>
              <Text style={[styles.commissionValue, { color: COLORS.primary }]}>{FEES.premiumCommissionPercentage}%</Text>
            </View>
          </View>
          <Text style={styles.commissionNote}>
            A comissão é descontada automaticamente do valor da venda quando o pagamento é liberado para você.
          </Text>
        </View>

        {/* Sections */}
        {LEGAL_SECTIONS.map(renderSection)}

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>última atualização: dezembro de 2024</Text>
          <Text style={styles.versionText}>versão dos termos: 1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isDesktop ? 60 : SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  content: {
    padding: SPACING.md,
    paddingHorizontal: isDesktop ? 60 : SPACING.md,
    maxWidth: isDesktop ? 700 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  introCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.xs,
  },
  introTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  commissionHighlight: {
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  commissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  commissionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  commissionDetails: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  commissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  commissionLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  commissionValue: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  commissionNote: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionContainer: {
    marginBottom: SPACING.sm,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.xs,
  },
  sectionCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  contentContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    borderBottomLeftRadius: BORDER_RADIUS.md,
    borderBottomRightRadius: BORDER_RADIUS.md,
    ...SHADOWS.xs,
  },
  contentText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  versionText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
});
