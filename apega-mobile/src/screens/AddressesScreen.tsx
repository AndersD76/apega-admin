import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from 'react-native';

const isWeb = Platform.OS === 'web';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button } from '../components';
import { api, loadToken } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Addresses'>;

interface Address {
  id: string;
  label: string;
  recipient_name: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  is_default: boolean;
}

export default function AddressesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 768;
  const styles = useMemo(() => createStyles(isDesktop), [isDesktop]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Carregar endereços da API
  const loadAddresses = async () => {
    try {
      await loadToken();
      const response = await api.get<{ addresses: Address[] }>('/addresses');

      if (response.success && response.addresses) {
        setAddresses(response.addresses);
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAddresses();
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/addresses/${id}/default`);
      // Atualizar lista localmente
      setAddresses(addresses.map(addr => ({
        ...addr,
        is_default: addr.id === id,
      })));
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível definir como padrão');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Remover endereço',
      'Tem certeza que deseja remover este endereço?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/addresses/${id}`);
              setAddresses(addresses.filter(addr => addr.id !== id));
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover o endereço');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (address: Address) => {
    navigation.navigate('AddAddress', { address });
  };

  const formatZipcode = (zipcode: string) => {
    const clean = zipcode.replace(/\D/g, '');
    if (clean.length === 8) {
      return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    }
    return zipcode;
  };

  const renderAddressCard = (address: Address) => (
    <View key={address.id} style={[styles.addressCard, address.is_default && styles.defaultCard]}>
      <View style={styles.addressHeader}>
        <View style={styles.labelContainer}>
          <Ionicons
            name={address.label === 'Casa' ? 'home' : address.label === 'Trabalho' ? 'business' : 'location'}
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.addressLabel}>{address.label || 'Endereço'}</Text>
          {address.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>padrão</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => handleEdit(address)}>
          <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.recipientName}>{address.recipient_name}</Text>
      <Text style={styles.addressStreet}>
        {address.street}, {address.number}
        {address.complement && ` - ${address.complement}`}
      </Text>
      <Text style={styles.addressCity}>
        {address.neighborhood} - {address.city}/{address.state}
      </Text>
      <Text style={styles.addressZip}>CEP: {formatZipcode(address.zipcode)}</Text>

      <View style={styles.addressActions}>
        {!address.is_default && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(address.id)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionText}>definir como padrão</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(address.id)}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text style={[styles.actionText, { color: COLORS.error }]}>remover</Text>
        </TouchableOpacity>
      </View>
    </View>
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
        <Text style={styles.headerTitle}>Endereços</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          {addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>Nenhum endereço</Text>
              <Text style={styles.emptyText}>
                Adicione um endereço para facilitar suas compras
              </Text>
            </View>
          ) : (
            addresses.map(renderAddressCard)
          )}

          <Button
            label="adicionar endereço"
            variant="secondary"
            icon={<Ionicons name="add" size={20} color={COLORS.primary} />}
            onPress={() => navigation.navigate('AddAddress', {})}
            fullWidth
            style={{ marginTop: SPACING.md }}
          />
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (isDesktop: boolean) => StyleSheet.create({
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
    paddingHorizontal: isDesktop ? 60 : SPACING.md,
    maxWidth: isDesktop ? 700 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  addressCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.xs,
  },
  defaultCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  addressLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.xs,
  },
  defaultBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  recipientName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  addressStreet: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  addressCity: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  addressZip: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  addressActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
