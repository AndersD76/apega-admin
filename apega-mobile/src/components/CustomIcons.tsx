import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

// ═══════════════════════════════════════════════════════════════════
// CUSTOM SVG ICONS FOR LARGÔ APP
// Simple, clean SVG icons themed for sustainable fashion/thrift store
// ═══════════════════════════════════════════════════════════════════

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// ═══════════════════════════════════════════════════════════════════
// HANGER ICON - Cabide (símbolo de moda)
// ═══════════════════════════════════════════════════════════════════
export function HangerIcon({ size = 24, color = '#C75C3A', style }: IconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2C10.9 2 10 2.9 10 4C10 4.74 10.4 5.39 11 5.73V7L3.5 13.5C3.18 13.78 3 14.17 3 14.58V15C3 15.55 3.45 16 4 16H20C20.55 16 21 15.55 21 15V14.58C21 14.17 20.82 13.78 20.5 13.5L13 7V5.73C13.6 5.39 14 4.74 14 4C14 2.9 13.1 2 12 2Z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DRESS ICON - Vestido
// ═══════════════════════════════════════════════════════════════════
export function DressIcon({ size = 24, color = '#C75C3A', style }: IconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M8 2L6 8L2 22H22L18 8L16 2"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M8 2C8 2 9 4 12 4C15 4 16 2 16 2"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M6 8H18"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHOPPING BAG ICON - Sacola de Compras
// ═══════════════════════════════════════════════════════════════════
export function ShoppingBagIcon({ size = 24, color = '#C75C3A', style }: IconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M3 6H21"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RECYCLE ICON - Moda Circular/Sustentável
// ═══════════════════════════════════════════════════════════════════
export function RecycleIcon({ size = 24, color = '#C75C3A', style }: IconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M7 19H4.5C3.83696 19 3.20107 18.7366 2.73223 18.2678C2.26339 17.7989 2 17.163 2 16.5V16.5C2 15.837 2.26339 15.2011 2.73223 14.7322C3.20107 14.2634 3.83696 14 4.5 14H7"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M17 5H19.5C20.163 5 20.7989 5.26339 21.2678 5.73223C21.7366 6.20107 22 6.83696 22 7.5V7.5C22 8.16304 21.7366 8.79893 21.2678 9.26777C20.7989 9.73661 20.163 10 19.5 10H17"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 22V14"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 2V10"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 17L12 14L15 17"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 7L12 10L15 7"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M4 11L7 14L4 17"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M20 7L17 10L20 13"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PRICE TAG ICON - Etiqueta de Preço
// ═══════════════════════════════════════════════════════════════════
export function PriceTagIcon({ size = 24, color = '#C75C3A', style }: IconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1148 12.2678 21.1666 12.005 21.1666C11.7422 21.1666 11.4819 21.1148 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V2H12L20.59 10.59C20.9625 10.9647 21.1716 11.4716 21.1716 12C21.1716 12.5284 20.9625 13.0353 20.59 13.41Z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Circle cx="7" cy="7" r="1.5" fill={color} />
      </Svg>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HEART CLOTHES ICON - Favoritos de Moda
// ═══════════════════════════════════════════════════════════════════
export function HeartClothesIcon({ size = 24, color = '#EF4444', style }: IconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22249 22.4518 8.5C22.4518 7.77751 22.3095 7.0621 22.0329 6.39464C21.7563 5.72718 21.351 5.12075 20.84 4.61Z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M8 12H16"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FLASH SALE ICON - Raio de Promoção
// ═══════════════════════════════════════════════════════════════════
export function FlashSaleIcon({ size = 24, color = '#FDE047', style }: IconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={color}
          fillOpacity={0.2}
        />
      </Svg>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DISCOUNT ICON - Porcentagem de desconto
// ═══════════════════════════════════════════════════════════════════
export function DiscountIcon({ size = 24, color = '#10B981', style }: IconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} fill="none" />
        <Path
          d="M8 16L16 8"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Circle cx="9" cy="9" r="2" stroke={color} strokeWidth={2} fill="none" />
        <Circle cx="15" cy="15" r="2" stroke={color} strokeWidth={2} fill="none" />
      </Svg>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TIMER ICON - Timer/contagem regressiva
// ═══════════════════════════════════════════════════════════════════
export function TimerIcon({ size = 24, color = '#C75C3A', style }: IconProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="13" r="8" stroke={color} strokeWidth={2} fill="none" />
        <Path
          d="M12 9V13L15 15"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 2H15"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d="M12 2V4"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
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
