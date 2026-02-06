import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { colors } from '../theme';

interface LogoProps {
  size?: number;
  showText?: boolean;
  color?: string;
}

export function Logo({ size = 32, showText = true, color = colors.primary }: LogoProps) {
  return (
    <View style={styles.container}>
      {/* Logo Icon - Stylized hanger with heart */}
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <G>
          {/* Hanger hook */}
          <Path
            d="M24 4C22.5 4 21 5.5 21 7C21 8.5 22 9.5 23 10L23 14"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* Hanger body */}
          <Path
            d="M8 28L24 16L40 28"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Heart in center */}
          <Path
            d="M24 38C24 38 32 32 32 26C32 23 30 21 27 21C25 21 24 22.5 24 22.5C24 22.5 23 21 21 21C18 21 16 23 16 26C16 32 24 38 24 38Z"
            fill={color}
          />
          {/* Sustainability leaf accent */}
          <Path
            d="M38 36C38 36 42 32 42 28C40 30 38 32 38 36Z"
            fill={colors.success}
          />
        </G>
      </Svg>

      {showText && (
        <Text style={[styles.text, { color }]}>Largô</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
  },
});

export default Logo;
