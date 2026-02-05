import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton, SkeletonCircle, SkeletonText } from './Skeleton';
import { spacing } from '../theme';

interface ChatListItemSkeletonProps {
  showProductPreview?: boolean;
}

function ChatListItemSkeleton({ showProductPreview = true }: ChatListItemSkeletonProps) {
  return (
    <View style={styles.conversationCard}>
      {/* Avatar */}
      <SkeletonCircle size={52} />

      {/* Content */}
      <View style={styles.conversationContent}>
        {/* Header Row - Name and Time */}
        <View style={styles.conversationHeader}>
          <SkeletonText width="50%" height={15} />
          <SkeletonText width={40} height={12} />
        </View>

        {/* Product Preview (optional) */}
        {showProductPreview && (
          <View style={styles.productPreview}>
            <Skeleton width={20} height={20} borderRadius={4} />
            <SkeletonText width="60%" height={12} style={styles.productName} />
          </View>
        )}

        {/* Last Message */}
        <View style={styles.messageRow}>
          <SkeletonText width="80%" height={14} />
        </View>
      </View>
    </View>
  );
}

interface ChatListSkeletonProps {
  count?: number;
  showProductPreview?: boolean;
}

export function ChatListSkeleton({
  count = 5,
  showProductPreview = true,
}: ChatListSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, index) => index);

  return (
    <View style={styles.container}>
      {skeletons.map((index) => (
        <View key={index}>
          <ChatListItemSkeleton showProductPreview={showProductPreview} />
          {index < count - 1 && <View style={styles.separator} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  conversationCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  productName: {
    marginLeft: 6,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginLeft: 80,
  },
});

export default ChatListSkeleton;
