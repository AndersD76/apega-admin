import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

// Skeleton colors
const LIGHT_MODE = {
  background: '#E8E8E8',
  shimmer: ['#F5F5F5', '#E8E8E8', '#F5F5F5'],
};

const DARK_MODE = {
  background: '#3D3632',
  shimmer: ['#4D4642', '#3D3632', '#4D4642'],
};

export function Skeleton({
  width,
  height,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? DARK_MODE : LIGHT_MODE;

  const translateX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [translateX]);

  const animatedStyle = {
    transform: [
      {
        translateX: translateX.interpolate({
          inputRange: [-1, 1],
          outputRange: [-200, 200],
        }),
      },
    ],
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
        <LinearGradient
          colors={colors.shimmer as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  );
}

// Skeleton Circle variant
export function SkeletonCircle({
  size,
  style,
}: {
  size: number;
  style?: ViewStyle;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

// Skeleton Text variant (for text lines)
export function SkeletonText({
  width = '100%',
  height = 14,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={4}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '200%',
  },
  shimmer: {
    flex: 1,
    width: '100%',
  },
});

export default Skeleton;
