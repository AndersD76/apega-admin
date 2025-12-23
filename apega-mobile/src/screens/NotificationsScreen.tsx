import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavigation, EmptyState, Header, MainHeader, Tab } from '../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const isWeb = Platform.OS === 'web';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

type TabItem = { id: string; label: string };

interface Notification {
  id: string;
  type: 'message' | 'offer' | 'sale' | 'rating' | 'favorite' | 'delivery' | 'shipped';
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: string;
}

interface NotificationSection {
  title: string;
  data: Notification[];
}

const MOCK_NOTIFICATIONS: NotificationSection[] = [];

export default function NotificationsScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 900;

  const [activeTab, setActiveTab] = useState<string>('all');
  const [notifications, setNotifications] = useState<NotificationSection[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.reduce(
    (acc, section) => acc + section.data.filter((n) => !n.read).length,
    0
  );
  const totalCount = notifications.reduce(
    (acc, section) => acc + section.data.length,
    0
  );

  const filteredNotifications = notifications
    .map((section) => ({
      ...section,
      data: activeTab === 'unread' ? section.data.filter((n) => !n.read) : section.data,
    }))
    .filter((section) => section.data.length > 0);

  const handleMarkAllRead = () => {
    const updatedNotifications = notifications.map((section) => ({
      ...section,
      data: section.data.map((n) => ({ ...n, read: true })),
    }));
    setNotifications(updatedNotifications);
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.notificationUnread]}
      activeOpacity={0.7}
    >
      <Text style={styles.notificationIcon}>{item.icon}</Text>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, !item.read && styles.notificationTitleUnread]}>
          {item.title}
        </Text>
        <Text style={styles.notificationDescription}>{item.description}</Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: NotificationSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const tabs: TabItem[] = [
    { id: 'all', label: `todas (${totalCount})` },
    { id: 'unread', label: `nao lidas (${unreadCount})` },
  ];

  const hasNotifications = filteredNotifications.length > 0;

  return (
    <View style={styles.container}>
      {isWeb ? (
        <MainHeader navigation={navigation} title="Notificacoes" />
      ) : (
        <Header navigation={navigation} title="Notificacoes" />
      )}

      <View style={styles.headerActions}>
        <Tab items={tabs} activeTab={activeTab} onTabPress={setActiveTab} scrollable={false} />
        {hasNotifications && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Ionicons name="checkmark-done-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {hasNotifications ? (
        <SectionList
          sections={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[styles.listContent, isDesktop && styles.listContentDesktop]}
          stickySectionHeadersEnabled
        />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="notifications-off-outline"
            title="nenhuma notificacao"
            description="voce sera avisada sobre mensagens, ofertas e vendas"
          />
        </View>
      )}

      <BottomNavigation navigation={navigation} activeRoute="Notifications" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerActions: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  markAllButton: {
    alignSelf: 'flex-end',
    padding: SPACING.sm,
  },
  listContent: {
    paddingBottom: 80,
    paddingHorizontal: SPACING.md,
  },
  listContentDesktop: {
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
  },
  sectionHeader: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    ...SHADOWS.xs,
  },
  notificationUnread: {
    borderColor: COLORS.primary,
  },
  notificationIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  notificationTitleUnread: {
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  notificationDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
});
