import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { usersService } from '../api/users';
import { colors } from '../theme';

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave Aleatoria' },
];

const BANK_ACCOUNT_TYPES = [
  { value: 'corrente', label: 'Conta Corrente' },
  { value: 'poupanca', label: 'Conta Poupanca' },
];

export function EditProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'payment'>('profile');

  // Dados pessoais
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');

  // Dados bancarios
  const [cpf, setCpf] = useState(user?.cpf || '');
  const [pixKeyType, setPixKeyType] = useState<string>(user?.pix_key_type || '');
  const [pixKey, setPixKey] = useState(user?.pix_key || '');
  const [bankCode, setBankCode] = useState(user?.bank_code || '');
  const [bankName, setBankName] = useState(user?.bank_name || '');
  const [bankAgency, setBankAgency] = useState(user?.bank_agency || '');
  const [bankAccount, setBankAccount] = useState(user?.bank_account || '');
  const [bankAccountType, setBankAccountType] = useState<string>(user?.bank_account_type || '');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome e obrigatorio');
      return;
    }

    setLoading(true);
    try {
      const response = await usersService.updateProfile({
        name: name.trim(),
        bio: bio.trim() || undefined,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        instagram: instagram.trim() || undefined,
        // Dados bancarios
        cpf: cpf.trim() || undefined,
        pix_key_type: pixKeyType as any || undefined,
        pix_key: pixKey.trim() || undefined,
        bank_code: bankCode.trim() || undefined,
        bank_name: bankName.trim() || undefined,
        bank_agency: bankAgency.trim() || undefined,
        bank_account: bankAccount.trim() || undefined,
        bank_account_type: bankAccountType as any || undefined,
      });

      if (response.success) {
        if (refreshUser) {
          await refreshUser();
        }
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Erro', error?.response?.data?.message || 'Nao foi possivel atualizar o perfil');
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <Pressable onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveBtn, loading && styles.saveBtnDisabled]}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Text>
        </Pressable>
      </View>

      {/* Section Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeSection === 'profile' && styles.tabActive]}
          onPress={() => setActiveSection('profile')}
        >
          <Ionicons
            name="person-outline"
            size={18}
            color={activeSection === 'profile' ? colors.primary : '#737373'}
          />
          <Text style={[styles.tabText, activeSection === 'profile' && styles.tabTextActive]}>
            Dados Pessoais
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeSection === 'payment' && styles.tabActive]}
          onPress={() => setActiveSection('payment')}
        >
          <Ionicons
            name="wallet-outline"
            size={18}
            color={activeSection === 'payment' ? colors.primary : '#737373'}
          />
          <Text style={[styles.tabText, activeSection === 'payment' && styles.tabTextActive]}>
            Dados Bancarios
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeSection === 'profile' ? (
          /* Dados Pessoais */
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                placeholder="Seu nome completo"
                placeholderTextColor="#A3A3A3"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={email}
                editable={false}
              />
              <Text style={styles.hint}>O email nao pode ser alterado</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#A3A3A3"
                value={phone}
                onChangeText={(text) => setPhone(formatPhone(text))}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Conte um pouco sobre voce..."
                placeholderTextColor="#A3A3A3"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Text style={styles.charCount}>{bio.length}/200</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cidade</Text>
              <TextInput
                style={styles.input}
                placeholder="Sao Paulo, SP"
                placeholderTextColor="#A3A3A3"
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Instagram</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="logo-instagram" size={20} color="#A3A3A3" />
                <TextInput
                  style={styles.inputIcon}
                  placeholder="@seuinstagram"
                  placeholderTextColor="#A3A3A3"
                  value={instagram}
                  onChangeText={setInstagram}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>
        ) : (
          /* Dados Bancarios */
          <View style={styles.form}>
            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Configure seus dados para receber o pagamento das suas vendas
              </Text>
            </View>

            {/* CPF */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CPF</Text>
              <TextInput
                style={styles.input}
                placeholder="000.000.000-00"
                placeholderTextColor="#A3A3A3"
                value={cpf}
                onChangeText={(text) => setCpf(formatCPF(text))}
                keyboardType="numeric"
              />
              <Text style={styles.hint}>Necessario para receber pagamentos</Text>
            </View>

            {/* PIX Section */}
            <View style={styles.sectionDivider}>
              <View style={styles.sectionIcon}>
                <Ionicons name="flash" size={16} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Chave PIX</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Chave</Text>
              <View style={styles.optionsRow}>
                {PIX_KEY_TYPES.map((type) => (
                  <Pressable
                    key={type.value}
                    style={[
                      styles.optionBtn,
                      pixKeyType === type.value && styles.optionBtnActive,
                    ]}
                    onPress={() => setPixKeyType(type.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        pixKeyType === type.value && styles.optionTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Chave PIX</Text>
              <TextInput
                style={styles.input}
                placeholder={
                  pixKeyType === 'cpf' ? '000.000.000-00' :
                  pixKeyType === 'cnpj' ? '00.000.000/0000-00' :
                  pixKeyType === 'email' ? 'seu@email.com' :
                  pixKeyType === 'phone' ? '(00) 00000-0000' :
                  'Sua chave PIX'
                }
                placeholderTextColor="#A3A3A3"
                value={pixKey}
                onChangeText={setPixKey}
                keyboardType={
                  pixKeyType === 'cpf' || pixKeyType === 'cnpj' || pixKeyType === 'phone'
                    ? 'numeric'
                    : pixKeyType === 'email'
                    ? 'email-address'
                    : 'default'
                }
                autoCapitalize="none"
              />
            </View>

            {/* Bank Account Section */}
            <View style={styles.sectionDivider}>
              <View style={styles.sectionIcon}>
                <Ionicons name="business" size={16} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>Conta Bancaria (Opcional)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Banco</Text>
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, { flex: 0.3 }]}
                  placeholder="Cod"
                  placeholderTextColor="#A3A3A3"
                  value={bankCode}
                  onChangeText={setBankCode}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <TextInput
                  style={[styles.input, { flex: 0.7 }]}
                  placeholder="Nome do banco"
                  placeholderTextColor="#A3A3A3"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Agencia</Text>
              <TextInput
                style={styles.input}
                placeholder="0000"
                placeholderTextColor="#A3A3A3"
                value={bankAgency}
                onChangeText={setBankAgency}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Conta</Text>
              <TextInput
                style={styles.input}
                placeholder="00000000-0"
                placeholderTextColor="#A3A3A3"
                value={bankAccount}
                onChangeText={setBankAccount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Conta</Text>
              <View style={styles.optionsRow}>
                {BANK_ACCOUNT_TYPES.map((type) => (
                  <Pressable
                    key={type.value}
                    style={[
                      styles.optionBtn,
                      styles.optionBtnLarge,
                      bankAccountType === type.value && styles.optionBtnActive,
                    ]}
                    onPress={() => setBankAccountType(type.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        bankAccountType === type.value && styles.optionTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  saveBtn: { fontSize: 16, fontWeight: '600', color: colors.primary },
  saveBtnDisabled: { color: '#A3A3A3' },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: '#E8F5F1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#737373',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Form
  form: { gap: 20, paddingHorizontal: 16, paddingTop: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: '#525252' },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
  inputDisabled: { backgroundColor: '#FAFAFA', color: '#A3A3A3' },
  textArea: { height: 90, textAlignVertical: 'top', paddingTop: 14 },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  inputIcon: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1A1A1A' },
  hint: { fontSize: 12, color: '#A3A3A3', marginTop: 4 },
  charCount: { fontSize: 12, color: '#A3A3A3', textAlign: 'right', marginTop: 4 },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E8F5F1',
    borderRadius: 12,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },

  // Section Divider
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingBottom: 4,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // Options Row
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  optionBtnLarge: {
    flex: 1,
    alignItems: 'center',
  },
  optionBtnActive: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#525252',
  },
  optionTextActive: {
    color: '#fff',
  },

  // Row Inputs
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default EditProfileScreen;
