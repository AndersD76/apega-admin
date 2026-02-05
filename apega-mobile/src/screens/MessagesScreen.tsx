import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { messagesService, Conversation } from '../api';
import { colors } from '../theme';
import { ChatListSkeleton } from '../components/ChatListSkeleton';

export function MessagesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await messagesService.getConversations();
      if (response.success) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.product_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable
      style={styles.conversationCard}
      onPress={() => navigation.navigate('Chat', {
        conversationId: item.id,
        sellerId: item.other_user_id,
        sellerName: item.other_user_name,
      })}
    >
      <View style={styles.avatarWrap}>
        {item.other_user_avatar ? (
          <Image source={{ uri: item.other_user_avatar }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.other_user_name}</Text>
          {item.last_message_at && (
            <Text style={[styles.timestamp, item.unread_count > 0 && styles.timestampUnread]}>
              {formatTime(item.last_message_at)}
            </Text>
          )}
        </View>

        {item.product_title && (
          <View style={styles.productPreview}>
            {item.product_image && (
              <Image source={{ uri: item.product_image }} style={styles.productThumb} contentFit="cover" />
            )}
            <Text style={styles.productName} numberOfLines={1}>{item.product_title}</Text>
          </View>
        )}

        <View style={styles.messageRow}>
          <Text style={[styles.lastMessage, item.unread_count > 0 && styles.lastMessageUnread]} numberOfLines={1}>
            {item.last_message || 'Sem mensagens'}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Mensagens</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#A3A3A3" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversas..."
            placeholderTextColor="#A3A3A3"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#A3A3A3" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Conversations List */}
      {loading ? (
        <ChatListSkeleton count={5} />
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={48} color="#A3A3A3" />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma conversa</Text>
              <Text style={styles.emptyText}>
                Suas conversas com vendedores e compradores aparecerão aqui
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },

  // Search
  searchWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, height: 40, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A' },

  // List
  listContent: { paddingBottom: 100 },
  separator: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 80 },

  // Conversation
  conversationCard: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff' },
  conversationContent: { flex: 1, marginLeft: 12 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  timestamp: { fontSize: 12, color: '#A3A3A3' },
  timestampUnread: { color: colors.primary, fontWeight: '500' },
  productPreview: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  productThumb: { width: 20, height: 20, borderRadius: 4 },
  productName: { fontSize: 12, color: '#737373', flex: 1 },
  messageRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  lastMessage: { flex: 1, fontSize: 14, color: '#737373' },
  lastMessageUnread: { color: '#1A1A1A', fontWeight: '500' },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#737373', textAlign: 'center', paddingHorizontal: 32 },
});

export default MessagesScreen;
