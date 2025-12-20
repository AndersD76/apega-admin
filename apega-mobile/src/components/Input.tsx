import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';

export type InputType = 'field' | 'textarea';

interface InputProps extends TextInputProps {
  type?: InputType;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCharCounter?: boolean;
  style?: ViewStyle;
  hasLeftIcon?: boolean;
  hasRightIcon?: boolean;
}

export default function Input({
  type = 'field',
  label,
  required = false,
  error,
  helperText,
  maxLength,
  showCharCounter = false,
  style,
  value,
  onChangeText,
  hasLeftIcon = false,
  hasRightIcon = false,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(value?.length || 0);

  const handleChangeText = (text: string) => {
    setCharCount(text.length);
    onChangeText?.(text);
  };

  const getInputStyle = () => {
    const baseStyle: any[] = [styles.input];

    if (type === 'textarea') {
      baseStyle.push(styles.textarea);
    }

    if (isFocused && !error) {
      baseStyle.push(styles.inputFocused);
    }

    if (error) {
      baseStyle.push(styles.inputError);
    }

    if (hasLeftIcon) {
      baseStyle.push({ paddingLeft: 48 });
    }

    if (hasRightIcon) {
      baseStyle.push({ paddingRight: 48 });
    }

    return baseStyle;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      {/* Input Field */}
      <TextInput
        style={getInputStyle()}
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#9CA3AF"
        maxLength={maxLength}
        multiline={type === 'textarea'}
        numberOfLines={type === 'textarea' ? 5 : 1}
        textAlignVertical={type === 'textarea' ? 'top' : 'center'}
        {...props}
      />

      {/* Character Counter */}
      {showCharCounter && maxLength && type === 'textarea' && (
        <Text style={styles.charCounter}>
          {charCount}/{maxLength}
        </Text>
      )}

      {/* Error Message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.sm,
  },

  labelContainer: {
    marginBottom: SPACING[2],
  },

  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },

  required: {
    color: COLORS.error,
    marginLeft: 4,
  },

  input: {
    width: '100%',
    height: 52,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.lg,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.gray[50],
  },

  textarea: {
    minHeight: 120,
    paddingVertical: SPACING[3],
    lineHeight: TYPOGRAPHY.lineHeights.normal * TYPOGRAPHY.sizes.sm,
  },

  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  charCounter: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },

  errorText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.error,
    marginTop: 4,
  },

  helperText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
