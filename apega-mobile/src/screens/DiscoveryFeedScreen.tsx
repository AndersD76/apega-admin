import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  useWindowDimensions,
  RefreshControl,
  Share,
  Platform,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { productsService, favoritesService, messagesService } from '../api';
import { formatPrice } from '../utils/format';
import { colors } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Product {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  image?: string;
  image_url?: string;
  brand?: string;
  condition?: string;
  size?: string;
  city?: string;
  state?: string;
  seller_city?: string;
  seller_state?: string;
  seller_id?: string;
  seller_name?: string;
}

interface FeedItemProps {
  item: Product;
  index: number;
  isActive: boolean;
  screenHeight: number;
  screenWidth: number;
  isFavorited: boolean;
  onFavorite: (id: string) => void;
  onChat: (item: Product) => void;
  onShare: (item: Product) => void;
  onPress: (item: Product) => void;
}

function FeedItem({
  item,
  index,
  isActive,
  screenHeight,
  screenWidth,
  isFavorited,
  onFavorite,
  onChat,
  onShare,
  onPress,
}: FeedItemProps) {
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Animation values
  const heartScale = useSharedValue(1);
  const heartOpacity = useSharedValue(1);
  const bigHeartScale = useSharedValue(0);
  const bigHeartOpacity = useSharedValue(0);

  // Heart button animation
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  // Big heart explosion animation
  const bigHeartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bigHeartScale.value }],
    opacity: bigHeartOpacity.value,
  }));

  const triggerHeartAnimation = useCallback(() => {
    // Button pulse
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 3, stiffness: 400 }),
      withSpring(1, { damping: 3, stiffness: 400 })
    );

    // Big heart explosion
    bigHeartScale.value = 0;
    bigHeartOpacity.value = 1;
    bigHeartScale.value = withSequence(
      withSpring(1.2, { damping: 4, stiffness: 200 }),
      withTiming(1.5, { duration: 200, easing: Easing.out(Easing.ease) })
    );
    bigHeartOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) })
    );
  }, [heartScale, bigHeartScale, bigHeartOpacity]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (!isFavorited) {
        onFavorite(item.id);
      }
      triggerHeartAnimation();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      // Single tap - navigate after delay if no second tap
      setTimeout(() => {
        if (lastTapRef.current !== 0 && Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY) {
          onPress(item);
          lastTapRef.current = 0;
        }
      }, DOUBLE_TAP_DELAY);
    }
  }, [isFavorited, item, onFavorite, onPress, triggerHeartAnimation]);

  const handleFavoritePress = useCallback(() => {
    onFavorite(item.id);
    if (!isFavorited) {
      triggerHeartAnimation();
    }
  }, [isFavorited, item.id, onFavorite, triggerHeartAnimation]);

  const imageUrl = item.image_url || item.image || 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800';
  const location = [item.city || item.seller_city, item.state || item.seller_state].filter(Boolean).join(', ') || 'Brasil';
  const conditionLabel = item.condition ? item.condition.charAt(0).toUpperCase() + item.condition.slice(1) : 'Seminovo';

  return (
    <View style={[styles.feedItem, { height: screenHeight, width: screenWidth }]}>
      {/* Main Image - Tappable */}
      <Pressable style={styles.imageContainer} onPress={handleDoubleTap}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.feedImage}
          contentFit="cover"
          transition={300}
        />

        {/* Big Heart Animation (center) */}
        <Animated.View style={[styles.bigHeartContainer, bigHeartAnimatedStyle]}>
          <Ionicons name="heart" size={100} color="#FF6B6B" />
        </Animated.View>
      </Pressable>

      {/* Action Buttons - Right Side */}
      <View style={styles.actionButtons}>
        {/* Favorite Button */}
        <AnimatedPressable
          style={[styles.actionBtn, heartAnimatedStyle]}
          onPress={handleFavoritePress}
        >
          <View style={[styles.actionBtnInner, isFavorited && styles.actionBtnActive]}>
            <Ionicons
              name={isFavorited ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavorited ? '#FF6B6B' : '#fff'}
            />
          </View>
          <Text style={styles.actionLabel}>Quero!</Text>
        </AnimatedPressable>

        {/* Chat Button */}
        <Pressable style={styles.actionBtn} onPress={() => onChat(item)}>
          <View style={styles.actionBtnInner}>
            <Ionicons name="chatbubble-outline" size={26} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Chat</Text>
        </Pressable>

        {/* Share Button */}
        <Pressable style={styles.actionBtn} onPress={() => onShare(item)}>
          <View style={styles.actionBtnInner}>
            <Ionicons name="share-social-outline" size={26} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Enviar</Text>
        </Pressable>
      </View>

      {/* Bottom Overlay with Product Info */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.3, 1]}
        style={styles.bottomOverlay}
      >
        <Pressable style={styles.productInfo} onPress={() => onPress(item)}>
          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>{item.brand || 'Marca'}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Condition & Size */}
          <View style={styles.detailsRow}>
            <View style={styles.conditionBadge}>
              <Ionicons name="sparkles" size={12} color="#FFD700" />
              <Text style={styles.conditionText}>{conditionLabel}</Text>
            </View>
            {item.size && (
              <View style={styles.sizeBadge}>
                <Text style={styles.sizeText}>{item.size}</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>R$ {formatPrice(item.price)}</Text>
            {item.original_price && item.original_price > item.price && (
              <Text style={styles.oldPrice}>R$ {formatPrice(item.original_price)}</Text>
            )}
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        </Pressable>
      </LinearGradient>

      {/* Swipe Hint (only on first item) */}
      {index === 0 && (
        <View style={styles.swipeHint}>
          <Ionicons name="chevron-up" size={24} color="rgba(255,255,255,0.6)" />
          <Text style={styles.swipeHintText}>Deslize para ver mais</Text>
        </View>
      )}
    </View>
  );
}

export function DiscoveryFeedScreen({ navigation }: any) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const flatListRef = useRef<FlatList>(null);

  // Calculate screen height for each item (full screen minus safe areas)
  const screenHeight = height;

  const fetchProducts = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      }

      const res = await productsService.getProducts({
        limit: 10,
        page: pageNum,
        sort: 'recent', // Most recent for discovery
      });

      const newProducts = res.products || [];

      if (refresh || pageNum === 1) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      setHasMore(newProducts.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites(new Set());
      return;
    }

    try {
      const res = await favoritesService.getFavorites();
      const favoriteIds = new Set((res.favorites || []).map((f: any) => f.id));
      setFavorites(favoriteIds);
    } catch {
      setFavorites(new Set());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProducts(1);
    fetchFavorites();
  }, [fetchProducts, fetchFavorites]);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const onRefresh = useCallback(() => {
    fetchProducts(1, true);
    fetchFavorites();
  }, [fetchProducts, fetchFavorites]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchProducts(page + 1);
    }
  }, [loading, hasMore, page, fetchProducts]);

  const handleFavorite = useCallback(async (productId: string) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    const isFavorited = favorites.has(productId);

    // Optimistic update
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (isFavorited) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });

    try {
      if (isFavorited) {
        await favoritesService.removeFavorite(productId);
      } else {
        await favoritesService.addFavorite(productId);
      }
    } catch (error) {
      // Revert on error
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (isFavorited) {
          newFavorites.add(productId);
        } else {
          newFavorites.delete(productId);
        }
        return newFavorites;
      });
      console.error('Error toggling favorite:', error);
    }
  }, [isAuthenticated, favorites, navigation]);

  const handleChat = useCallback(async (item: Product) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    try {
      // Create or get conversation with seller
      const res = await messagesService.getOrCreateConversation({
        other_user_id: item.seller_id || '',
        product_id: item.id
      });
      navigation.navigate('Chat', {
        conversationId: res.conversation?.id,
        productId: item.id,
        productTitle: item.title,
        sellerId: item.seller_id,
        sellerName: item.seller_name || 'Vendedor',
      });
    } catch (error) {
      // Navigate to messages if conversation creation fails
      navigation.navigate('Messages');
    }
  }, [isAuthenticated, navigation]);

  const handleShare = useCallback(async (item: Product) => {
    try {
      const shareUrl = `https://largo.app/produto/${item.id}`;
      const message = `Olha essa peca que achei no Largo: ${item.title} por R$ ${formatPrice(item.price)}`;

      await Share.share({
        message: Platform.OS === 'ios' ? message : `${message}\n${shareUrl}`,
        url: Platform.OS === 'ios' ? shareUrl : undefined,
        title: item.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, []);

  const handleProductPress = useCallback((item: Product) => {
    navigation.navigate('ProductDetail', { productId: item.id });
  }, [navigation]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => (
    <FeedItem
      item={item}
      index={index}
      isActive={index === activeIndex}
      screenHeight={screenHeight}
      screenWidth={width}
      isFavorited={favorites.has(item.id)}
      onFavorite={handleFavorite}
      onChat={handleChat}
      onShare={handleShare}
      onPress={handleProductPress}
    />
  ), [activeIndex, screenHeight, width, favorites, handleFavorite, handleChat, handleShare, handleProductPress]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: screenHeight,
    offset: screenHeight * index,
    index,
  }), [screenHeight]);

  return (
    <View style={styles.container}>
      {/* Header - Floating */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Descoberta</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Feed */}
      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            progressViewOffset={insets.top + 60}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={[styles.emptyState, { height: screenHeight }]}>
              <Ionicons name="images-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>Nenhuma peca por aqui</Text>
              <Text style={styles.emptyText}>Volte mais tarde para descobrir novidades!</Text>
            </View>
          ) : null
        }
      />

      {/* Progress Indicator */}
      <View style={[styles.progressContainer, { top: insets.top + 60 }]}>
        {products.slice(0, Math.min(5, products.length)).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === activeIndex % 5 && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerRight: {
    width: 40,
  },

  // Progress
  progressContainer: {
    position: 'absolute',
    right: 16,
    flexDirection: 'column',
    gap: 6,
  },
  progressDot: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: '#fff',
    height: 24,
  },

  // Feed Item
  feedItem: {
    position: 'relative',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },

  // Big Heart Animation
  bigHeartContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
    zIndex: 50,
  },

  // Action Buttons
  actionButtons: {
    position: 'absolute',
    right: 12,
    bottom: 200,
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionBtnInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionBtnActive: {
    backgroundColor: 'rgba(255,107,107,0.3)',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Bottom Overlay
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  productInfo: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  brandText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  sizeBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  oldPrice: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'line-through',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },

  // Swipe Hint
  swipeHint: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DiscoveryFeedScreen;
