import { View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';
import { radii, spacing } from '../theme/tokens';

type Tone = 'primary' | 'success' | 'danger' | 'warning';

interface ProgressBarProps {
  value: number;
  label?: string;
  tone?: Tone;
  showPercentage?: boolean;
}

export function ProgressBar({
  value,
  label,
  tone = 'primary',
  showPercentage = false,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const clamped = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const percentage = Math.round(clamped * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Progreso'}
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      style={{ gap: spacing.xs }}
    >
      {label || showPercentage ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {label ? (
            <AppText variant="caption" tone="muted">
              {label}
            </AppText>
          ) : null}
          {showPercentage ? (
            <AppText variant="caption" tone="muted">
              {percentage} %
            </AppText>
          ) : null}
        </View>
      ) : null}

      <View
        style={{
          height: 8,
          borderRadius: radii.pill,
          backgroundColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${percentage}%`,
            height: '100%',
            borderRadius: radii.pill,
            backgroundColor: colors[tone],
          }}
        />
      </View>
    </View>
  );
}
