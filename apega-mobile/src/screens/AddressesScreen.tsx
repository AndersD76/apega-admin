import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { addressesService } from '../api';
import { colors } from '../theme';

export function AddressesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  // Form state
  const [name, setName] = useState('');
  const [recipient, setRecipient] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const resetForm = () => {
    setName('');
    setRecipient('');
    setZipcode('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('');
    setState('');
    setEditingAddress(null);
  };

  const fetchAddresses = useCallback(async () => {
    try {
      const response = await addressesService.getAddresses();
      if (response.success && response.addresses) {
        setAddresses(response.addresses.map(addr => ({
          id: addr.id,
          name: addr.recipient_name || 'Endereço',
          recipient: addr.recipient_name,
          street: `${addr.street}, ${addr.number}`,
          complement: addr.complement || '',
          neighborhood: addr.neighborhood,
          city: addr.city,
          state: addr.state,
          zipcode: addr.zipcode,
          isDefault: addr.is_default,
        })));
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleAddAddress = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setName(address.name);
    setRecipient(address.recipient);
    setZipcode(address.zipcode);
    setStreet(address.street.split(',')[0]);
    setNumber(address.street.split(',')[1]?.trim() || '');
    setComplement(address.complement);
    setNeighborhood(address.neighborhood);
    setCity(address.city);
    setState(address.state);
    setShowModal(true);
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert('Excluir endereço', 'Deseja excluir este endereço?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await addressesService.deleteAddress(id);
            setAddresses(addresses.filter(a => a.id !== id));
          } catch (error) {
            console.error('Error deleting address:', error);
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressesService.setDefault(id);
      setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
    } catch (error) {
      console.error('Error setting default:', error);
    }
  };

  const handleSaveAddress = async () => {
    if (!street || !number || !neighborhood || !city || !state || !zipcode) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const addressData = {
        recipient_name: recipient || name || 'Destinatário',
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipcode,
        is_default: editingAddress?.isDefault || addresses.length === 0,
      };

      if (editingAddress) {
        await addressesService.updateAddress(editingAddress.id, addressData);
      } else {
        await addressesService.createAddress(addressData);
      }

      await fetchAddresses();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Erro', 'Não foi possível salvar o endereço');
    }
  };

  const handleSearchZipcode = async () => {
    if (zipcode.length < 8) return;

    try {
      const response = await addressesService.searchByCep(zipcode.replace(/\D/g, ''));
      if (response.success && response.address) {
        setStreet(response.address.street);
        setNeighborhood(response.address.neighborhood);
        setCity(response.address.city);
        setState(response.address.state);
      }
    } catch (error) {
      Alert.alert('CEP não encontrado', 'Verifique o CEP digitado');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Endereços</Text>
        <Pressable style={styles.addBtn} onPress={handleAddAddress}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={48} color="#A3A3A3" />
            </View>
            <Text style={styles.emptyTitle}>Nenhum endereço</Text>
            <Text style={styles.emptyText}>Adicione um endereço de entrega</Text>
            <Pressable onPress={handleAddAddress}>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.addFirstBtn}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addFirstBtnText}>Adicionar endereço</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressName}>
                  <Ionicons name={address.name === 'Casa' ? 'home-outline' : 'business-outline'} size={18} color={colors.primary} />
                  <Text style={styles.addressNameText}>{address.name}</Text>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Padrão</Text>
                    </View>
                  )}
                </View>
                <Pressable onPress={() => handleEditAddress(address)}>
                  <Ionicons name="pencil-outline" size={18} color="#737373" />
                </Pressable>
              </View>

              <Text style={styles.recipientName}>{address.recipient}</Text>
              <Text style={styles.addressLine}>{address.street}</Text>
              {address.complement && <Text style={styles.addressLine}>{address.complement}</Text>}
              <Text style={styles.addressLine}>
                {address.neighborhood}, {address.city} - {address.state}
              </Text>
              <Text style={styles.addressZip}>CEP: {address.zipcode}</Text>

              <View style={styles.addressActions}>
                {!address.isDefault && (
                  <Pressable style={styles.setDefaultBtn} onPress={() => handleSetDefault(address.id)}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                    <Text style={styles.setDefaultText}>Definir como padrão</Text>
                  </Pressable>
                )}
                <Pressable style={styles.deleteBtn} onPress={() => handleDeleteAddress(address.id)}>
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
            <Pressable onPress={() => { setShowModal(false); resetForm(); }}>
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </Pressable>
            <Text style={styles.modalTitle}>
              {editingAddress ? 'Editar endereço' : 'Novo endereço'}
            </Text>
            <Pressable onPress={handleSaveAddress}>
              <Text style={styles.saveBtn}>Salvar</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do endereço</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Casa, Trabalho"
                placeholderTextColor="#A3A3A3"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Destinatário</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome de quem vai receber"
                placeholderTextColor="#A3A3A3"
                value={recipient}
                onChangeText={setRecipient}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CEP *</Text>
              <View style={styles.zipcodeRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="00000-000"
                  placeholderTextColor="#A3A3A3"
                  value={zipcode}
                  onChangeText={setZipcode}
                  keyboardType="numeric"
                  maxLength={9}
                />
                <Pressable style={styles.searchZipBtn} onPress={handleSearchZipcode}>
                  <Ionicons name="search" size={20} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rua *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome da rua"
                placeholderTextColor="#A3A3A3"
                value={street}
                onChangeText={setStreet}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Número *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="000"
                  placeholderTextColor="#A3A3A3"
                  value={number}
                  onChangeText={setNumber}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>Complemento</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Apto, bloco..."
                  placeholderTextColor="#A3A3A3"
                  value={complement}
                  onChangeText={setComplement}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bairro *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do bairro"
                placeholderTextColor="#A3A3A3"
                value={neighborhood}
                onChangeText={setNeighborhood}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.label}>Cidade *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Cidade"
                  placeholderTextColor="#A3A3A3"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Estado *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="UF"
                  placeholderTextColor="#A3A3A3"
                  value={state}
                  onChangeText={setState}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { padding: 16 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FAFAFA' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#737373', marginBottom: 24 },
  addFirstBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  addFirstBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // Address Card
  addressCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addressName: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressNameText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  defaultBadge: { backgroundColor: colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  defaultText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  recipientName: { fontSize: 14, fontWeight: '500', color: '#1A1A1A', marginBottom: 4 },
  addressLine: { fontSize: 14, color: '#737373', marginBottom: 2 },
  addressZip: { fontSize: 13, color: '#A3A3A3', marginTop: 4 },
  addressActions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  setDefaultBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  setDefaultText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  deleteBtn: { padding: 8 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  saveBtn: { fontSize: 16, fontWeight: '600', color: colors.primary },
  modalContent: { padding: 16 },

  // Form
  inputGroup: { marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#525252', marginBottom: 6 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1A1A1A' },
  zipcodeRow: { flexDirection: 'row', gap: 10 },
  searchZipBtn: { width: 50, backgroundColor: colors.primaryMuted, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

export default AddressesScreen;
