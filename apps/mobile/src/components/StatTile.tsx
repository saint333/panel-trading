import { View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';
import { radii, spacing } from '../theme/tokens';

export type SampleLevel = 'insufficient' | 'preliminary' | 'reasonable';

const SAMPLE_LABEL: Record<SampleLevel, string> = {
  insufficient: 'Muestra insuficiente',
  preliminary: 'Muestra preliminar',
  reasonable: 'Muestra razonable',
};

interface StatTileProps {
  label: string;
  value: string;
  change?: { value: string; direction: 'up' | 'down' | 'flat' };
  caption?: string;
  sampleLevel?: SampleLevel;
}

export function StatTile({ label, value, change, caption, sampleLevel }: StatTileProps) {
  const { colors } = useTheme();

  const changeTone =
    change?.direction === 'up'
      ? colors.success
      : change?.direction === 'down'
        ? colors.danger
        : colors.textMuted;
  const arrow = change?.direction === 'up' ? '↑' : change?.direction === 'down' ? '↓' : '→';

  return (
    <View
      style={{
        flex: 1,
        minWidth: 140,
        gap: spacing.xs,
        padding: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="title" weight="bold">
        {value}
      </AppText>

      {change ? (
        <AppText variant="caption" weight="medium" style={{ color: changeTone }}>
          {arrow} {change.value}
        </AppText>
      ) : null}

      {caption ? (
        <AppText variant="caption" tone="muted" numberOfLines={2}>
          {caption}
        </AppText>
      ) : null}

      {sampleLevel ? (
        <AppText variant="caption" tone={sampleLevel === 'reasonable' ? 'muted' : 'default'}>
          {SAMPLE_LABEL[sampleLevel]}
        </AppText>
      ) : null}
    </View>
  );
}
