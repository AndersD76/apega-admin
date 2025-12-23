import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, FEES } from '../constants/theme';
import { Button } from '../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Balance'>;

interface Transaction {
  id: string;
  type: 'sale' | 'cashback' | 'withdraw';
  description: string;
  amount: number;
  date: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [];

export default function BalanceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 768;
  const isTablet = isWeb && width > 480 && width <= 768;

  // Dados serão carregados da API
  const balance = 0;
  const cashback = 0;
  const pending = 0;

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'sale': return 'arrow-down-circle';
      case 'cashback': return 'gift';
      case 'withdraw': return 'arrow-up-circle';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'sale': return COLORS.success;
      case 'cashback': return COLORS.primary;
      case 'withdraw': return COLORS.error;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saldo e Cashback</Text>
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
        {/* Balance Card */}
        <View style={[
          styles.balanceCard,
          isDesktop && { padding: SPACING.xl }
        ]}>
          <Text style={styles.balanceLabel}>saldo disponível</Text>
          <Text style={[
            styles.balanceAmount,
            isDesktop && { fontSize: 48 }
          ]}>R$ {balance.toFixed(2)}</Text>

          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>cashback acumulado</Text>
              <Text style={[
                styles.balanceItemValue,
                isDesktop && { fontSize: TYPOGRAPHY.sizes.xl }
              ]}>R$ {cashback.toFixed(2)}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>a liberar</Text>
              <Text style={[
                styles.balanceItemValue,
                isDesktop && { fontSize: TYPOGRAPHY.sizes.xl }
              ]}>R$ {pending.toFixed(2)}</Text>
            </View>
          </View>

          <Button
            label="sacar"
            variant="secondary"
            onPress={() => console.log('Withdraw')}
            fullWidth
            style={{ marginTop: SPACING.md, backgroundColor: 'rgba(255,255,255,0.2)' }}
          />
        </View>

        {/* Commission Info */}
        <View style={[
          styles.commissionCard,
          isDesktop && { padding: SPACING.lg }
        ]}>
          <View style={styles.commissionHeader}>
            <Ionicons name="calculator" size={isDesktop ? 28 : 24} color={COLORS.textPrimary} />
            <Text style={[
              styles.commissionTitle,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }
            ]}>taxas de venda</Text>
          </View>
          <View style={styles.commissionRow}>
            <Text style={[
              styles.commissionLabel,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.base }
            ]}>comissão por venda</Text>
            <Text style={[
              styles.commissionValue,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }
            ]}>{FEES.commissionPercentage}%</Text>
          </View>
          <View style={styles.commissionRow}>
            <Text style={[
              styles.commissionLabel,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.base }
            ]}>assinantes premium</Text>
            <Text style={[
              styles.commissionValue,
              { color: COLORS.primary },
              isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }
            ]}>{FEES.premiumCommissionPercentage}%</Text>
          </View>
          <TouchableOpacity
            style={styles.premiumLink}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={[
              styles.premiumLinkText,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.base }
            ]}>veja os benefícios do plano premium</Text>
            <Ionicons name="chevron-forward" size={isDesktop ? 18 : 16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <View style={[
          styles.infoRow,
          isDesktop && { gap: SPACING.md }
        ]}>
          <View style={[
            styles.infoCard,
            isDesktop && { padding: SPACING.lg }
          ]}>
            <Ionicons name="gift" size={isDesktop ? 32 : 24} color={COLORS.primary} />
            <Text style={[
              styles.infoTitle,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.base }
            ]}>cashback</Text>
            <Text style={[
              styles.infoText,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.sm, lineHeight: 20 }
            ]}>ganhe 5% de volta em todas as compras</Text>
          </View>
          <View style={[
            styles.infoCard,
            isDesktop && { padding: SPACING.lg }
          ]}>
            <Ionicons name="time" size={isDesktop ? 32 : 24} color={COLORS.warning} />
            <Text style={[
              styles.infoTitle,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.base }
            ]}>liberação</Text>
            <Text style={[
              styles.infoText,
              isDesktop && { fontSize: TYPOGRAPHY.sizes.sm, lineHeight: 20 }
            ]}>saldo liberado após entrega confirmada</Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={[
          styles.section,
          isDesktop && { padding: SPACING.lg }
        ]}>
          <Text style={[
            styles.sectionTitle,
            isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }
          ]}>movimentações</Text>

          {MOCK_TRANSACTIONS.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={isDesktop ? 56 : 48} color={COLORS.textTertiary} />
              <Text style={[
                styles.emptyText,
                isDesktop && { fontSize: TYPOGRAPHY.sizes.base }
              ]}>Nenhuma movimentação ainda</Text>
            </View>
          ) : (
            MOCK_TRANSACTIONS.map(transaction => (
              <View key={transaction.id} style={[
                styles.transactionItem,
                isDesktop && { paddingVertical: SPACING.md }
              ]}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: getTransactionColor(transaction.type) + '20' },
                  isDesktop && { width: 48, height: 48, borderRadius: 24 }
                ]}>
                  <Ionicons
                    name={getTransactionIcon(transaction.type)}
                    size={isDesktop ? 24 : 20}
                    color={getTransactionColor(transaction.type)}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[
                    styles.transactionDescription,
                    isDesktop && { fontSize: TYPOGRAPHY.sizes.base }
                  ]}>{transaction.description}</Text>
                  <Text style={[
                    styles.transactionDate,
                    isDesktop && { fontSize: TYPOGRAPHY.sizes.sm }
                  ]}>{transaction.date}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.amount >= 0 ? COLORS.success : COLORS.error },
                  isDesktop && { fontSize: TYPOGRAPHY.sizes.lg }
                ]}>
                  {transaction.amount >= 0 ? '+' : ''}R$ {Math.abs(transaction.amount).toFixed(2)}
                </Text>
              </View>
            ))
          )}
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
  balanceCard: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
  },
  balanceLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    marginVertical: SPACING.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  balanceItem: {
    flex: 1,
  },
  balanceItemLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.white,
    opacity: 0.8,
  },
  balanceItemValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
    marginTop: 2,
  },
  commissionCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.xs,
  },
  commissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  commissionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  commissionRow: {
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
  premiumLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  premiumLinkText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.xs,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  transactionAmount: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
  },
});
