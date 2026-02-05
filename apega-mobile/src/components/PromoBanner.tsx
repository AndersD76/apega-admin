import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PromoBannerProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  onPress?: () => void;
  gradientColors?: readonly [string, string, ...string[]];
  imageUrl?: string;
  variant?: 'large' | 'medium' | 'small';
}

export function PromoBanner({
  title,
  subtitle,
  buttonText = 'Ver agora',
  onPress,
  gradientColors = [colors.primary, colors.primaryLight] as const,
  imageUrl,
  variant = 'large',
}: PromoBannerProps) {
  const height = variant === 'large' ? 180 : variant === 'medium' ? 140 : 100;

  return (
    <Pressable style={[styles.container, { height }]} onPress={onPress}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.backgroundImage}
            contentFit="cover"
          />
        )}

        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, variant === 'small' && styles.titleSmall]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, variant === 'small' && styles.subtitleSmall]}>
                {subtitle}
              </Text>
            )}
          </View>

          {buttonText && variant !== 'small' && (
            <View style={styles.button}>
              <Text style={styles.buttonText}>{buttonText}</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
      </LinearGradient>
    </Pressable>
  );
}

interface HeroBannerProps {
  onSellPress?: () => void;
}

export function HeroBanner({ onSellPress }: HeroBannerProps) {
  return (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Largou?{'\n'}Pegou!</Text>
            <Text style={styles.heroSubtitle}>
              Moda circular para um mundo melhor
            </Text>
            <Pressable style={styles.heroButton} onPress={onSellPress}>
              <Text style={styles.heroButtonText}>Bora largar!</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </Pressable>
          </View>

          {/* Decorative elements */}
          <View style={styles.heroDecor}>
            <View style={[styles.heroCircle, styles.heroCircle1]} />
            <View style={[styles.heroCircle, styles.heroCircle2]} />
            <View style={[styles.heroCircle, styles.heroCircle3]} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  gradient: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  titleSmall: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  subtitleSmall: {
    fontSize: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  circle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle1: {
    width: 100,
    height: 100,
    top: -30,
    right: -20,
  },
  circle2: {
    width: 60,
    height: 60,
    bottom: -20,
    right: 60,
  },

  // Hero Banner
  heroContainer: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    ...shadows.xl,
  },
  heroGradient: {
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 38,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  heroDecor: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 150,
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroCircle1: {
    width: 120,
    height: 120,
    top: 20,
    right: -40,
  },
  heroCircle2: {
    width: 80,
    height: 80,
    top: 80,
    right: 40,
  },
  heroCircle3: {
    width: 40,
    height: 40,
    bottom: 30,
    right: 20,
  },
});

export default PromoBanner;
