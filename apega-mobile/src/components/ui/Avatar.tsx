import { styled, Stack, Image, Text, GetProps } from 'tamagui';

const AvatarContainer = styled(Stack, {
  name: 'Avatar',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$brand',
  overflow: 'hidden',

  variants: {
    size: {
      xs: {
        width: 24,
        height: 24,
        borderRadius: 12,
      },
      sm: {
        width: 32,
        height: 32,
        borderRadius: 16,
      },
      md: {
        width: 40,
        height: 40,
        borderRadius: 20,
      },
      lg: {
        width: 56,
        height: 56,
        borderRadius: 28,
      },
      xl: {
        width: 80,
        height: 80,
        borderRadius: 40,
      },
      xxl: {
        width: 120,
        height: 120,
        borderRadius: 60,
      },
    },
    bordered: {
      true: {
        borderWidth: 3,
        borderColor: '$background',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
});

const AvatarImage = styled(Image, {
  name: 'AvatarImage',
  width: '100%',
  height: '100%',
});

const AvatarFallback = styled(Text, {
  name: 'AvatarFallback',
  color: 'white',
  fontWeight: '600',
  textTransform: 'uppercase',

  variants: {
    size: {
      xs: {
        fontSize: 10,
      },
      sm: {
        fontSize: 12,
      },
      md: {
        fontSize: 14,
      },
      lg: {
        fontSize: 20,
      },
      xl: {
        fontSize: 28,
      },
      xxl: {
        fontSize: 40,
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
});

type AvatarProps = GetProps<typeof AvatarContainer> & {
  src?: string | null;
  name?: string;
};

export function Avatar({ src, name, size = 'md', ...props }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
    : '?';

  return (
    <AvatarContainer size={size} {...props}>
      {src ? (
        <AvatarImage source={{ uri: src }} />
      ) : (
        <AvatarFallback size={size}>{initials}</AvatarFallback>
      )}
    </AvatarContainer>
  );
}

export default Avatar;
