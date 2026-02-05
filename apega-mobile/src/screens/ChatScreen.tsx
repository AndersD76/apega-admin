import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { messagesService } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatPrice } from '../utils/format';
import { colors, radius, shadows } from '../theme';
import { OfferModal } from '../components/OfferModal';
import { OfferMessage, OfferData, OfferStatus } from '../components/OfferMessage';

const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200';

export function ChatScreen({ route, navigation }: any) {
  const {
    conversationId: initialConversationId,
    sellerId,
    sellerName,
    sellerAvatar,
    productId,
    productTitle,
    productImage,
    productPrice
  } = route.params || {};

  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { user } = useAuth();
  const { socket, isConnected, onlineUsers } = useSocket();

  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offers, setOffers] = useState<Map<string, OfferData>>(new Map());

  // Determine if user is the seller of the product
  const isSeller = user?.id === sellerId;

  // Check if seller is online
  const isSellerOnline = sellerId ? onlineUsers.has(sellerId) : false;

  const seller = {
    name: sellerName || 'Vendedor',
    avatar: sellerAvatar || PLACEHOLDER_AVATAR,
    online: isSellerOnline,
  };

  const product = {
    title: productTitle || 'Produto',
    price: productPrice || 0,
    image: productImage || 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
  };

  // Handle incoming real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      // Only process messages for this conversation
      if (data.conversationId === conversationId) {
        const newMessage = {
          id: data.message?.id || String(Date.now()),
          text: data.message?.content || data.content,
          isMe: false,
          timestamp: new Date(data.message?.created_at || data.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    const handleTyping = (data: any) => {
      if (data.conversationId === conversationId && data.userId === sellerId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data: any) => {
      if (data.conversationId === conversationId && data.userId === sellerId) {
        setIsTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, conversationId, sellerId]);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      // If we already have a conversation ID, just fetch messages
      if (conversationId) {
        await fetchMessages(conversationId);
        return;
      }

      // Otherwise, create or get the conversation
      if (sellerId) {
        const response = await messagesService.getOrCreateConversation({
          other_user_id: sellerId,
          product_id: productId,
        });

        if (response.success && response.conversation) {
          setConversationId(response.conversation.id);
          await fetchMessages(response.conversation.id);
        }
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const response = await messagesService.getMessages(convId);
      if (response.success && response.messages) {
        const formattedMessages = response.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.content,
          isMe: msg.sender_id === user?.id,
          timestamp: new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic update
    const tempMessage = {
      id: String(Date.now()),
      text: messageText,
      isMe: true,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, tempMessage]);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // If no conversation yet, create one first
      let currentConvId = conversationId;

      if (!currentConvId && sellerId) {
        const convResponse = await messagesService.getOrCreateConversation({
          other_user_id: sellerId,
          product_id: productId,
        });

        if (convResponse.success && convResponse.conversation) {
          currentConvId = convResponse.conversation.id;
          setConversationId(currentConvId);
        }
      }

      if (currentConvId) {
        await messagesService.sendMessage(currentConvId, messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  // Offer Functions
  const handleSendOffer = async (offerValue: number) => {
    const offerId = `offer_${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Create offer data
    const offerData: OfferData = {
      id: offerId,
      amount: offerValue,
      status: 'pending',
      senderName: user?.name || 'Voce',
      productTitle: product.title,
      timestamp,
    };

    // Store offer
    setOffers(prev => new Map(prev).set(offerId, offerData));

    // Create offer message
    const offerMessage = {
      id: offerId,
      text: `__OFFER__${JSON.stringify(offerData)}`,
      isMe: true,
      timestamp,
      isOffer: true,
      offerData,
    };

    setMessages(prev => [...prev, offerMessage]);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Send to server (you can implement this in your messages API)
    try {
      let currentConvId = conversationId;

      if (!currentConvId && sellerId) {
        const convResponse = await messagesService.getOrCreateConversation({
          other_user_id: sellerId,
          product_id: productId,
        });

        if (convResponse.success && convResponse.conversation) {
          currentConvId = convResponse.conversation.id;
          setConversationId(currentConvId);
        }
      }

      if (currentConvId) {
        // Send offer as special message format
        await messagesService.sendMessage(
          currentConvId,
          `[OFERTA] R$ ${formatPrice(offerValue)} pelo produto ${product.title}`
        );
      }
    } catch (error) {
      console.error('Error sending offer:', error);
    }
  };

  const handleAcceptOffer = (offerId: string) => {
    setOffers(prev => {
      const newOffers = new Map(prev);
      const offer = newOffers.get(offerId);
      if (offer) {
        newOffers.set(offerId, { ...offer, status: 'accepted' });
      }
      return newOffers;
    });

    // Update message in list
    setMessages(prev => prev.map(msg => {
      if (msg.id === offerId && msg.offerData) {
        return {
          ...msg,
          offerData: { ...msg.offerData, status: 'accepted' as OfferStatus },
        };
      }
      return msg;
    }));

    // Send acceptance message
    const acceptMessage = {
      id: `accept_${Date.now()}`,
      text: 'Oferta aceita! Agora voce pode finalizar a compra.',
      isMe: true,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, acceptMessage]);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleRejectOffer = (offerId: string) => {
    Alert.alert(
      'Recusar oferta',
      'Tem certeza que deseja recusar esta oferta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: () => {
            setOffers(prev => {
              const newOffers = new Map(prev);
              const offer = newOffers.get(offerId);
              if (offer) {
                newOffers.set(offerId, { ...offer, status: 'rejected' });
              }
              return newOffers;
            });

            // Update message in list
            setMessages(prev => prev.map(msg => {
              if (msg.id === offerId && msg.offerData) {
                return {
                  ...msg,
                  offerData: { ...msg.offerData, status: 'rejected' as OfferStatus },
                };
              }
              return msg;
            }));

            // Send rejection message
            const rejectMessage = {
              id: `reject_${Date.now()}`,
              text: 'Infelizmente nao posso aceitar esse valor.',
              isMe: true,
              timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, rejectMessage]);

            setTimeout(() => {
              scrollRef.current?.scrollToEnd({ animated: true });
            }, 100);
          },
        },
      ]
    );
  };

  const handleCounterOffer = (offerId: string, newAmount: number) => {
    setOffers(prev => {
      const newOffers = new Map(prev);
      const offer = newOffers.get(offerId);
      if (offer) {
        newOffers.set(offerId, { ...offer, status: 'countered', counterAmount: newAmount });
      }
      return newOffers;
    });

    // Update message in list
    setMessages(prev => prev.map(msg => {
      if (msg.id === offerId && msg.offerData) {
        return {
          ...msg,
          offerData: {
            ...msg.offerData,
            status: 'countered' as OfferStatus,
            counterAmount: newAmount
          },
        };
      }
      return msg;
    }));

    // Create new counter offer message
    const counterMessage = {
      id: `counter_${Date.now()}`,
      text: `Contra-proposta: R$ ${formatPrice(newAmount)}. O que acha?`,
      isMe: true,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, counterMessage]);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleGoToCheckout = (offerId: string, amount: number) => {
    navigation.navigate('Checkout', {
      productId,
      negotiatedPrice: amount,
      offerId,
    });
  };

  const handleAskMeasures = async () => {
    const measureText = 'Oi! Pode me passar as medidas da peca?';
    setInputText(measureText);

    // Auto send the message
    setSending(true);

    const tempMessage = {
      id: String(Date.now()),
      text: measureText,
      isMe: true,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, tempMessage]);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      let currentConvId = conversationId;

      if (!currentConvId && sellerId) {
        const convResponse = await messagesService.getOrCreateConversation({
          other_user_id: sellerId,
          product_id: productId,
        });

        if (convResponse.success && convResponse.conversation) {
          currentConvId = convResponse.conversation.id;
          setConversationId(currentConvId);
        }
      }

      if (currentConvId) {
        await messagesService.sendMessage(currentConvId, measureText);
      }
    } catch (error) {
      console.error('Error sending measure request:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setSending(false);
      setInputText('');
    }
  };

  // Render message or offer
  const renderMessage = (message: any) => {
    if (message.isOffer && message.offerData) {
      return (
        <OfferMessage
          key={message.id}
          offer={message.offerData}
          isMe={message.isMe}
          isSeller={!message.isMe && isSeller}
          onAccept={handleAcceptOffer}
          onReject={handleRejectOffer}
          onCounter={handleCounterOffer}
          onGoToCheckout={handleGoToCheckout}
        />
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          message.isMe ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text style={[styles.messageText, message.isMe && styles.myMessageText]}>
          {message.text}
        </Text>
        <Text style={[styles.messageTime, message.isMe && styles.myMessageTime]}>
          {message.timestamp}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>

        <Pressable
          style={styles.headerContent}
          onPress={() => sellerId && navigation.navigate('SellerProfile', { sellerId })}
        >
          <View style={styles.avatarContainer}>
            <Image source={{ uri: seller.avatar }} style={styles.headerAvatar} contentFit="cover" />
            {seller.online && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{seller.name}</Text>
            <Text style={[styles.headerStatus, !seller.online && styles.headerStatusOffline]}>
              {isTyping ? 'Digitando...' : (seller.online ? 'Online agora' : 'Offline')}
            </Text>
          </View>
        </Pressable>

        <Pressable style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color="#525252" />
        </Pressable>
      </View>

      {/* Connection Status */}
      {!isConnected && (
        <View style={styles.connectionBar}>
          <Ionicons name="cloud-offline-outline" size={16} color="#F59E0B" />
          <Text style={styles.connectionText}>Reconectando...</Text>
        </View>
      )}

      {/* Product Preview */}
      {productId && (
        <View style={styles.productBar}>
          <Image source={{ uri: product.image }} style={styles.productThumb} contentFit="cover" />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={1}>{product.title}</Text>
            <Text style={styles.productPrice}>R$ {formatPrice(product.price)}</Text>
          </View>
          <Pressable
            style={styles.viewBtn}
            onPress={() => navigation.navigate('ProductDetail', { productId })}
          >
            <Text style={styles.viewBtnText}>Ver</Text>
          </Pressable>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyMessages}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyText}>Inicie a conversa</Text>
            <Text style={styles.emptySubtext}>Envie uma mensagem para o vendedor</Text>
          </View>
        ) : (
          <>
            <View style={styles.dateHeader}>
              <Text style={styles.dateText}>Hoje</Text>
            </View>

            {messages.map((message) => renderMessage(message))}

            {isTyping && (
              <View style={[styles.messageBubble, styles.theirMessage, styles.typingBubble]}>
                <Text style={styles.typingText}>...</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Quick Actions Bar */}
      {productId && !isSeller && (
        <View style={styles.quickActionsBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContent}
          >
            <Pressable
              style={styles.quickActionBtn}
              onPress={() => setShowOfferModal(true)}
            >
              <Ionicons name="cash-outline" size={18} color={colors.primary} />
              <Text style={styles.quickActionText}>Fazer oferta</Text>
            </Pressable>

            <Pressable
              style={styles.quickActionBtn}
              onPress={handleAskMeasures}
              disabled={sending}
            >
              <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.quickActionText}>Perguntar medidas</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={styles.attachBtn}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </Pressable>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#A3A3A3"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
        </View>

        <Pressable
          style={[styles.sendBtn, inputText.trim() && styles.sendBtnActive]}
          onPress={sendMessage}
          disabled={sending}
        >
          <Ionicons name="send" size={20} color={inputText.trim() ? '#fff' : '#A3A3A3'} />
        </Pressable>
      </View>

      {/* Offer Modal */}
      <OfferModal
        visible={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        onSubmit={handleSendOffer}
        product={product}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }
    ),
  } as any,
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  avatarContainer: { position: 'relative' },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#E5E7EB' },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerInfo: { marginLeft: 12, flex: 1 },
  headerName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  headerStatus: { fontSize: 13, color: '#10B981', marginTop: 2 },
  headerStatusOffline: { color: '#EF4444' },
  moreBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Connection Bar
  connectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#FEF3C7',
  },
  connectionText: { fontSize: 13, color: '#92400E', fontWeight: '500' },

  // Product Bar
  productBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  productThumb: { width: 48, height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  productInfo: { flex: 1, marginLeft: 12 },
  productTitle: { fontSize: 14, fontWeight: '500', color: '#374151' },
  productPrice: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 3 },
  viewBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#E8F5F0',
    borderRadius: 10,
  },
  viewBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  // Messages
  messagesContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  messagesContent: { paddingHorizontal: 16, paddingVertical: 20, flexGrow: 1 },
  dateHeader: { alignItems: 'center', marginBottom: 20 },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: '500',
  },

  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    minHeight: 300,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#374151', marginTop: 20 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },

  messageBubble: {
    maxWidth: '75%',
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 2px rgba(93,138,125,0.2)' }
      : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 1 }
    ),
  } as any,
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: { fontSize: 15, color: '#374151', lineHeight: 22 },
  myMessageText: { color: '#fff' },
  messageTime: { fontSize: 11, color: '#9CA3AF', marginTop: 6, alignSelf: 'flex-end' },
  myMessageTime: { color: 'rgba(255,255,255,0.75)' },

  // Typing indicator
  typingBubble: { paddingVertical: 10, paddingHorizontal: 18 },
  typingText: { fontSize: 24, color: '#9CA3AF', letterSpacing: 3 },

  // Quick Actions Bar
  quickActionsBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 10,
  },
  quickActionsContent: {
    paddingHorizontal: 12,
    gap: 10,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 6,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: { fontSize: 15, color: '#111827', minHeight: 24, maxHeight: 80 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.primary,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(93,138,125,0.3)' }
      : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }
    ),
  } as any,
});

export default ChatScreen;
