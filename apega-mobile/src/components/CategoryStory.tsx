import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors, spacing, radius } from '../theme';
import { Category } from '../api';

// Default categories with icons (used when no image)
const categoryIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  roupas: 'shirt-outline',
  vestidos: 'shirt-outline',
  calcados: 'footsteps-outline',
  bolsas: 'bag-handle-outline',
  acessorios: 'watch-outline',
  joias: 'diamond-outline',
  esportes: 'fitness-outline',
  infantil: 'happy-outline',
  masculino: 'man-outline',
  feminino: 'woman-outline',
  default: 'pricetag-outline',
};

interface CategoryStoryProps {
  categories: Category[];
  onCategoryPress: (category: Category) => void;
}

export function CategoryStories({ categories, onCategoryPress }: CategoryStoryProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* All Categories */}
      <Pressable
        style={styles.storyItem}
        onPress={() => onCategoryPress({ id: 'all', name: 'Todos', slug: 'all' } as Category)}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={styles.storyBorder}
        >
          <View style={styles.storyInner}>
            <Ionicons name="grid-outline" size={24} color={colors.primary} />
          </View>
        </LinearGradient>
        <Text style={styles.storyLabel}>Todos</Text>
      </Pressable>

      {categories.map((category) => {
        const iconName = categoryIcons[category.slug] || categoryIcons.default;

        return (
          <Pressable
            key={category.id}
            style={styles.storyItem}
            onPress={() => onCategoryPress(category)}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              style={styles.storyBorder}
            >
              <View style={styles.storyInner}>
                {category.image_url ? (
                  <Image
                    source={{ uri: category.image_url }}
                    style={styles.storyImage}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name={iconName} size={24} color={colors.primary} />
                )}
              </View>
            </LinearGradient>
            <Text style={styles.storyLabel} numberOfLines={1}>
              {category.name}
            </Text>
            {category.product_count !== undefined && category.product_count > 0 && (
              <Text style={styles.storyCount}>{category.product_count}</Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

interface SingleCategoryStoryProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isActive?: boolean;
}

export function CategoryStory({ icon, label, onPress, isActive }: SingleCategoryStoryProps) {
  return (
    <Pressable style={styles.storyItem} onPress={onPress}>
      <LinearGradient
        colors={isActive ? [colors.primary, colors.primaryLight] : [colors.gray300, colors.gray200]}
        style={styles.storyBorder}
      >
        <View style={styles.storyInner}>
          <Ionicons name={icon} size={24} color={isActive ? colors.primary : colors.gray500} />
        </View>
      </LinearGradient>
      <Text style={[styles.storyLabel, isActive && styles.storyLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const STORY_SIZE = 70;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  storyItem: {
    alignItems: 'center',
    width: STORY_SIZE,
  },
  storyBorder: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    padding: 3,
  },
  storyInner: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: (STORY_SIZE - 6) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyLabel: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.gray600,
    textAlign: 'center',
    fontWeight: '500',
  },
  storyLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  storyCount: {
    fontSize: 10,
    color: colors.gray400,
  },
});

export default CategoryStories;
