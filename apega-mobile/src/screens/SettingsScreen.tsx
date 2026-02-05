import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors, getColors } from '../theme';

const SETTINGS_SECTIONS = [
  {
    title: 'Conta',
    items: [
      { id: 'profile', icon: 'person-outline', title: 'Editar perfil', screen: 'EditProfile' },
      { id: 'addresses', icon: 'location-outline', title: 'Endereços', screen: 'Addresses' },
    ],
  },
  {
    title: 'Notificações',
    items: [
      { id: 'push', icon: 'notifications-outline', title: 'Notificações push', type: 'toggle', key: 'pushEnabled' },
      { id: 'email', icon: 'mail-outline', title: 'Notificações por email', type: 'toggle', key: 'emailEnabled' },
      { id: 'promo', icon: 'megaphone-outline', title: 'Promoções e ofertas', type: 'toggle', key: 'promoEnabled' },
    ],
  },
  {
    title: 'Suporte',
    items: [
      { id: 'help', icon: 'help-circle-outline', title: 'Central de ajuda', screen: 'Help' },
      { id: 'contact', icon: 'chatbubble-ellipses-outline', title: 'Fale conosco', action: 'contact' },
    ],
  },
  {
    title: 'Políticas',
    items: [
      { id: 'terms', icon: 'document-text-outline', title: 'Termos de uso', screen: 'Policies', params: { policyType: 'terms' } },
      { id: 'privacy', icon: 'lock-closed-outline', title: 'Política de privacidade', screen: 'Policies', params: { policyType: 'privacy' } },
      { id: 'shipping', icon: 'cube-outline', title: 'Política de envio', screen: 'Policies', params: { policyType: 'shipping' } },
      { id: 'refund', icon: 'cash-outline', title: 'Política de reembolso', screen: 'Policies', params: { policyType: 'refund' } },
      { id: 'exchange', icon: 'swap-horizontal-outline', title: 'Troca e devolução', screen: 'Policies', params: { policyType: 'exchange' } },
    ],
  },
];

// Dark mode toggle component
function DarkModeToggle({ themeColors }: { themeColors: any }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.settingItem, { backgroundColor: themeColors.surface, borderBottomColor: isDark ? themeColors.border : '#F5F5F5' }]}>
      <View style={[styles.settingIcon, { backgroundColor: isDark ? themeColors.primaryMuted : '#F5F5F5' }]}>
        <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={themeColors.primary} />
      </View>
      <Text style={[styles.settingTitle, { color: themeColors.text }]}>Modo escuro</Text>
      <Switch
        value={isDark}
        onValueChange={toggleTheme}
        trackColor={{ false: '#E8E8E8', true: themeColors.primaryMuted }}
        thumbColor={isDark ? themeColors.primary : '#fff'}
      />
    </View>
  );
}

export function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const [settings, setSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    promoEnabled: false,
  });

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'contact':
        Alert.alert('Fale Conosco', 'Como prefere entrar em contato?', [
          { text: 'E-mail', onPress: () => Linking.openURL('mailto:suporte@largo.com.br') },
          { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/5511999999999?text=Olá! Preciso de ajuda com o app Largô.') },
          { text: 'Cancelar', style: 'cancel' },
        ]);
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
        await logout();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }},
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const renderItem = (item: any) => {
    if (item.type === 'toggle') {
      return (
        <View key={item.id} style={[styles.settingItem, { backgroundColor: themeColors.surface, borderBottomColor: isDark ? themeColors.border : '#F5F5F5' }]}>
          <View style={[styles.settingIcon, { backgroundColor: isDark ? themeColors.primaryMuted : '#F5F5F5' }]}>
            <Ionicons name={item.icon} size={20} color={isDark ? themeColors.textSecondary : '#525252'} />
          </View>
          <Text style={[styles.settingTitle, { color: themeColors.text }]}>{item.title}</Text>
          <Switch
            value={settings[item.key as keyof typeof settings]}
            onValueChange={() => handleToggle(item.key)}
            trackColor={{ false: isDark ? themeColors.border : '#E8E8E8', true: themeColors.primaryMuted }}
            thumbColor={settings[item.key as keyof typeof settings] ? themeColors.primary : '#fff'}
          />
        </View>
      );
    }

    const handlePress = () => {
      if (item.screen) {
        navigation.navigate(item.screen, item.params || {});
      } else if (item.action) {
        handleAction(item.action);
      }
    };

    return (
      <Pressable
        key={item.id}
        style={[styles.settingItem, { backgroundColor: themeColors.surface, borderBottomColor: isDark ? themeColors.border : '#F5F5F5' }]}
        onPress={handlePress}
      >
        <View style={[styles.settingIcon, { backgroundColor: isDark ? themeColors.primaryMuted : '#F5F5F5' }]}>
          <Ionicons name={item.icon} size={20} color={isDark ? themeColors.textSecondary : '#525252'} />
        </View>
        <Text style={[styles.settingTitle, { color: themeColors.text }]}>{item.title}</Text>
        {item.value ? (
          <Text style={[styles.settingValue, { color: themeColors.textMuted }]}>{item.value}</Text>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? themeColors.background : '#FAFAFA' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? themeColors.background : '#FAFAFA' }]}>
        <Pressable style={[styles.backBtn, { backgroundColor: themeColors.surface }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Configuracoes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Aparencia Section - Dark Mode Toggle */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>Aparencia</Text>
          <View style={[styles.sectionContent, { backgroundColor: themeColors.surface }]}>
            <DarkModeToggle themeColors={themeColors} />
          </View>
        </View>

        {SETTINGS_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>{section.title}</Text>
            <View style={[styles.sectionContent, { backgroundColor: themeColors.surface }]}>
              {section.items.map(renderItem)}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: themeColors.primary }]}>Largo</Text>
          <Text style={[styles.appVersion, { color: themeColors.textMuted }]}>Versao 1.0.0</Text>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Pressable style={[styles.logoutBtn, { backgroundColor: isDark ? '#3D2626' : '#FEE2E2' }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={isDark ? '#E66B6B' : '#EF4444'} />
            <Text style={[styles.logoutText, { color: isDark ? '#E66B6B' : '#EF4444' }]}>Sair da conta</Text>
          </Pressable>

          <Pressable style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color={isDark ? '#E66B6B' : '#EF4444'} />
            <Text style={[styles.deleteText, { color: isDark ? '#E66B6B' : '#EF4444' }]}>Excluir conta</Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { paddingHorizontal: 16 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FAFAFA' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },

  // Section
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#737373', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  sectionContent: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },

  // Setting Item
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  settingIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingTitle: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  settingValue: { fontSize: 14, color: '#A3A3A3', marginRight: 4 },

  // App Info
  appInfo: { alignItems: 'center', marginTop: 32 },
  appName: { fontSize: 16, fontWeight: '600', color: colors.primary },
  appVersion: { fontSize: 13, color: '#A3A3A3', marginTop: 4 },

  // Danger Zone
  dangerZone: { marginTop: 32, gap: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 12 },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  deleteText: { fontSize: 14, color: '#EF4444' },
});

export default SettingsScreen;
