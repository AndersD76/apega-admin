import { styled, Stack, YStack, XStack, Text, Image, GetProps } from 'tamagui';

export const Card = styled(YStack, {
  name: 'Card',
  backgroundColor: '$background',
  borderRadius: '$4',
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '$borderColor',

  variants: {
    elevated: {
      true: {
        borderWidth: 0,
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 4,
      },
    },
    pressable: {
      true: {
        pressStyle: {
          scale: 0.98,
          opacity: 0.95,
        },
        animation: 'fast',
        cursor: 'pointer',
      },
    },
    size: {
      sm: {
        padding: '$2',
      },
      md: {
        padding: '$3',
      },
      lg: {
        padding: '$4',
      },
    },
  } as const,

  defaultVariants: {
    elevated: true,
  },
});

export const CardHeader = styled(XStack, {
  name: 'CardHeader',
  padding: '$3',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
});

export const CardContent = styled(YStack, {
  name: 'CardContent',
  padding: '$3',
  gap: '$2',
});

export const CardFooter = styled(XStack, {
  name: 'CardFooter',
  padding: '$3',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
});

export const CardImage = styled(Image, {
  name: 'CardImage',
  width: '100%',
  aspectRatio: 1,
  backgroundColor: '$backgroundStrong',
});

export const CardTitle = styled(Text, {
  name: 'CardTitle',
  fontSize: 16,
  fontWeight: '600',
  color: '$color',
});

export const CardDescription = styled(Text, {
  name: 'CardDescription',
  fontSize: 14,
  color: '$placeholderColor',
});

// Product Card específico para o app
export const ProductCard = styled(Stack, {
  name: 'ProductCard',
  backgroundColor: '$background',
  borderRadius: '$3',
  overflow: 'hidden',
  pressStyle: {
    scale: 0.98,
    opacity: 0.95,
  },
  animation: 'fast',
  cursor: 'pointer',

  variants: {
    elevated: {
      true: {
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
      },
    },
  } as const,

  defaultVariants: {
    elevated: true,
  },
});

export default Card;
