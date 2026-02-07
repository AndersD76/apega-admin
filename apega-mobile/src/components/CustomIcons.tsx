import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  withSpring,
} from 'react-native-reanimated';

// ═══════════════════════════════════════════════════════════════════
// CUSTOM ANIMATED ICONS FOR LARGÔ APP
// Unique icons themed for sustainable fashion/thrift store
// ═══════════════════════════════════════════════════════════════════

const BRAND = {
  primary: '#C75C3A',
  primaryDark: '#A84B2E',
  primaryLight: '#D4816A',
  white: '#FFFFFF',
  yellow: '#FDE047',
  orange: '#FB923C',
  green: '#10B981',
  gray: '#6B7280',
};

interface IconProps {
  size?: number;
  color?: string;
  animated?: boolean;
  style?: ViewStyle;
}

// ═══════════════════════════════════════════════════════════════════
// HANGER ICON - Cabide (símbolo de moda)
// ═══════════════════════════════════════════════════════════════════
export function HangerIcon({ size = 24, color = BRAND.primary, animated = false, style }: IconProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (animated) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-5, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value }
    ],
  }));

  const hookSize = size * 0.3;
  const armWidth = size * 0.35;

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style, animated && animatedStyle]}>
      {/* Hook */}
      <View style={{
        width: hookSize,
        height: hookSize,
        borderWidth: size * 0.08,
        borderColor: color,
        borderRadius: hookSize / 2,
        borderBottomWidth: 0,
        marginBottom: -size * 0.05,
      }} />
      {/* Arms */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{
          width: armWidth,
          height: size * 0.08,
          backgroundColor: color,
          transform: [{ rotate: '25deg' }],
          borderRadius: size * 0.04,
          marginRight: -size * 0.05,
        }} />
        <View style={{
          width: armWidth,
          height: size * 0.08,
          backgroundColor: color,
          transform: [{ rotate: '-25deg' }],
          borderRadius: size * 0.04,
          marginLeft: -size * 0.05,
        }} />
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAG ICON - Etiqueta de Preço
// ═══════════════════════════════════════════════════════════════════
export function PriceTagIcon({ size = 24, color = BRAND.primary, animated = false, style }: IconProps) {
  const swing = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      swing.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(-10, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swing.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, style, animated && animatedStyle]}>
      {/* Tag body */}
      <View style={{
        width: size * 0.7,
        height: size * 0.85,
        backgroundColor: color,
        borderRadius: size * 0.1,
        marginLeft: size * 0.15,
        marginTop: size * 0.1,
      }}>
        {/* Hole */}
        <View style={{
          position: 'absolute',
          top: size * 0.12,
          left: '50%',
          marginLeft: -size * 0.08,
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: size * 0.08,
          backgroundColor: BRAND.white,
        }} />
        {/* Lines */}
        <View style={{
          position: 'absolute',
          top: size * 0.35,
          left: size * 0.12,
          right: size * 0.12,
          height: size * 0.06,
          backgroundColor: 'rgba(255,255,255,0.6)',
          borderRadius: size * 0.03,
        }} />
        <View style={{
          position: 'absolute',
          top: size * 0.48,
          left: size * 0.12,
          right: size * 0.2,
          height: size * 0.06,
          backgroundColor: 'rgba(255,255,255,0.4)',
          borderRadius: size * 0.03,
        }} />
      </View>
      {/* String */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: size * 0.4,
        width: size * 0.04,
        height: size * 0.15,
        backgroundColor: color,
      }} />
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RECYCLE FASHION ICON - Moda Circular/Sustentável
// ═══════════════════════════════════════════════════════════════════
export function RecycleIcon({ size = 24, color = BRAND.green, animated = false, style }: IconProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const arrowSize = size * 0.25;

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style, animated && animatedStyle]}>
      {/* Circular path */}
      <View style={{
        width: size * 0.7,
        height: size * 0.7,
        borderWidth: size * 0.08,
        borderColor: color,
        borderRadius: size * 0.35,
        borderRightColor: 'transparent',
        transform: [{ rotate: '45deg' }],
      }} />
      {/* Arrow heads */}
      <View style={{
        position: 'absolute',
        top: size * 0.08,
        right: size * 0.25,
        width: 0,
        height: 0,
        borderLeftWidth: arrowSize * 0.5,
        borderRightWidth: arrowSize * 0.5,
        borderBottomWidth: arrowSize,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: color,
        transform: [{ rotate: '-30deg' }],
      }} />
      {/* Leaf in center */}
      <View style={{
        position: 'absolute',
        width: size * 0.2,
        height: size * 0.3,
        backgroundColor: color,
        borderTopLeftRadius: size * 0.15,
        borderBottomRightRadius: size * 0.15,
        opacity: 0.7,
      }} />
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DRESS ICON - Vestido
// ═══════════════════════════════════════════════════════════════════
export function DressIcon({ size = 24, color = BRAND.primary, animated = false, style }: IconProps) {
  const sway = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      sway.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(-3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center' }, style, animated && animatedStyle]}>
      {/* Collar/straps */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: -size * 0.02 }}>
        <View style={{
          width: size * 0.1,
          height: size * 0.2,
          backgroundColor: color,
          transform: [{ rotate: '-15deg' }],
          borderTopLeftRadius: size * 0.05,
          borderTopRightRadius: size * 0.05,
          marginRight: size * 0.1,
        }} />
        <View style={{
          width: size * 0.1,
          height: size * 0.2,
          backgroundColor: color,
          transform: [{ rotate: '15deg' }],
          borderTopLeftRadius: size * 0.05,
          borderTopRightRadius: size * 0.05,
        }} />
      </View>
      {/* Bodice */}
      <View style={{
        width: size * 0.4,
        height: size * 0.25,
        backgroundColor: color,
        borderTopLeftRadius: size * 0.1,
        borderTopRightRadius: size * 0.1,
      }} />
      {/* Skirt */}
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.35,
        borderRightWidth: size * 0.35,
        borderTopWidth: size * 0.45,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: color,
        marginTop: -size * 0.02,
      }} />
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHOPPING BAG ICON - Sacola de Compras
// ═══════════════════════════════════════════════════════════════════
export function ShoppingBagIcon({ size = 24, color = BRAND.primary, animated = false, style }: IconProps) {
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      bounce.value = withRepeat(
        withSequence(
          withSpring(-3, { damping: 5, stiffness: 200 }),
          withSpring(0, { damping: 5, stiffness: 200 })
        ),
        -1,
        true
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style, animated && animatedStyle]}>
      {/* Handle */}
      <View style={{
        width: size * 0.4,
        height: size * 0.25,
        borderWidth: size * 0.08,
        borderColor: color,
        borderBottomWidth: 0,
        borderTopLeftRadius: size * 0.2,
        borderTopRightRadius: size * 0.2,
        marginBottom: -size * 0.05,
      }} />
      {/* Bag body */}
      <View style={{
        width: size * 0.7,
        height: size * 0.55,
        backgroundColor: color,
        borderRadius: size * 0.08,
        borderTopLeftRadius: size * 0.05,
        borderTopRightRadius: size * 0.05,
      }}>
        {/* Shine effect */}
        <View style={{
          position: 'absolute',
          top: size * 0.08,
          left: size * 0.08,
          width: size * 0.15,
          height: size * 0.3,
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: size * 0.02,
          transform: [{ rotate: '-20deg' }],
        }} />
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HEART WITH CLOTHES ICON - Favoritos de Moda
// ═══════════════════════════════════════════════════════════════════
export function HeartClothesIcon({ size = 24, color = '#EF4444', animated = false, style }: IconProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (animated) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 300 }),
          withTiming(1, { duration: 300 }),
          withDelay(800, withTiming(1, { duration: 0 }))
        ),
        -1,
        false
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style, animated && animatedStyle]}>
      {/* Heart shape using circles and triangle */}
      <View style={{ flexDirection: 'row', marginBottom: -size * 0.15 }}>
        <View style={{
          width: size * 0.4,
          height: size * 0.4,
          backgroundColor: color,
          borderRadius: size * 0.2,
          marginRight: -size * 0.1,
        }} />
        <View style={{
          width: size * 0.4,
          height: size * 0.4,
          backgroundColor: color,
          borderRadius: size * 0.2,
        }} />
      </View>
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.35,
        borderRightWidth: size * 0.35,
        borderTopWidth: size * 0.45,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: color,
        transform: [{ rotate: '180deg' }],
      }} />
      {/* Small hanger icon in center */}
      <View style={{
        position: 'absolute',
        top: size * 0.3,
        width: size * 0.3,
        height: size * 0.04,
        backgroundColor: BRAND.white,
        borderRadius: size * 0.02,
      }} />
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FLASH SALE ICON - Raio de Promoção
// ═══════════════════════════════════════════════════════════════════
export function FlashSaleIcon({ size = 24, color = BRAND.yellow, animated = false, style }: IconProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    if (animated) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back) }),
          withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.5, { duration: 400 })
        ),
        -1,
        false
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style, animated && animatedStyle]}>
      {/* Glow circle */}
      {animated && (
        <Animated.View style={[{
          position: 'absolute',
          width: size * 1.3,
          height: size * 1.3,
          borderRadius: size * 0.65,
          backgroundColor: color,
        }, glowStyle]} />
      )}
      {/* Lightning bolt */}
      <View style={{
        width: size * 0.5,
        height: size * 0.8,
        alignItems: 'center',
      }}>
        {/* Top part */}
        <View style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.2,
          borderRightWidth: size * 0.05,
          borderBottomWidth: size * 0.4,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: animated ? BRAND.white : color,
        }} />
        {/* Bottom part */}
        <View style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.05,
          borderRightWidth: size * 0.2,
          borderTopWidth: size * 0.4,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: animated ? BRAND.white : color,
          marginTop: -size * 0.1,
          marginLeft: size * 0.1,
        }} />
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PERCENTAGE DISCOUNT ICON
// ═══════════════════════════════════════════════════════════════════
export function DiscountIcon({ size = 24, color = BRAND.green, animated = false, style }: IconProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 500 }),
          withTiming(-10, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      );
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style, animated && animatedStyle]}>
      {/* Circle background */}
      <View style={{
        width: size * 0.9,
        height: size * 0.9,
        borderRadius: size * 0.45,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Percentage slash */}
        <View style={{
          width: size * 0.5,
          height: size * 0.08,
          backgroundColor: BRAND.white,
          transform: [{ rotate: '-45deg' }],
        }} />
        {/* Top circle */}
        <View style={{
          position: 'absolute',
          top: size * 0.18,
          left: size * 0.18,
          width: size * 0.18,
          height: size * 0.18,
          borderRadius: size * 0.09,
          backgroundColor: BRAND.white,
        }} />
        {/* Bottom circle */}
        <View style={{
          position: 'absolute',
          bottom: size * 0.18,
          right: size * 0.18,
          width: size * 0.18,
          height: size * 0.18,
          borderRadius: size * 0.09,
          backgroundColor: BRAND.white,
        }} />
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TIMER/CLOCK ICON - Para contagem regressiva
// ═══════════════════════════════════════════════════════════════════
export function TimerIcon({ size = 24, color = BRAND.primary, animated = false, style }: IconProps) {
  const handRotation = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      handRotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [animated]);

  const handStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${handRotation.value}deg` }],
  }));

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Clock face */}
      <View style={{
        width: size * 0.85,
        height: size * 0.85,
        borderRadius: size * 0.425,
        borderWidth: size * 0.08,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Center dot */}
        <View style={{
          width: size * 0.12,
          height: size * 0.12,
          borderRadius: size * 0.06,
          backgroundColor: color,
        }} />
        {/* Animated hand */}
        <Animated.View style={[{
          position: 'absolute',
          width: size * 0.06,
          height: size * 0.28,
          backgroundColor: color,
          borderRadius: size * 0.03,
          bottom: '50%',
          transformOrigin: 'bottom',
        }, animated && handStyle]} />
        {/* Top button */}
        <View style={{
          position: 'absolute',
          top: -size * 0.12,
          width: size * 0.15,
          height: size * 0.1,
          backgroundColor: color,
          borderRadius: size * 0.02,
        }} />
      </View>
    </View>
  );
}

export default {
  HangerIcon,
  PriceTagIcon,
  RecycleIcon,
  DressIcon,
  ShoppingBagIcon,
  HeartClothesIcon,
  FlashSaleIcon,
  DiscountIcon,
  TimerIcon,
};
