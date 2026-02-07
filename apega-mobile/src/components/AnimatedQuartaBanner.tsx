import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  withSpring,
} from 'react-native-reanimated';

// ═══════════════════════════════════════════════════════════════════
// ANIMATED QUARTA DO LARGÔ BANNER
// Premium animated banner with pulsing effects, floating particles,
// and smooth entrance animations using react-native-reanimated
// ═══════════════════════════════════════════════════════════════════

const BRAND = {
  primary: '#C75C3A',
  primaryDark: '#A84B2E',
  primaryLight: '#D4816A',
  white: '#FFFFFF',
  yellow: '#FDE047',
  orange: '#FB923C',
};

interface AnimatedQuartaBannerProps {
  onPress: () => void;
}

// Custom Flash Icon with glow effect
const AnimatedFlashIcon = () => {
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const iconScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Pulsing glow effect
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1000, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(0.2, { duration: 1000 })
      ),
      -1,
      false
    );

    // Icon bounce
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500, easing: Easing.out(Easing.back) }),
        withTiming(1, { duration: 500, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );

    // Subtle rotation
    rotation.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 1500 }),
        withTiming(-5, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  return (
    <View style={styles.flashContainer}>
      {/* Outer glow rings */}
      <Animated.View style={[styles.glowRing, styles.glowRing1, glowStyle]} />
      <Animated.View style={[styles.glowRing, styles.glowRing2, glowStyle]} />

      {/* Main icon container */}
      <Animated.View style={[styles.flashIconWrap, iconStyle]}>
        {/* Flash SVG Path as custom icon */}
        <View style={styles.flashIcon}>
          <View style={styles.flashBolt} />
          <View style={styles.flashBoltShadow} />
        </View>
      </Animated.View>
    </View>
  );
};

// Floating particle component
const FloatingParticle = ({ delay, startX, startY, size }: { delay: number; startX: number; startY: number; size: number }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-40, { duration: 3000, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(Math.random() * 20 - 10, { duration: 3000 }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 500 }),
          withTiming(0.8, { duration: 2000 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(1, { duration: 2000 }),
          withTiming(0.5, { duration: 500 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          bottom: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

// Animated countdown badge
const AnimatedBadge = () => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withSpring(1.05, { damping: 10, stiffness: 100 }),
        withDelay(2000, withSpring(1, { damping: 10, stiffness: 100 }))
      ),
      -1,
      false
    );
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.timeBadge, badgeStyle]}>
      <View style={styles.clockIcon}>
        <View style={styles.clockFace} />
        <View style={styles.clockHand} />
      </View>
      <Text style={styles.timeBadgeText}>TODA QUARTA</Text>
    </Animated.View>
  );
};

// Main Banner Component
export function AnimatedQuartaBanner({ onPress }: AnimatedQuartaBannerProps) {
  const bannerScale = useSharedValue(0.95);
  const bannerOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);
  const shimmerTranslate = useSharedValue(-200);
  const pressed = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    bannerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    bannerOpacity.value = withTiming(1, { duration: 600 });
    contentTranslateY.value = withSpring(0, { damping: 12, stiffness: 80 });

    // Shimmer effect
    shimmerTranslate.value = withRepeat(
      withSequence(
        withTiming(400, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withDelay(1000, withTiming(-200, { duration: 0 }))
      ),
      -1,
      false
    );
  }, []);

  const bannerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bannerScale.value }],
    opacity: bannerOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value }],
  }));

  const pressedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.98]) }],
  }));

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 100 });
  };

  return (
    <Animated.View style={[styles.container, bannerAnimatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={pressedStyle}>
          <LinearGradient
            colors={[BRAND.primary, BRAND.primaryDark, '#8B3D2A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Shimmer overlay */}
            <Animated.View style={[styles.shimmer, shimmerStyle]} />

            {/* Decorative circles */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
            <View style={styles.decorCircle3} />

            {/* Floating particles */}
            <FloatingParticle delay={0} startX={20} startY={10} size={6} />
            <FloatingParticle delay={500} startX={80} startY={20} size={4} />
            <FloatingParticle delay={1000} startX={150} startY={5} size={5} />
            <FloatingParticle delay={1500} startX={220} startY={15} size={4} />
            <FloatingParticle delay={2000} startX={280} startY={8} size={6} />

            {/* Main content */}
            <Animated.View style={[styles.content, contentAnimatedStyle]}>
              {/* Left: Animated Flash Icon */}
              <AnimatedFlashIcon />

              {/* Center: Text content */}
              <View style={styles.textContent}>
                <AnimatedBadge />
                <Text style={styles.title}>Quarta do Largô</Text>
                <Text style={styles.subtitle}>Peças com até 30% OFF • 1h por peça</Text>
              </View>

              {/* Right: CTA Button */}
              <View style={styles.ctaWrap}>
                <View style={styles.ctaButton}>
                  <Text style={styles.ctaText}>Ver</Text>
                  <View style={styles.arrowIcon}>
                    <View style={styles.arrowLine} />
                    <View style={styles.arrowHead} />
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Bottom accent line */}
            <View style={styles.accentLine}>
              <View style={styles.accentDot} />
              <View style={styles.accentLineInner} />
              <View style={styles.accentDot} />
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 16,
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(199, 92, 58, 0.35)' },
      default: { elevation: 8 },
    }),
  },
  gradient: {
    padding: 20,
    paddingVertical: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ skewX: '-20deg' }],
  },
  decorCircle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50,
    right: -30,
  },
  decorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -40,
    left: 20,
  },
  decorCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(253,224,71,0.1)',
    top: 10,
    right: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },

  // Flash Icon styles
  flashContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: BRAND.yellow,
  },
  glowRing1: {
    width: 56,
    height: 56,
  },
  glowRing2: {
    width: 48,
    height: 48,
    borderColor: BRAND.orange,
  },
  flashIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(253,224,71,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(253,224,71,0.4)',
  },
  flashIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBolt: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: BRAND.yellow,
    transform: [{ rotate: '15deg' }],
  },
  flashBoltShadow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: BRAND.orange,
    transform: [{ rotate: '15deg' }, { translateY: 8 }],
  },

  // Text content
  textContent: {
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
    gap: 6,
  },
  clockIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: BRAND.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockFace: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: BRAND.white,
  },
  clockHand: {
    position: 'absolute',
    width: 1,
    height: 4,
    backgroundColor: BRAND.white,
    top: 2,
    transform: [{ rotate: '45deg' }],
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: BRAND.white,
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND.white,
    marginBottom: 4,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },

  // CTA Button
  ctaWrap: {
    marginLeft: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
      default: { elevation: 4 },
    }),
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.primary,
  },
  arrowIcon: {
    width: 16,
    height: 12,
    justifyContent: 'center',
  },
  arrowLine: {
    width: 12,
    height: 2,
    backgroundColor: BRAND.primary,
    borderRadius: 1,
  },
  arrowHead: {
    position: 'absolute',
    right: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: BRAND.primary,
  },

  // Particles
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(253,224,71,0.6)',
  },

  // Accent line
  accentLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  accentLineInner: {
    flex: 1,
    maxWidth: 100,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1,
  },
  accentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});

export default AnimatedQuartaBanner;
