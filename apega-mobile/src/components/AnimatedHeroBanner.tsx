import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
  Extrapolation,
} from 'react-native-reanimated';

// ═══════════════════════════════════════════════════════════════════
// ANIMATED HERO BANNER
// Premium animated hero section with parallax effects, floating elements,
// and smooth entrance animations
// ═══════════════════════════════════════════════════════════════════

const BRAND = {
  primary: '#C75C3A',
  primaryDark: '#A84B2E',
  black: '#0F0F0F',
  white: '#FFFFFF',
};

interface AnimatedHeroBannerProps {
  onExplore: () => void;
}

// Floating fashion item
const FloatingItem = ({ delay, size, x, y, color, shape }: {
  delay: number;
  size: number;
  x: number;
  y: number;
  color: string;
  shape: 'circle' | 'square' | 'diamond';
}) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(15, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    translateX.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(10, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-10, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    if (shape === 'diamond') {
      rotate.value = withDelay(
        delay,
        withRepeat(
          withTiming(360, { duration: 8000, easing: Easing.linear }),
          -1,
          false
        )
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value + (shape === 'diamond' ? 45 : 0)}deg` }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.floatingItem,
        {
          width: size,
          height: size,
          left: x,
          top: y,
          backgroundColor: color,
          borderRadius: shape === 'circle' ? size / 2 : shape === 'square' ? size * 0.2 : 0,
        },
        animatedStyle,
      ]}
    />
  );
};

// Animated text letter
const AnimatedLetter = ({ letter, delay, index }: { letter: string; delay: number; index: number }) => {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    translateY.value = withDelay(delay, withSpring(0, { damping: 12, stiffness: 100 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 10, stiffness: 100 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  if (letter === '\n') {
    return <View style={{ width: '100%', height: 0 }} />;
  }

  return (
    <Animated.Text style={[styles.heroTitleLetter, animatedStyle]}>
      {letter === ' ' ? '\u00A0' : letter}
    </Animated.Text>
  );
};

// Animated tag badge
const AnimatedTagBadge = () => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const shimmer = useSharedValue(-50);

  useEffect(() => {
    scale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));
    opacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    shimmer.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(100, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withDelay(2000, withTiming(-50, { duration: 0 }))
        ),
        -1,
        false
      )
    );
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmer.value }],
  }));

  return (
    <Animated.View style={[styles.tagBadge, badgeStyle]}>
      <Text style={styles.tagText}>MODA CIRCULAR</Text>
      <Animated.View style={[styles.tagShimmer, shimmerStyle]} />
    </Animated.View>
  );
};

// Main Hero Component
export function AnimatedHeroBanner({ onExplore }: AnimatedHeroBannerProps) {
  const containerOpacity = useSharedValue(0);
  const containerScale = useSharedValue(0.95);
  const descOpacity = useSharedValue(0);
  const descTranslateY = useSharedValue(20);
  const ctaScale = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const pressed = useSharedValue(0);

  // Parallax circles
  const circle1Y = useSharedValue(0);
  const circle2Y = useSharedValue(0);
  const circle3Y = useSharedValue(0);

  useEffect(() => {
    // Container entrance
    containerOpacity.value = withTiming(1, { duration: 600 });
    containerScale.value = withSpring(1, { damping: 15, stiffness: 100 });

    // Description
    descOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    descTranslateY.value = withDelay(800, withSpring(0, { damping: 12, stiffness: 80 }));

    // CTA button
    ctaScale.value = withDelay(1000, withSpring(1, { damping: 10, stiffness: 100 }));
    ctaOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));

    // Parallax floating effect for circles
    circle1Y.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    circle2Y.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(25, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-25, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    circle3Y.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(-15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(15, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const descStyle = useAnimatedStyle(() => ({
    opacity: descOpacity.value,
    transform: [{ translateY: descTranslateY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [
      { scale: ctaScale.value * interpolate(pressed.value, [0, 1], [1, 0.95]) }
    ],
  }));

  const circle1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: circle1Y.value }],
  }));

  const circle2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: circle2Y.value }],
  }));

  const circle3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: circle3Y.value }],
  }));

  const title = "Peças únicas,\npreços incríveis";
  const letters = title.split('');

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={['#1A1A1A', '#2D2D2D', '#1F1F1F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Floating fashion items */}
        <FloatingItem delay={0} size={12} x={20} y={30} color="rgba(199, 92, 58, 0.4)" shape="circle" />
        <FloatingItem delay={300} size={8} x={100} y={60} color="rgba(255, 255, 255, 0.2)" shape="circle" />
        <FloatingItem delay={600} size={10} x={60} y={120} color="rgba(199, 92, 58, 0.3)" shape="diamond" />
        <FloatingItem delay={900} size={6} x={140} y={40} color="rgba(255, 255, 255, 0.15)" shape="square" />

        {/* Parallax circles */}
        <Animated.View style={[styles.heroCircle1, circle1Style]} />
        <Animated.View style={[styles.heroCircle2, circle2Style]} />
        <Animated.View style={[styles.heroCircle3, circle3Style]} />

        {/* Content */}
        <View style={styles.content}>
          {/* Tag badge */}
          <AnimatedTagBadge />

          {/* Animated title */}
          <View style={styles.titleContainer}>
            {letters.map((letter, index) => (
              <AnimatedLetter
                key={`${index}-${letter}`}
                letter={letter}
                delay={400 + index * 30}
                index={index}
              />
            ))}
          </View>

          {/* Description */}
          <Animated.Text style={[styles.desc, descStyle]}>
            Compre e venda moda com até 90% off
          </Animated.Text>

          {/* CTA Button */}
          <Animated.View style={ctaStyle}>
            <Pressable
              style={styles.ctaButton}
              onPress={onExplore}
              onPressIn={() => { pressed.value = withTiming(1, { duration: 100 }); }}
              onPressOut={() => { pressed.value = withTiming(0, { duration: 100 }); }}
            >
              <Text style={styles.ctaText}>Explorar</Text>
              <View style={styles.ctaArrow}>
                <View style={styles.arrowLine} />
                <View style={styles.arrowHead} />
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {/* Bottom decorative line */}
        <View style={styles.bottomLine}>
          <View style={styles.lineSegment} />
          <View style={styles.lineDot} />
          <View style={styles.lineSegment} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)' },
      default: { elevation: 12 },
    }),
  },
  gradient: {
    padding: 28,
    minHeight: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  floatingItem: {
    position: 'absolute',
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: BRAND.primary,
    opacity: 0.2,
    right: -60,
    top: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BRAND.primary,
    opacity: 0.35,
    right: 40,
    top: 80,
  },
  heroCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND.white,
    opacity: 0.1,
    right: 120,
    top: 40,
  },
  content: {
    zIndex: 2,
    flex: 1,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(199, 92, 58, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(199, 92, 58, 0.4)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.primary,
    letterSpacing: 2,
  },
  tagShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{ skewX: '-20deg' }],
  },
  titleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  heroTitleLetter: {
    fontSize: 36,
    fontWeight: '800',
    color: BRAND.white,
    lineHeight: 44,
  },
  desc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 24,
    fontWeight: '500',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignSelf: 'flex-start',
    gap: 10,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(255, 255, 255, 0.2)' },
      default: { elevation: 4 },
    }),
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.black,
  },
  ctaArrow: {
    width: 18,
    height: 14,
    justifyContent: 'center',
  },
  arrowLine: {
    width: 14,
    height: 2.5,
    backgroundColor: BRAND.black,
    borderRadius: 1.5,
  },
  arrowHead: {
    position: 'absolute',
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: BRAND.black,
  },
  bottomLine: {
    position: 'absolute',
    bottom: 12,
    left: 28,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lineSegment: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    maxWidth: 80,
  },
  lineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(199, 92, 58, 0.5)',
  },
});

export default AnimatedHeroBanner;
