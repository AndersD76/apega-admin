import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavigation, Header, MainHeader } from '../components';

const isWeb = Platform.OS === 'web';

interface MessagesScreenProps {
  navigation: any;
}

interface Conversation {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isMine: boolean;
}

const MOCK_CONVERSATIONS: Conversation[] = [];
const MOCK_MESSAGES: Message[] = [];

export default function MessagesScreen({ navigation }: MessagesScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width > 900;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log('Send message:', messageText);
      setMessageText('');
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationItem, item.unread && styles.conversationUnread]}
      onPress={() => setSelectedConversation(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={22} color={COLORS.textTertiary} />
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.conversationName, item.unread && styles.conversationNameUnread]}>
            {item.user.name}
          </Text>
          <Text style={styles.conversationTime}>{item.timestamp}</Text>
        </View>
        <Text style={[styles.conversationMessage, item.unread && styles.conversationMessageUnread]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      {item.unread && <View style={styles.unreadIndicator} />}
      <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, !item.isMine && styles.messageContainerOther]}>
      <View style={[styles.messageBubble, !item.isMine && styles.messageBubbleOther]}>
        <Text style={[styles.messageText, !item.isMine && styles.messageTextOther]}>{item.text}</Text>
        <Text style={[styles.messageTime, !item.isMine && styles.messageTimeOther]}>{item.timestamp}</Text>
      </View>
    </View>
  );

  if (!selectedConversation) {
    return (
      <View style={styles.container}>
        {isWeb ? (
          <MainHeader navigation={navigation} title="Mensagens" />
        ) : (
          <Header navigation={navigation} title="Mensagens" showBack />
        )}

        <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
          <Ionicons name="search" size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="buscar mensagens"
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={MOCK_CONVERSATIONS}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, isDesktop && styles.listContentDesktop]}
        />

        <BottomNavigation navigation={navigation} activeRoute="Profile" />
      </View>
    );
  }

  const conversation = MOCK_CONVERSATIONS.find((c) => c.id === selectedConversation);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedConversation(null)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.chatHeaderUser}>
          <View style={styles.avatarSmall}>
            <Ionicons name="person" size={18} color={COLORS.textTertiary} />
          </View>
          <View>
            <Text style={styles.chatHeaderName}>{conversation?.user.name}</Text>
            <Text style={styles.chatHeaderStatus}>online agora</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_MESSAGES}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="camera-outline" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>
        <View style={styles.messageInput}>
          <TextInput
            style={styles.messageInputField}
            placeholder="digite sua mensagem"
            placeholderTextColor={COLORS.textTertiary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={messageText.trim() ? COLORS.white : COLORS.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchContainerDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingBottom: 80,
  },
  listContentDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: SPACING.md,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.xs,
  },
  conversationUnread: {
    borderColor: COLORS.primary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  conversationNameUnread: {
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  conversationTime: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  conversationMessage: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  conversationMessageUnread: {
    color: COLORS.textPrimary,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SPACING.sm,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  chatHeaderUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  chatHeaderName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  chatHeaderStatus: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.success,
  },
  messagesList: {
    padding: SPACING.md,
  },
  messageContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  messageContainerOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.white,
    marginBottom: 4,
  },
  messageTextOther: {
    color: COLORS.textPrimary,
  },
  messageTime: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-end',
  },
  messageTimeOther: {
    color: COLORS.textTertiary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    maxHeight: 100,
    marginHorizontal: SPACING.sm,
  },
  messageInputField: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray[200],
  },
});
