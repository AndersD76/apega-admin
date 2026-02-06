import { useWindowDimensions } from 'react-native';

// Breakpoints
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 600,
  desktop: 900,
} as const;

// Component size tokens
export const COMPONENT_SIZES = {
  button: { sm: 36, md: 44, lg: 56 },
  avatar: { sm: 32, md: 44, lg: 64 },
  icon: { sm: 18, md: 24, lg: 32 },
  input: { height: 48 },
  touchTarget: 44, // Minimum touch target size
} as const;

export interface ResponsiveValues {
  // Dimensions
  width: number;
  height: number;

  // Device type
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;

  // Grid
  gridColumns: number;
  productWidth: number;
  gridGap: number;

  // Scaling
  fontScale: number;
  spacingScale: number;

  // Helpers
  getResponsiveValue: <T>(mobile: T, tablet?: T, desktop?: T) => T;
  getScaledSize: (baseSize: number) => number;
  getScaledSpacing: (baseSpacing: number) => number;
}

/**
 * Hook for responsive design across all screen sizes
 *
 * Usage:
 * ```tsx
 * const { isMobile, gridColumns, productWidth, fontScale } = useResponsive();
 * ```
 */
export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();

  // Device type detection
  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isLandscape = width > height;

  // Grid configuration
  const gridColumns = isDesktop ? 4 : isTablet ? 3 : 2;
  const gridGap = isMobile ? 12 : isTablet ? 16 : 20;
  const horizontalPadding = isMobile ? 16 : isTablet ? 24 : 32;

  // Product card width calculation
  // Formula: (screenWidth - horizontalPadding*2 - gaps) / columns
  const productWidth = (width - horizontalPadding * 2 - (gridColumns - 1) * gridGap) / gridColumns;

  // Scaling factors
  const fontScale = isMobile ? 1 : isTablet ? 1.05 : 1.1;
  const spacingScale = isMobile ? 1 : isTablet ? 1.15 : 1.25;

  // Helper: Get responsive value based on device type
  const getResponsiveValue = <T,>(mobile: T, tablet?: T, desktop?: T): T => {
    if (isDesktop) return desktop ?? tablet ?? mobile;
    if (isTablet) return tablet ?? mobile;
    return mobile;
  };

  // Helper: Scale a size value based on screen size
  const getScaledSize = (baseSize: number): number => {
    return Math.round(baseSize * fontScale);
  };

  // Helper: Scale spacing value based on screen size
  const getScaledSpacing = (baseSpacing: number): number => {
    return Math.round(baseSpacing * spacingScale);
  };

  return {
    // Dimensions
    width,
    height,

    // Device type
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,

    // Grid
    gridColumns,
    productWidth,
    gridGap,

    // Scaling
    fontScale,
    spacingScale,

    // Helpers
    getResponsiveValue,
    getScaledSize,
    getScaledSpacing,
  };
}

/**
 * Get responsive value without hook (for use outside components)
 */
export function getResponsiveValueStatic<T>(
  width: number,
  mobile: T,
  tablet?: T,
  desktop?: T
): T {
  if (width >= BREAKPOINTS.desktop) return desktop ?? tablet ?? mobile;
  if (width >= BREAKPOINTS.tablet) return tablet ?? mobile;
  return mobile;
}
