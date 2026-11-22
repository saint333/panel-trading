import { View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';
import { radii, spacing } from '../theme/tokens';

type Tone = 'success' | 'danger' | 'warning' | 'info';

const ICONS: Record<Tone, string> = {
  success: '✓',
  danger: '×',
  warning: '!',
  info: 'i',
};

export function Badge({ label, tone }: { label: string; tone: Tone }) {
  const { colors } = useTheme();
  const color = colors[tone];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        alignSelf: 'flex-start',
        backgroundColor: `${color}1a`,
        borderColor: `${color}55`,
        borderWidth: 1,
        borderRadius: radii.pill,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
      }}
    >
      {/* Icono + texto: el estado no depende solo del color. */}
      <AppText variant="caption" weight="bold" style={{ color }}>
        {ICONS[tone]} {label}
      </AppText>
    </View>
  );
}
