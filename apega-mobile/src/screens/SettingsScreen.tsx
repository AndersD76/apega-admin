import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Header, MainHeader, Input, Button, Modal } from '../components';
import { useAuth } from '../contexts/AuthContext';

const isWeb = Platform.OS === 'web';

interface SettingsScreenProps {
  navigation: any;
}

interface SettingItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  iconColor?: string;
  rightElement?: React.ReactNode;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 900;

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [offerNotifications, setOfferNotifications] = useState(true);
  const [salesNotifications, setSalesNotifications] = useState(true);

  const [privateProfile, setPrivateProfile] = useState(false);
  const [showOnline, setShowOnline] = useState(true);

  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('portugues');
  const [location] = useState(user?.city && user?.state ? `${user.city}, ${user.state}` : '');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSaveEmail = () => {
    setEditingEmail(false);
    Alert.alert('Sucesso', 'E-mail atualizado');
  };

  const handleSavePhone = () => {
    setEditingPhone(false);
    Alert.alert('Sucesso', 'Telefone atualizado');
  };

  const handleSavePassword = () => {
    setShowPasswordModal(false);
    Alert.alert('Sucesso', 'Senha alterada');
  };

  const handleSelectLanguage = (lang: string) => {
    setLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleDownloadData = () => {
    Alert.alert('Baixar dados', 'Voce recebera um arquivo por e-mail em ate 24h.');
  };

  const confirmDeleteAccount = () => {
    setShowDeleteModal(false);
    Alert.alert('Conta excluida', 'Sua conta foi excluida.');
  };

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity key={item.title} style={styles.settingItem} onPress={item.onPress} activeOpacity={0.7}>
      <Ionicons name={item.icon} size={20} color={item.iconColor || COLORS.textPrimary} style={styles.settingIcon} />
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        {item.subtitle ? <Text style={styles.settingSubtitle}>{item.subtitle}</Text> : null}
      </View>
      {item.rightElement || (
        <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
      )}
    </TouchableOpacity>
  );

  const renderToggleItem = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View key={title} style={styles.settingItem}>
      <Ionicons name={icon} size={20} color={COLORS.textPrimary} style={styles.settingIcon} />
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.gray[300], true: COLORS.primaryLight }}
        thumbColor={value ? COLORS.primary : COLORS.white}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {isWeb ? (
        <MainHeader navigation={navigation} title="Configuracoes" />
      ) : (
        <Header navigation={navigation} title="Configuracoes" showBack />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
      >
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.card}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>e-mail</Text>
            {editingEmail ? (
              <View style={styles.fieldEdit}>
                <Input value={email} onChangeText={setEmail} placeholder="seu e-mail" keyboardType="email-address" autoCapitalize="none" />
                <View style={styles.fieldActions}>
                  <Button label="cancelar" variant="secondary" size="small" onPress={() => setEditingEmail(false)} />
                  <Button label="salvar" variant="primary" size="small" onPress={handleSaveEmail} />
                </View>
              </View>
            ) : (
              <View style={styles.fieldDisplay}>
                <Text style={styles.fieldValue}>{email}</Text>
                <TouchableOpacity onPress={() => setEditingEmail(true)}>
                  <Text style={styles.editLink}>editar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.fieldDivider} />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>telefone</Text>
            {editingPhone ? (
              <View style={styles.fieldEdit}>
                <Input value={phone} onChangeText={setPhone} placeholder="seu telefone" keyboardType="phone-pad" />
                <View style={styles.fieldActions}>
                  <Button label="cancelar" variant="secondary" size="small" onPress={() => setEditingPhone(false)} />
                  <Button label="salvar" variant="primary" size="small" onPress={handleSavePhone} />
                </View>
              </View>
            ) : (
              <View style={styles.fieldDisplay}>
                <Text style={styles.fieldValue}>{phone}</Text>
                <TouchableOpacity onPress={() => setEditingPhone(true)}>
                  <Text style={styles.editLink}>editar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.fieldDivider} />

          <TouchableOpacity style={styles.fieldContainer} onPress={() => setShowPasswordModal(true)} activeOpacity={0.7}>
            <Text style={styles.fieldLabel}>senha</Text>
            <View style={styles.fieldDisplay}>
              <Text style={styles.fieldValue}>••••••••</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Notificacoes</Text>
        <View style={styles.card}>
          {renderToggleItem('notifications', 'notificacoes push', 'alertas no dispositivo', pushNotifications, setPushNotifications)}
          <View style={styles.fieldDivider} />
          {renderToggleItem('mail', 'e-mail marketing', 'ofertas e novidades', emailMarketing, setEmailMarketing)}
          <View style={styles.fieldDivider} />
          {renderToggleItem('chatbubbles', 'mensagens', 'novas mensagens', messageNotifications, setMessageNotifications)}
          <View style={styles.fieldDivider} />
          {renderToggleItem('pricetag', 'ofertas', 'quando alguem fizer oferta', offerNotifications, setOfferNotifications)}
          <View style={styles.fieldDivider} />
          {renderToggleItem('cart', 'vendas', 'atualizacoes de vendas', salesNotifications, setSalesNotifications)}
        </View>

        <Text style={styles.sectionTitle}>Privacidade</Text>
        <View style={styles.card}>
          {renderToggleItem('eye-off', 'perfil privado', 'apenas seguidores veem seus produtos', privateProfile, setPrivateProfile)}
          <View style={styles.fieldDivider} />
          {renderToggleItem('radio-button-on', 'status online', 'mostrar quando voce esta online', showOnline, setShowOnline)}
        </View>

        <Text style={styles.sectionTitle}>Preferencias</Text>
        <View style={styles.card}>
          {renderToggleItem('moon', 'modo escuro', 'ativar tema escuro', darkMode, setDarkMode)}
          <View style={styles.fieldDivider} />
          <TouchableOpacity style={styles.settingItem} onPress={() => setShowLanguageModal(true)} activeOpacity={0.7}>
            <Ionicons name="language" size={20} color={COLORS.textPrimary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>idioma</Text>
              <Text style={styles.settingSubtitle}>alterar idioma do app</Text>
            </View>
            <Text style={styles.languageValue}>{language}</Text>
          </TouchableOpacity>
          <View style={styles.fieldDivider} />
          <View style={styles.settingItem}>
            <Ionicons name="location" size={20} color={COLORS.textPrimary} style={styles.settingIcon} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>localizacao</Text>
              <Text style={styles.settingSubtitle}>{location}</Text>
            </View>
            <Text style={styles.editLink}>editar</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Dados</Text>
        {renderSettingItem({
          icon: 'download',
          title: 'baixar meus dados',
          subtitle: 'solicitar copia dos seus dados',
          onPress: handleDownloadData,
        })}
        {renderSettingItem({
          icon: 'trash',
          title: 'excluir conta',
          subtitle: 'apagar permanentemente sua conta',
          onPress: () => setShowDeleteModal(true),
          iconColor: COLORS.error,
        })}

        <Text style={styles.sectionTitle}>Sobre</Text>
        {renderSettingItem({
          icon: 'information-circle',
          title: 'sobre o apega desapega',
          subtitle: 'conheca nossa historia',
          onPress: () => console.log('About'),
        })}
        {renderSettingItem({
          icon: 'document-text',
          title: 'termos de uso',
          subtitle: 'leia nossos termos',
          onPress: () => console.log('Terms'),
        })}
        {renderSettingItem({
          icon: 'shield-checkmark',
          title: 'politica de privacidade',
          subtitle: 'como tratamos seus dados',
          onPress: () => console.log('Privacy'),
        })}

        <Text style={styles.version}>versao 1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showPasswordModal} onClose={() => setShowPasswordModal(false)} type="bottom" title="alterar senha">
        <View style={styles.modalContent}>
          <Input label="senha atual" placeholder="digite sua senha atual" secureTextEntry required />
          <Input label="nova senha" placeholder="digite a nova senha" secureTextEntry helperText="minimo 8 caracteres" required />
          <Input label="confirmar nova senha" placeholder="digite novamente" secureTextEntry required />
          <View style={styles.modalActions}>
            <Button label="cancelar" variant="secondary" onPress={() => setShowPasswordModal(false)} fullWidth />
            <Button label="salvar" variant="primary" onPress={handleSavePassword} fullWidth />
          </View>
        </View>
      </Modal>

      <Modal visible={showLanguageModal} onClose={() => setShowLanguageModal(false)} type="bottom" title="selecionar idioma">
        <View style={styles.modalContent}>
          {['portugues', 'english', 'espanol'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.languageOption, language === lang && styles.languageOptionActive]}
              onPress={() => handleSelectLanguage(lang)}
              activeOpacity={0.7}
            >
              <Text style={[styles.languageOptionText, language === lang && styles.languageOptionTextActive]}>{lang}</Text>
              {language === lang && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      <Modal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)} type="center" title="excluir conta" showCloseButton={false}>
        <View style={styles.deleteModalContent}>
          <View style={styles.warningIcon}>
            <Ionicons name="warning" size={36} color={COLORS.error} />
          </View>
          <Text style={styles.deleteTitle}>tem certeza?</Text>
          <Text style={styles.deleteMessage}>
            esta acao e permanente. seus dados e anuncios serao excluidos.
          </Text>
          <View style={styles.deleteActions}>
            <Button label="cancelar" variant="secondary" onPress={() => setShowDeleteModal(false)} fullWidth />
            <Button label="excluir conta" variant="primary" onPress={confirmDeleteAccount} fullWidth style={{ backgroundColor: COLORS.error }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xl,
  },
  contentDesktop: {
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.xs,
  },
  fieldContainer: {
    paddingVertical: SPACING.sm,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  fieldDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  editLink: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  fieldEdit: {
    gap: SPACING.md,
  },
  fieldActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
  },
  fieldDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minHeight: 60,
    ...SHADOWS.xs,
  },
  settingIcon: {
    marginRight: SPACING.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  languageValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  version: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  modalContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  languageOptionActive: {
    backgroundColor: COLORS.primaryExtraLight,
  },
  languageOptionText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  languageOptionTextActive: {
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  deleteModalContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  warningIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  deleteTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  deleteMessage: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  deleteActions: {
    width: '100%',
    gap: SPACING.md,
  },
});
