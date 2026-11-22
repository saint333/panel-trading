import { Switch, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: ToggleProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText weight="medium">{label}</AppText>
        {description ? (
          <AppText variant="caption" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>

      <Switch
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: `${colors.primary}99` }}
        thumbColor={value ? colors.primary : colors.surfaceElevated}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}
