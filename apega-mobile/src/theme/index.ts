// Largô - Design System
// Marketplace de moda sustentável brasileiro

import { Platform } from 'react-native';

// Font family configuration for Nunito
export const fontFamily = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
};

// Light mode colors (default)
export const lightColors = {
  // Primary brand colors (Terracotta)
  primary: '#C75C3A',
  primaryLight: '#E8845A',
  primaryDark: '#A44A2E',
  primaryMuted: '#FFF0E8',

  // Background & Surface
  background: '#FFF8F0',
  surface: '#FEFCF9',

  // Text colors
  text: '#2D2926',
  textSecondary: '#6B5E57',
  textMuted: '#9B8E86',

  // Border
  border: '#D4CBC4',

  // Neutrals
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E8E8E8',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#171717',

  // Status colors
  success: '#5B8C5A',
  successLight: '#E8F5E8',
  warning: '#F2C94C',
  warningLight: '#FEF9E7',
  error: '#D94F4F',
  errorLight: '#FEE8E8',
  info: '#4A90A4',
  infoLight: '#E8F4F8',

  // Special colors
  lilas: '#8B6AAE',
  lilasLight: '#F3EDF8',
  dourado: '#D4A574',
  douradoLight: '#FDF6EE',

  // Category colors
  catFeminino: '#C75C3A',
  catMasculino: '#4A90A4',
  catInfantil: '#F2C94C',
  catAcessorios: '#8B6AAE',

  // Category background (15% opacity)
  catFemininoBg: 'rgba(199, 92, 58, 0.15)',
  catMasculinoBg: 'rgba(74, 144, 164, 0.15)',
  catInfantilBg: 'rgba(242, 201, 76, 0.15)',
  catAcessoriosBg: 'rgba(139, 106, 174, 0.15)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Accent (Lilás)
  accent: '#8B6AAE',
  accentLight: '#F3EDF8',
};

// Dark mode colors
export const darkColors = {
  // Primary brand colors (Coral - better contrast)
  primary: '#E8845A',
  primaryLight: '#F5A87A',
  primaryDark: '#C75C3A',
  primaryMuted: '#3D2E2A',

  // Background & Surface
  background: '#1A1614',
  surface: '#2D2926',

  // Text colors
  text: '#FFF8F0',
  textSecondary: '#D4CBC4',
  textMuted: '#9B8E86',

  // Border
  border: '#3D3632',

  // Neutrals (inverted scale)
  white: '#1A1A1A',
  black: '#FFFFFF',
  gray50: '#171717',
  gray100: '#262626',
  gray200: '#404040',
  gray300: '#525252',
  gray400: '#737373',
  gray500: '#A3A3A3',
  gray600: '#D4D4D4',
  gray700: '#E8E8E8',
  gray800: '#F5F5F5',
  gray900: '#FAFAFA',

  // Status colors (adjusted for dark mode)
  success: '#6DAF6C',
  successLight: '#2D3D2D',
  warning: '#F5D76E',
  warningLight: '#3D3926',
  error: '#E66B6B',
  errorLight: '#3D2626',
  info: '#5AADC4',
  infoLight: '#263D40',

  // Special colors (adjusted for dark mode)
  lilas: '#A080C4',
  lilasLight: '#2D2640',
  dourado: '#E0B88A',
  douradoLight: '#3D3326',

  // Category colors (slightly brighter for dark mode)
  catFeminino: '#E8845A',
  catMasculino: '#5AADC4',
  catInfantil: '#F5D76E',
  catAcessorios: '#A080C4',

  // Category background (15% opacity on dark)
  catFemininoBg: 'rgba(232, 132, 90, 0.20)',
  catMasculinoBg: 'rgba(90, 173, 196, 0.20)',
  catInfantilBg: 'rgba(245, 215, 110, 0.20)',
  catAcessoriosBg: 'rgba(160, 128, 196, 0.20)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // Accent (Lilás)
  accent: '#A080C4',
  accentLight: '#2D2640',
};

// Helper function to get colors based on theme
export function getColors(isDark: boolean) {
  return isDark ? darkColors : lightColors;
}

// Default export is light colors for backward compatibility
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,      // buttons, inputs
  xl: 16,      // cards
  '2xl': 20,   // badges
  '3xl': 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  smallBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  captionBold: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  price: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
};

const createShadow = (offsetY: number, blur: number, opacity: number, color = '#2D2926') => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0 ${offsetY}px ${blur}px rgba(45, 41, 38, ${opacity})`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur / 2,
    elevation: Math.ceil(offsetY * 1.5),
  };
};

export const shadows = {
  sm: createShadow(1, 3, 0.08) as any,
  md: createShadow(4, 12, 0.10) as any,
  lg: createShadow(8, 24, 0.12) as any,
  xl: createShadow(12, 32, 0.15) as any,
  card: createShadow(4, 12, 0.10) as any,
  cardHover: createShadow(8, 24, 0.12) as any,
  primary: (opacity = 0.4) => createShadow(4, 8, opacity, colors.primary) as any,
};

export default {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  fontFamily,
};
