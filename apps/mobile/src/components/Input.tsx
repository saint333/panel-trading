import { useState, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';
import { radii, spacing } from '../theme/tokens';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  error?: string;
  right?: ReactNode;
  required?: boolean;
}

export function Input({
  label,
  hint,
  error,
  right,
  required = false,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" weight="medium" tone={error ? 'danger' : 'muted'}>
        {label}
        {required ? ' *' : ''}
      </AppText>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          minHeight: 48,
          borderWidth: 1,
          borderColor,
          borderRadius: radii.md,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
        }}
      >
        <TextInput
          {...rest}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.textMuted}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={{ flex: 1, color: colors.text, fontSize: 16, paddingVertical: spacing.sm }}
        />
        {right}
      </View>

      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
