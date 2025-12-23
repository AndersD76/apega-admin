import React, { forwardRef } from 'react';
import { styled, Input as TamaguiInput, XStack, YStack, Text, GetProps } from 'tamagui';
import { TextInput } from 'react-native';

const StyledInput = styled(TamaguiInput, {
  name: 'Input',
  backgroundColor: '$backgroundStrong',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$3',
  paddingHorizontal: '$3',
  fontSize: 15,
  color: '$color',
  placeholderTextColor: '$placeholderColor',
  height: 48,

  focusStyle: {
    borderColor: '$brand',
    backgroundColor: '$background',
  },

  hoverStyle: {
    borderColor: '$borderColorHover',
  },

  variants: {
    size: {
      sm: {
        height: 40,
        fontSize: 14,
        paddingHorizontal: '$2',
      },
      md: {
        height: 48,
        fontSize: 15,
        paddingHorizontal: '$3',
      },
      lg: {
        height: 56,
        fontSize: 16,
        paddingHorizontal: '$4',
      },
    },
    error: {
      true: {
        borderColor: '$error',
        focusStyle: {
          borderColor: '$error',
        },
      },
    },
    rounded: {
      true: {
        borderRadius: '$full',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
});

const InputContainer = styled(YStack, {
  name: 'InputContainer',
  gap: '$1',
});

const InputWrapper = styled(XStack, {
  name: 'InputWrapper',
  alignItems: 'center',
  position: 'relative',
});

const Label = styled(Text, {
  name: 'InputLabel',
  fontSize: 14,
  fontWeight: '500',
  color: '$color',
  marginBottom: '$1',
});

const ErrorText = styled(Text, {
  name: 'InputError',
  fontSize: 12,
  color: '$error',
  marginTop: '$1',
});

const HelperText = styled(Text, {
  name: 'InputHelper',
  fontSize: 12,
  color: '$placeholderColor',
  marginTop: '$1',
});

const IconWrapper = styled(XStack, {
  name: 'InputIcon',
  position: 'absolute',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  paddingHorizontal: '$3',
  zIndex: 1,

  variants: {
    position: {
      left: {
        left: 0,
      },
      right: {
        right: 0,
      },
    },
  } as const,
});

type InputProps = GetProps<typeof StyledInput> & {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, helper, leftIcon, rightIcon, size = 'md', ...props }, ref) => {
    return (
      <InputContainer>
        {label && <Label>{label}</Label>}
        <InputWrapper>
          {leftIcon && <IconWrapper position="left">{leftIcon}</IconWrapper>}
          <StyledInput
            ref={ref as any}
            size={size}
            error={!!error}
            paddingLeft={leftIcon ? '$10' : undefined}
            paddingRight={rightIcon ? '$10' : undefined}
            flex={1}
            {...props}
          />
          {rightIcon && <IconWrapper position="right">{rightIcon}</IconWrapper>}
        </InputWrapper>
        {error && <ErrorText>{error}</ErrorText>}
        {helper && !error && <HelperText>{helper}</HelperText>}
      </InputContainer>
    );
  }
);

Input.displayName = 'Input';

// Search Input específico
export const SearchInput = styled(StyledInput, {
  name: 'SearchInput',
  borderRadius: '$full',
  backgroundColor: '$backgroundStrong',
  borderWidth: 0,
  paddingLeft: '$10',

  focusStyle: {
    backgroundColor: '$background',
    borderWidth: 1,
    borderColor: '$brand',
  },
});

export default Input;
