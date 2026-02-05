import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import { SELLER_BADGES, getBadgesByIds, SellerBadge } from '../constants/badges';
import { BadgeTooltip } from './BadgeTooltip';

type BadgeSize = 'sm' | 'md' | 'lg';

interface SellerBadgesProps {
  badges: string[]; // Array de badge IDs
  size?: BadgeSize;
  showLabels?: boolean;
  maxBadges?: number;
  showAllBadges?: boolean; // Para mostrar badges nao conquistados (cinza)
  earnedBadges?: string[]; // Badges conquistados (quando showAllBadges = true)
}

const SIZE_CONFIG = {
  sm: {
    containerPadding: spacing.xs,
    iconSize: 12,
    emojiSize: 12,
    fontSize: 10,
    gap: spacing.xs,
    badgeHeight: 24,
    badgePaddingH: spacing.sm,
  },
  md: {
    containerPadding: spacing.sm,
    iconSize: 16,
    emojiSize: 16,
    fontSize: 12,
    gap: spacing.sm,
    badgeHeight: 32,
    badgePaddingH: spacing.md,
  },
  lg: {
    containerPadding: spacing.md,
    iconSize: 20,
    emojiSize: 20,
    fontSize: 14,
    gap: spacing.md,
    badgeHeight: 40,
    badgePaddingH: spacing.lg,
  },
};

export function SellerBadges({
  badges,
  size = 'md',
  showLabels = false,
  maxBadges = 3,
  showAllBadges = false,
  earnedBadges = [],
}: SellerBadgesProps) {
  const [selectedBadge, setSelectedBadge] = useState<SellerBadge | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const config = SIZE_CONFIG[size];

  // Se showAllBadges, mostrar todos os badges
  // Caso contrario, mostrar apenas os badges conquistados
  const badgesToShow = showAllBadges
    ? SELLER_BADGES
    : getBadgesByIds(badges).slice(0, maxBadges);

  const handleBadgePress = (badge: SellerBadge) => {
    setSelectedBadge(badge);
    setTooltipVisible(true);
  };

  const closeTooltip = () => {
    setTooltipVisible(false);
    setSelectedBadge(null);
  };

  if (badgesToShow.length === 0 && !showAllBadges) {
    return null;
  }

  return (
    <>
      <View style={[styles.container, { gap: config.gap }]}>
        {badgesToShow.map((badge) => {
          const isEarned = showAllBadges
            ? earnedBadges.includes(badge.id)
            : true;

          return (
            <Pressable
              key={badge.id}
              style={[
                styles.badge,
                {
                  height: config.badgeHeight,
                  paddingHorizontal: showLabels ? config.badgePaddingH : config.containerPadding + 4,
                  backgroundColor: isEarned ? `${badge.color}15` : colors.gray100,
                  borderColor: isEarned ? `${badge.color}30` : colors.gray200,
                },
              ]}
              onPress={() => handleBadgePress(badge)}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isEarned ? badge.color : colors.gray400,
                    width: config.iconSize + 8,
                    height: config.iconSize + 8,
                    borderRadius: (config.iconSize + 8) / 2,
                  },
                ]}
              >
                <Ionicons
                  name={badge.icon as any}
                  size={config.iconSize - 2}
                  color={colors.white}
                />
              </View>

              {showLabels && (
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: config.fontSize,
                      color: isEarned ? badge.color : colors.gray400,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {badge.name}
                </Text>
              )}
            </Pressable>
          );
        })}

        {/* Indicador de mais badges */}
        {!showAllBadges && badges.length > maxBadges && (
          <View
            style={[
              styles.moreBadge,
              {
                height: config.badgeHeight,
                paddingHorizontal: config.containerPadding + 4,
              },
            ]}
          >
            <Text style={[styles.moreText, { fontSize: config.fontSize }]}>
              +{badges.length - maxBadges}
            </Text>
          </View>
        )}
      </View>

      <BadgeTooltip
        badge={selectedBadge}
        visible={tooltipVisible}
        onClose={closeTooltip}
      />
    </>
  );
}

// Componente compacto que mostra apenas emojis
interface CompactBadgesProps {
  badges: string[];
  maxBadges?: number;
}

export function CompactBadges({ badges, maxBadges = 3 }: CompactBadgesProps) {
  const [selectedBadge, setSelectedBadge] = useState<SellerBadge | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const badgesToShow = getBadgesByIds(badges).slice(0, maxBadges);

  const handleBadgePress = (badge: SellerBadge) => {
    setSelectedBadge(badge);
    setTooltipVisible(true);
  };

  const closeTooltip = () => {
    setTooltipVisible(false);
    setSelectedBadge(null);
  };

  if (badgesToShow.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.compactContainer}>
        {badgesToShow.map((badge) => (
          <Pressable
            key={badge.id}
            onPress={() => handleBadgePress(badge)}
            style={styles.compactBadge}
          >
            <Text style={styles.compactEmoji}>{badge.emoji}</Text>
          </Pressable>
        ))}
        {badges.length > maxBadges && (
          <Text style={styles.compactMore}>+{badges.length - maxBadges}</Text>
        )}
      </View>

      <BadgeTooltip
        badge={selectedBadge}
        visible={tooltipVisible}
        onClose={closeTooltip}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
  },
  moreBadge: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  moreText: {
    color: colors.gray500,
    fontWeight: '600',
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  compactBadge: {
    padding: 2,
  },
  compactEmoji: {
    fontSize: 14,
  },
  compactMore: {
    fontSize: 11,
    color: colors.gray500,
    marginLeft: 2,
  },
});

export default SellerBadges;
