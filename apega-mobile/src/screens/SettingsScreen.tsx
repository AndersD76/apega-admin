import React, { useState, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

const isWeb = Platform.OS === 'web';
const MAX_CONTENT_WIDTH = 700;

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
  const { user, refreshUser } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = isWeb && windowWidth > 768;

  // Account state - initialized from user context
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Notification toggles
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [offerNotifications, setOfferNotifications] = useState(true);
  const [salesNotifications, setSalesNotifications] = useState(true);

  // Privacy toggles
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showOnline, setShowOnline] = useState(true);

  // Preferences
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('português');
  const [location, setLocation] = useState(user?.city && user?.state ? `${user.city}, ${user.state}` : '');

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSaveEmail = () => {
    setEditingEmail(false);
    Alert.alert('sucesso', 'e-mail atualizado com sucesso');
  };

  const handleSavePhone = () => {
    setEditingPhone(false);
    Alert.alert('sucesso', 'telefone atualizado com sucesso');
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleSavePassword = () => {
    setShowPasswordModal(false);
    Alert.alert('sucesso', 'senha alterada com sucesso');
  };

  const handleBlockedUsers = () => {
    console.log('Manage blocked users');
  };

  const handleSelectLanguage = (lang: string) => {
    setLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleDownloadData = () => {
    Alert.alert(
      'baixar dados',
      'você receberá um arquivo com todos os seus dados por e-mail em até 24 horas.',
      [{ text: 'ok' }]
    );
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    setShowDeleteModal(false);
    Alert.alert('conta excluída', 'sua conta foi excluída permanentemente');
  };

  const renderSectionTitle = (title: string) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const renderDivider = () => <View style={styles.divider} />;

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.title}
      style={styles.settingItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={item.icon}
        size={24}
        color={item.iconColor || COLORS.textPrimary}
        style={styles.settingIcon}
      />
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        {item.subtitle && (
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      {item.rightElement || (
        <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
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
      <Ionicons
        name={icon}
        size={24}
        color={COLORS.textPrimary}
        style={styles.settingIcon}
      />
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
      <Header
        navigation={navigation}
        title="configurações"
        variant="simple"
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          isDesktop && { maxWidth: MAX_CONTENT_WIDTH }
        ]}
      >
        {/* Account Section */}
        {renderSectionTitle('conta')}

        <View style={styles.card}>
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Ionicons name="mail" size={20} color={COLORS.textSecondary} />
              <Text style={styles.fieldLabel}>e-mail</Text>
            </View>
            {editingEmail ? (
              <View style={styles.fieldEdit}>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu e-mail"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.fieldActions}>
                  <Button
                    label="cancelar"
                    variant="secondary"
                    size="small"
                    onPress={() => setEditingEmail(false)}
                  />
                  <Button
                    label="salvar"
                    variant="primary"
                    size="small"
                    onPress={handleSaveEmail}
                  />
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
            <View style={styles.fieldHeader}>
              <Ionicons name="phone-portrait" size={20} color={COLORS.textSecondary} />
              <Text style={styles.fieldLabel}>telefone</Text>
            </View>
            {editingPhone ? (
              <View style={styles.fieldEdit}>
                <Input
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="seu telefone"
                  keyboardType="phone-pad"
                />
                <View style={styles.fieldActions}>
                  <Button
                    label="cancelar"
                    variant="secondary"
                    size="small"
                    onPress={() => setEditingPhone(false)}
                  />
                  <Button
                    label="salvar"
                    variant="primary"
                    size="small"
                    onPress={handleSavePhone}
                  />
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

          <TouchableOpacity
            style={styles.fieldContainer}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <View style={styles.fieldHeader}>
              <Ionicons name="lock-closed" size={20} color={COLORS.textSecondary} />
              <Text style={styles.fieldLabel}>senha</Text>
            </View>
            <View style={styles.fieldDisplay}>
              <Text style={styles.fieldValue}>••••••••</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {renderDivider()}

        {/* Notifications Section */}
        {renderSectionTitle('notificações')}
        <View style={styles.card}>
          {renderToggleItem(
            'notifications',
            'notificações push',
            'receba alertas no seu dispositivo',
            pushNotifications,
            setPushNotifications
          )}
          <View style={styles.fieldDivider} />
          {renderToggleItem(
            'mail',
            'e-mail marketing',
            'ofertas e novidades por e-mail',
            emailMarketing,
            setEmailMarketing
          )}
          <View style={styles.fieldDivider} />
          {renderToggleItem(
            'chatbubbles',
            'mensagens',
            'alertas de novas mensagens',
            messageNotifications,
            setMessageNotifications
          )}
          <View style={styles.fieldDivider} />
          {renderToggleItem(
            'pricetag',
            'ofertas recebidas',
            'quando alguém fizer uma oferta',
            offerNotifications,
            setOfferNotifications
          )}
          <View style={styles.fieldDivider} />
          {renderToggleItem(
            'cart',
            'vendas',
            'atualizações sobre suas vendas',
            salesNotifications,
            setSalesNotifications
          )}
        </View>

        {renderDivider()}

        {/* Privacy Section */}
        {renderSectionTitle('privacidade')}
        <View style={styles.card}>
          {renderToggleItem(
            'eye-off',
            'perfil privado',
            'apenas seguidores veem seus produtos',
            privateProfile,
            setPrivateProfile
          )}
          <View style={styles.fieldDivider} />
          {renderToggleItem(
            'radio-button-on',
            'mostrar status online',
            'outros usuários veem quando você está online',
            showOnline,
            setShowOnline
          )}
          <View style={styles.fieldDivider} />
          <TouchableOpacity
            style={styles.fieldContainer}
            onPress={handleBlockedUsers}
            activeOpacity={0.7}
          >
            <View style={styles.fieldHeader}>
              <Ionicons name="ban" size={24} color={COLORS.textPrimary} />
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={styles.settingTitle}>usuários bloqueados</Text>
                <Text style={styles.settingSubtitle}>gerenciar lista de bloqueios</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        {renderDivider()}

        {/* Preferences Section */}
        {renderSectionTitle('preferências')}
        <View style={styles.card}>
          {renderToggleItem(
            'moon',
            'modo escuro',
            'ative o tema escuro',
            darkMode,
            setDarkMode
          )}
          <View style={styles.fieldDivider} />
          <TouchableOpacity
            style={styles.fieldContainer}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.fieldHeader}>
              <Ionicons name="language" size={24} color={COLORS.textPrimary} />
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={styles.settingTitle}>idioma</Text>
                <Text style={styles.settingSubtitle}>alterar idioma do app</Text>
              </View>
            </View>
            <View style={styles.languageDisplay}>
              <Text style={styles.languageValue}>{language}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            </View>
          </TouchableOpacity>
          <View style={styles.fieldDivider} />
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Ionicons name="location" size={24} color={COLORS.textPrimary} />
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={styles.settingTitle}>localização</Text>
                <Text style={styles.settingSubtitle}>{location}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => console.log('Edit location')}>
              <Text style={styles.editLink}>editar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderDivider()}

        {/* Data Section */}
        {renderSectionTitle('dados')}
        {renderSettingItem({
          icon: 'download',
          title: 'baixar meus dados',
          subtitle: 'solicitar cópia dos seus dados',
          onPress: handleDownloadData,
        })}
        {renderSettingItem({
          icon: 'trash',
          title: 'excluir conta',
          subtitle: 'apagar permanentemente sua conta',
          onPress: handleDeleteAccount,
          iconColor: COLORS.error,
        })}

        {renderDivider()}

        {/* About Section */}
        {renderSectionTitle('sobre')}
        {renderSettingItem({
          icon: 'information-circle',
          title: 'sobre o apega desapega',
          subtitle: 'conheça nossa história',
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
          title: 'política de privacidade',
          subtitle: 'como tratamos seus dados',
          onPress: () => console.log('Privacy'),
        })}

        <Text style={styles.version}>versão 1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        type="bottom"
        title="alterar senha"
      >
        <View style={styles.modalContent}>
          <Input
            label="senha atual"
            placeholder="digite sua senha atual"
            secureTextEntry
            required
          />
          <Input
            label="nova senha"
            placeholder="digite a nova senha"
            secureTextEntry
            helperText="mínimo 8 caracteres"
            required
          />
          <Input
            label="confirmar nova senha"
            placeholder="digite novamente a nova senha"
            secureTextEntry
            required
          />
          <View style={styles.modalActions}>
            <Button
              label="cancelar"
              variant="secondary"
              onPress={() => setShowPasswordModal(false)}
              fullWidth
            />
            <Button
              label="salvar"
              variant="primary"
              onPress={handleSavePassword}
              fullWidth
            />
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        type="bottom"
        title="selecionar idioma"
      >
        <View style={styles.modalContent}>
          {['português', 'english', 'español'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageOption,
                language === lang && styles.languageOptionActive,
              ]}
              onPress={() => handleSelectLanguage(lang)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  language === lang && styles.languageOptionTextActive,
                ]}
              >
                {lang}
              </Text>
              {language === lang && (
                <Ionicons name="checkmark" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        type="center"
        title="excluir conta"
        showCloseButton={false}
      >
        <View style={styles.deleteModalContent}>
          <View style={styles.warningIcon}>
            <Ionicons name="warning" size={48} color={COLORS.error} />
          </View>
          <Text style={styles.deleteTitle}>tem certeza?</Text>
          <Text style={styles.deleteMessage}>
            esta ação é permanente e não pode ser desfeita. todos os seus dados,
            produtos, vendas e mensagens serão excluídos.
          </Text>
          <View style={styles.deleteActions}>
            <Button
              label="cancelar"
              variant="secondary"
              onPress={() => setShowDeleteModal(false)}
              fullWidth
            />
            <Button
              label="excluir conta"
              variant="primary"
              onPress={confirmDeleteAccount}
              fullWidth
              style={{ backgroundColor: COLORS.error }}
            />
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
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.lg,
    marginHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.xs,
  },
  fieldContainer: {
    paddingVertical: SPACING.sm,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
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
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 64,
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
  languageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
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
    marginTop: SPACING.xl,
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
    backgroundColor: COLORS.primaryLight,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  deleteTitle: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  deleteMessage: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  deleteActions: {
    width: '100%',
    gap: SPACING.md,
  },
});
