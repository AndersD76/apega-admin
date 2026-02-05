import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Skeleton, SkeletonCircle, SkeletonText } from './Skeleton';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { colors, spacing } from '../theme';

interface ProfileSkeletonProps {
  showProducts?: boolean;
  productCount?: number;
}

export function ProfileSkeleton({
  showProducts = true,
  productCount = 4,
}: ProfileSkeletonProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const productWidth = (width - 48) / 2;

  const productSkeletons = Array.from({ length: productCount }, (_, i) => i);

  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        {/* Back Button Placeholder */}
        <Skeleton
          width={40}
          height={40}
          borderRadius={20}
          style={styles.backBtn}
        />

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Avatar */}
          <SkeletonCircle size={100} style={styles.avatar} />

          {/* Name Badge */}
          <SkeletonText width={150} height={22} style={styles.name} />

          {/* Location */}
          <View style={styles.locationRow}>
            <SkeletonText width={120} height={14} />
          </View>

          {/* Bio */}
          <SkeletonText width="80%" height={14} style={styles.bio} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <SkeletonText width={30} height={18} />
            <SkeletonText width={50} height={11} style={styles.statLabel} />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <SkeletonText width={30} height={18} />
            <SkeletonText width={45} height={11} style={styles.statLabel} />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <SkeletonText width={30} height={18} />
            <SkeletonText width={60} height={11} style={styles.statLabel} />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <SkeletonText width={30} height={18} />
            <SkeletonText width={55} height={11} style={styles.statLabel} />
          </View>
        </View>
      </LinearGradient>

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <Skeleton width="48%" height={44} borderRadius={22} />
        <Skeleton width="48%" height={44} borderRadius={22} />
      </View>

      {/* Member Since */}
      <View style={styles.memberSince}>
        <SkeletonText width={150} height={13} />
      </View>

      {/* Products Section */}
      {showProducts && (
        <View style={styles.productsSection}>
          <SkeletonText width={180} height={18} style={styles.sectionTitle} />

          <View style={styles.productsGrid}>
            {productSkeletons.map((index) => (
              <ProductCardSkeleton key={index} width={productWidth} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  backBtn: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bio: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  productsSection: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
});

export default ProfileSkeleton;
