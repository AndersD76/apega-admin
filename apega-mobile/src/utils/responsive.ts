import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 14 Pro - design base)
const baseWidth = 393;
const baseHeight = 852;

// Scale functions
export const widthPercentage = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

export const heightPercentage = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Scale based on screen width
export const scale = (size: number): number => {
  const scaleFactor = SCREEN_WIDTH / baseWidth;
  const newSize = size * scaleFactor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Scale based on screen height
export const verticalScale = (size: number): number => {
  const scaleFactor = SCREEN_HEIGHT / baseHeight;
  const newSize = size * scaleFactor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Moderate scale - less aggressive scaling for fonts and spacing
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Font scale with min/max constraints
export const fontScale = (size: number, minSize?: number, maxSize?: number): number => {
  const scaled = moderateScale(size, 0.3);
  if (minSize && scaled < minSize) return minSize;
  if (maxSize && scaled > maxSize) return maxSize;
  return Math.round(scaled);
};

// Get responsive value based on screen size
export const responsive = <T>(small: T, medium: T, large: T): T => {
  if (SCREEN_WIDTH < 360) return small;
  if (SCREEN_WIDTH < 414) return medium;
  return large;
};

// Check device type
export const isSmallDevice = SCREEN_WIDTH < 360;
export const isMediumDevice = SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;
export const isTablet = SCREEN_WIDTH >= 768;

// Platform specific
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

// Screen dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

// Card dimensions for grids
export const getCardWidth = (columns: number, gap: number = 8, padding: number = 16): number => {
  const totalGap = gap * (columns - 1);
  const totalPadding = padding * 2;
  return (SCREEN_WIDTH - totalPadding - totalGap) / columns;
};

// Responsive grid columns
export const getGridColumns = (): number => {
  if (isTablet) return 4;
  if (isLargeDevice) return 2;
  return 2;
};

// Hit slop for touch targets
export const hitSlop = (size: number = 10) => ({
  top: size,
  bottom: size,
  left: size,
  right: size,
});

// Safe area helpers
export const BOTTOM_TAB_HEIGHT = isIOS ? 80 : 64;
export const STATUS_BAR_HEIGHT = isIOS ? 44 : 24;

export default {
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  responsive,
  widthPercentage,
  heightPercentage,
  getCardWidth,
  getGridColumns,
  hitSlop,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  isIOS,
  isAndroid,
  isWeb,
  screenWidth,
  screenHeight,
  BOTTOM_TAB_HEIGHT,
  STATUS_BAR_HEIGHT,
};
