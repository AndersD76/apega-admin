import React from 'react';
import { styled, Button as TamaguiButton, Text, Spinner, GetProps } from 'tamagui';

const StyledButton = styled(TamaguiButton, {
  name: 'Button',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
  borderRadius: '$3',
  pressStyle: {
    scale: 0.97,
    opacity: 0.9,
  },
  animation: 'fast',

  variants: {
    variant: {
      primary: {
        backgroundColor: '$brand',
        hoverStyle: {
          backgroundColor: '$brandDark',
        },
      },
      secondary: {
        backgroundColor: '$backgroundStrong',
        borderWidth: 1,
        borderColor: '$borderColor',
        hoverStyle: {
          backgroundColor: '$backgroundHover',
          borderColor: '$borderColorHover',
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        hoverStyle: {
          backgroundColor: '$backgroundHover',
        },
      },
      danger: {
        backgroundColor: '$error',
        hoverStyle: {
          backgroundColor: '#DC2626',
        },
      },
      accent: {
        backgroundColor: '$accent',
        hoverStyle: {
          backgroundColor: '#DB2777',
        },
      },
    },
    size: {
      sm: {
        height: 36,
        paddingHorizontal: '$3',
      },
      md: {
        height: 44,
        paddingHorizontal: '$4',
      },
      lg: {
        height: 52,
        paddingHorizontal: '$5',
      },
      xl: {
        height: 60,
        paddingHorizontal: '$6',
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
    },
    rounded: {
      true: {
        borderRadius: '$full',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

const ButtonText = styled(Text, {
  name: 'ButtonText',
  fontFamily: '$body',
  fontWeight: '600',

  variants: {
    variant: {
      primary: {
        color: 'white',
      },
      secondary: {
        color: '$color',
      },
      ghost: {
        color: '$brand',
      },
      danger: {
        color: 'white',
      },
      accent: {
        color: 'white',
      },
    },
    size: {
      sm: {
        fontSize: 13,
      },
      md: {
        fontSize: 14,
      },
      lg: {
        fontSize: 15,
      },
      xl: {
        fontSize: 16,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

type ButtonProps = GetProps<typeof StyledButton> & {
  children: React.ReactNode;
  loading?: boolean;
  icon?: React.ReactNode;
  iconAfter?: React.ReactNode;
};

export function Button({
  children,
  loading,
  icon,
  iconAfter,
  variant = 'primary',
  size = 'md',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={disabled || loading}
      opacity={disabled || loading ? 0.6 : 1}
      {...props}
    >
      {loading ? (
        <Spinner size="small" color={variant === 'primary' || variant === 'danger' || variant === 'accent' ? 'white' : '$brand'} />
      ) : (
        <>
          {icon}
          <ButtonText variant={variant} size={size}>
            {children}
          </ButtonText>
          {iconAfter}
        </>
      )}
    </StyledButton>
  );
}

export default Button;
