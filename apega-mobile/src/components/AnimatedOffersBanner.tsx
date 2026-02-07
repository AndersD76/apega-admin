import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
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
} from 'react-native-reanimated';

// ═══════════════════════════════════════════════════════════════════
// ANIMATED OFFERS BANNER
// Premium animated banner for the "Faça ofertas" section
// ═══════════════════════════════════════════════════════════════════

const BRAND = {
  primary: '#C75C3A',
  primaryLight: '#D4816A',
  white: '#FFFFFF',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray400: '#A1A1AA',
  gray900: '#18181B',
};

interface AnimatedOffersBannerProps {
  onPress: () => void;
}

// Animated money icon
const AnimatedMoneyIcon = () => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const coinY = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-10, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );

    coinY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 800, easing: Easing.in(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value }
    ],
  }));

  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: coinY.value }],
  }));

  return (
    <Animated.View style={[styles.iconContainer, iconStyle]}>
      {/* Hand base */}
      <View style={styles.handBase} />
      {/* Coins */}
      <Animated.View style={[styles.coinStack, coinStyle]}>
        <View style={[styles.coin, { bottom: 0 }]} />
        <View style={[styles.coin, { bottom: 6 }]} />
        <View style={[styles.coin, styles.coinTop]} />
      </Animated.View>
      {/* Money sign */}
      <View style={styles.moneySign}>
        <Text style={styles.moneyText}>R$</Text>
      </View>
    </Animated.View>
  );
};

// Floating coin particle
const FloatingCoin = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-30, { duration: 2000, easing: Easing.out(Easing.ease) }),
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
          withTiming(0.8, { duration: 300 }),
          withTiming(0.8, { duration: 1400 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      )
    );

    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.floatingCoin, { left: startX }, style]}>
      <View style={styles.miniCoin} />
    </Animated.View>
  );
};

// Animated arrow
const AnimatedArrow = () => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 600, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.arrowContainer, style]}>
      <View style={styles.arrowLine} />
      <View style={styles.arrowHead} />
    </Animated.View>
  );
};

export function AnimatedOffersBanner({ onPress }: AnimatedOffersBannerProps) {
  const containerScale = useSharedValue(0.98);
  const containerOpacity = useSharedValue(0);
  const borderWidth = useSharedValue(1);
  const pressed = useSharedValue(0);

  useEffect(() => {
    containerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    containerOpacity.value = withTiming(1, { duration: 500 });

    // Subtle border pulse
    borderWidth.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [
      { scale: containerScale.value * interpolate(pressed.value, [0, 1], [1, 0.98]) }
    ],
    borderWidth: borderWidth.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { pressed.value = withTiming(1, { duration: 100 }); }}
      onPressOut={() => { pressed.value = withTiming(0, { duration: 100 }); }}
    >
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Floating coins */}
        <FloatingCoin delay={0} startX={20} />
        <FloatingCoin delay={700} startX={80} />
        <FloatingCoin delay={1400} startX={50} />

        {/* Background gradient accent */}
        <View style={styles.gradientAccent} />

        {/* Icon */}
        <AnimatedMoneyIcon />

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Faça ofertas!</Text>
          <Text style={styles.subtitle}>Negocie direto com vendedores</Text>
        </View>

        {/* Arrow */}
        <AnimatedArrow />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 18,
    borderColor: BRAND.gray200,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' },
      default: { elevation: 2 },
    }),
  },
  gradientAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: BRAND.primary,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  handBase: {
    position: 'absolute',
    bottom: 8,
    width: 24,
    height: 12,
    backgroundColor: BRAND.primary,
    borderRadius: 6,
    opacity: 0.3,
  },
  coinStack: {
    position: 'relative',
    width: 20,
    height: 24,
    alignItems: 'center',
  },
  coin: {
    position: 'absolute',
    width: 18,
    height: 8,
    backgroundColor: BRAND.primary,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BRAND.primaryLight,
  },
  coinTop: {
    bottom: 12,
    backgroundColor: BRAND.primaryLight,
    borderColor: BRAND.primary,
  },
  moneySign: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: BRAND.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  moneyText: {
    fontSize: 8,
    fontWeight: '800',
    color: BRAND.white,
  },
  floatingCoin: {
    position: 'absolute',
    bottom: 10,
  },
  miniCoin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.primary,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.gray900,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: BRAND.gray400,
    fontWeight: '500',
  },
  arrowContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLine: {
    width: 14,
    height: 2,
    backgroundColor: BRAND.gray400,
    borderRadius: 1,
  },
  arrowHead: {
    position: 'absolute',
    right: 2,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: BRAND.gray400,
  },
});

export default AnimatedOffersBanner;
