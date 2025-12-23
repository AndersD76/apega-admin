import { styled, XStack, Text, GetProps } from 'tamagui';

export const Badge = styled(XStack, {
  name: 'Badge',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
  gap: '$1',

  variants: {
    variant: {
      default: {
        backgroundColor: '$backgroundStrong',
      },
      brand: {
        backgroundColor: '$brand',
      },
      success: {
        backgroundColor: '$success',
      },
      warning: {
        backgroundColor: '$warning',
      },
      error: {
        backgroundColor: '$error',
      },
      accent: {
        backgroundColor: '$accent',
      },
      muted: {
        backgroundColor: '$brandMuted',
      },
    },
    size: {
      sm: {
        paddingHorizontal: '$1',
        paddingVertical: 2,
      },
      md: {
        paddingHorizontal: '$2',
        paddingVertical: '$1',
      },
      lg: {
        paddingHorizontal: '$3',
        paddingVertical: '$1',
      },
    },
    outline: {
      true: {
        backgroundColor: 'transparent',
        borderWidth: 1,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export const BadgeText = styled(Text, {
  name: 'BadgeText',
  fontSize: 11,
  fontWeight: '600',
  letterSpacing: 0.5,

  variants: {
    variant: {
      default: {
        color: '$color',
      },
      brand: {
        color: 'white',
      },
      success: {
        color: 'white',
      },
      warning: {
        color: 'white',
      },
      error: {
        color: 'white',
      },
      accent: {
        color: 'white',
      },
      muted: {
        color: '$brand',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
});

// Price Badge específico
export const PriceBadge = styled(XStack, {
  name: 'PriceBadge',
  backgroundColor: 'white',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$2',
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 4,
  elevation: 2,
});

export const PriceText = styled(Text, {
  name: 'PriceText',
  fontSize: 14,
  fontWeight: '700',
  color: '$color',
});

// Discount Badge
export const DiscountBadge = styled(XStack, {
  name: 'DiscountBadge',
  backgroundColor: '$error',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
});

export const DiscountText = styled(Text, {
  name: 'DiscountText',
  fontSize: 11,
  fontWeight: '800',
  color: 'white',
});

export default Badge;
