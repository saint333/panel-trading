import { Text, type TextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fontSize, lineHeight } from '../theme/tokens';

type Variant = keyof typeof fontSize;
type Tone = 'default' | 'muted' | 'success' | 'danger' | 'primary';

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: 'regular' | 'medium' | 'bold';
}

export function AppText({
  variant = 'body',
  tone = 'default',
  weight = 'regular',
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const toneColor: Record<Tone, string> = {
    default: colors.text,
    muted: colors.textMuted,
    success: colors.success,
    danger: colors.danger,
    primary: colors.primary,
  };

  return (
    <Text
      {...rest}
      style={[
        {
          color: toneColor[tone],
          fontSize: fontSize[variant],
          lineHeight: lineHeight[variant],
          fontWeight: weight === 'bold' ? '700' : weight === 'medium' ? '500' : '400',
        },
        style,
      ]}
    />
  );
}
