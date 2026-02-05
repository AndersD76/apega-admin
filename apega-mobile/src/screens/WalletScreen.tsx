import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';
import api from '../api/config';
import { colors } from '../theme';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  order_number?: string;
  created_at: string;
}

export function WalletScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const { user } = auth || {};

  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const response = await api.get('/payments/my-wallet');
      if (response.data.success) {
        setBalance(response.data.balance);
        setPendingBalance(response.data.pending_balance);
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Erro ao buscar carteira:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, [fetchWallet])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchWallet();
  };

  const handleWithdraw = async () => {
    if (balance < 20) {
      const msg = 'O valor mínimo para saque é R$ 20,00';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Saldo insuficiente', msg);
      return;
    }

    const confirmWithdraw = async () => {
      setWithdrawing(true);
      try {
        const response = await api.post('/payments/withdraw', { amount: balance });
        if (response.data.success) {
          const msg = response.data.message;
          Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sucesso', msg);
          fetchWallet();
        }
      } catch (error: any) {
        const msg = error?.response?.data?.message || 'Erro ao solicitar saque';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Erro', msg);
      } finally {
        setWithdrawing(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Deseja solicitar o saque de R$ ${formatPrice(balance)}?`)) {
        await confirmWithdraw();
      }
    } else {
      Alert.alert('Solicitar Saque', `Deseja solicitar o saque de R$ ${formatPrice(balance)}?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: confirmWithdraw },
      ]);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const getTransactionDescription = (tx: Transaction) => {
    if (tx.type === 'withdrawal') return 'Saque';
    if (tx.type === 'sale') return `Venda #${tx.order_number || ''}`;
    if (tx.type === 'refund') return 'Reembolso';
    return tx.description || 'Transação';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'Pendente', color: '#F59E0B' };
      case 'approved': return { text: 'Aprovado', color: '#10B981' };
      case 'rejected': return { text: 'Rejeitado', color: '#EF4444' };
      case 'completed': return { text: 'Concluído', color: '#10B981' };
      default: return { text: status, color: '#737373' };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>Carteira</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
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
        <Text style={styles.headerTitle}>Carteira</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Balance Card */}
        <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponível</Text>
          <Text style={styles.balanceValue}>R$ {formatPrice(balance)}</Text>
          {pendingBalance > 0 && (
            <Text style={styles.pendingLabel}>+ R$ {formatPrice(pendingBalance)} em liberação</Text>
          )}
          <Pressable
            style={[styles.withdrawBtn, withdrawing && styles.withdrawBtnDisabled]}
            onPress={handleWithdraw}
            disabled={withdrawing}
          >
            {withdrawing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="wallet-outline" size={18} color={colors.primary} />
                <Text style={styles.withdrawBtnText}>Solicitar Saque</Text>
              </>
            )}
          </Pressable>
        </LinearGradient>

        {/* Info Cards */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={styles.infoTitle}>Prazo de liberação</Text>
            <Text style={styles.infoText}>O saldo é liberado 7 dias após a entrega confirmada</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="cash-outline" size={24} color={colors.primary} />
            <Text style={styles.infoTitle}>Valor mínimo</Text>
            <Text style={styles.infoText}>O valor mínimo para saque é de R$ 20,00</Text>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#E8E8E8" />
              <Text style={styles.emptyTitle}>Nenhuma transação</Text>
              <Text style={styles.emptyText}>Suas transações aparecerão aqui</Text>
            </View>
          ) : (
            transactions.map((tx: Transaction) => {
              const isCredit = tx.type === 'sale' || tx.type === 'refund';
              const statusBadge = getStatusBadge(tx.status);
              return (
                <View key={tx.id} style={styles.transactionItem}>
                  <View style={[styles.txIcon, { backgroundColor: isCredit ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Ionicons
                      name={isCredit ? 'arrow-down' : 'arrow-up'}
                      size={20}
                      color={isCredit ? '#10B981' : '#EF4444'}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{getTransactionDescription(tx)}</Text>
                    <View style={styles.txMeta}>
                      <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '20' }]}>
                        <Text style={[styles.statusText, { color: statusBadge.color }]}>{statusBadge.text}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.txAmount, { color: isCredit ? '#10B981' : '#EF4444' }]}>
                    {isCredit ? '+' : '-'} R$ {formatPrice(tx.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },

  // Balance Card
  balanceCard: { margin: 16, borderRadius: 20, padding: 24, alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  balanceValue: { fontSize: 36, fontWeight: '700', color: '#fff', marginBottom: 8 },
  pendingLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  withdrawBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, minWidth: 160, justifyContent: 'center' },
  withdrawBtnDisabled: { opacity: 0.7 },
  withdrawBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },

  // Info Cards
  infoCards: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  infoCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center' },
  infoTitle: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginTop: 8, textAlign: 'center' },
  infoText: { fontSize: 11, color: '#737373', marginTop: 4, textAlign: 'center', lineHeight: 16 },

  // Section
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#737373', marginTop: 4 },

  // Transaction
  transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, marginLeft: 12 },
  txTitle: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  txDate: { fontSize: 12, color: '#A3A3A3' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '600' },
  txAmount: { fontSize: 15, fontWeight: '600' },
});

export default WalletScreen;
