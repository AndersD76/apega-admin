import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get initial dimensions (for static calculations)
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints (same as in useResponsive hook)
export const breakpoints = {
  mobile: 0,
  tablet: 600,
  desktop: 900,
} as const;

// Base dimensions for scaling (iPhone 14 as reference)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/**
 * Scale a value based on screen width (horizontal scaling)
 * Useful for horizontal dimensions, font sizes, etc.
 */
export function scaleWidth(size: number): number {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Scale a value based on screen height (vertical scaling)
 * Useful for vertical dimensions, margins, etc.
 */
export function scaleHeight(size: number): number {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Moderate scaling - limits extreme scaling on very large/small screens
 * factor: 0.5 means only scale by 50% of the difference
 */
export function moderateScale(size: number, factor: number = 0.5): number {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size + (scale - 1) * factor * size;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Get responsive value based on current screen width
 */
export function getResponsiveValue<T>(
  width: number,
  mobile: T,
  tablet?: T,
  desktop?: T
): T {
  if (width >= breakpoints.desktop) return desktop ?? tablet ?? mobile;
  if (width >= breakpoints.tablet) return tablet ?? mobile;
  return mobile;
}

/**
 * Check if current screen is mobile
 */
export function isMobile(width: number = SCREEN_WIDTH): boolean {
  return width < breakpoints.tablet;
}

/**
 * Check if current screen is tablet
 */
export function isTablet(width: number = SCREEN_WIDTH): boolean {
  return width >= breakpoints.tablet && width < breakpoints.desktop;
}

/**
 * Check if current screen is desktop
 */
export function isDesktop(width: number = SCREEN_WIDTH): boolean {
  return width >= breakpoints.desktop;
}

/**
 * Calculate number of grid columns based on screen width
 */
export function getGridColumns(width: number = SCREEN_WIDTH): number {
  if (width >= breakpoints.desktop) return 4;
  if (width >= breakpoints.tablet) return 3;
  return 2;
}

/**
 * Calculate product card width for grid
 */
export function getProductWidth(
  width: number = SCREEN_WIDTH,
  horizontalPadding: number = 16,
  gap: number = 12
): number {
  const columns = getGridColumns(width);
  return (width - horizontalPadding * 2 - (columns - 1) * gap) / columns;
}

/**
 * Get font size that scales appropriately
 */
export function getResponsiveFontSize(
  baseFontSize: number,
  width: number = SCREEN_WIDTH
): number {
  const scale = getResponsiveValue(width, 1, 1.05, 1.1);
  return Math.round(baseFontSize * scale);
}

/**
 * Get spacing that scales appropriately
 */
export function getResponsiveSpacing(
  baseSpacing: number,
  width: number = SCREEN_WIDTH
): number {
  const scale = getResponsiveValue(width, 1, 1.15, 1.25);
  return Math.round(baseSpacing * scale);
}

/**
 * Ensure minimum touch target size (44px recommended by Apple/Google)
 */
export function ensureTouchTarget(size: number, minimum: number = 44): number {
  return Math.max(size, minimum);
}

/**
 * Get platform-specific value
 */
export function platformSelect<T>(ios: T, android: T, web?: T): T {
  if (Platform.OS === 'web' && web !== undefined) return web;
  return Platform.OS === 'ios' ? ios : android;
}

/**
 * Check if device is in landscape orientation
 */
export function isLandscape(width: number = SCREEN_WIDTH, height: number = SCREEN_HEIGHT): boolean {
  return width > height;
}

/**
 * Get safe horizontal padding based on screen size
 */
export function getHorizontalPadding(width: number = SCREEN_WIDTH): number {
  return getResponsiveValue(width, 16, 24, 32);
}

/**
 * Get safe vertical padding based on screen size
 */
export function getVerticalPadding(width: number = SCREEN_WIDTH): number {
  return getResponsiveValue(width, 16, 20, 24);
}
