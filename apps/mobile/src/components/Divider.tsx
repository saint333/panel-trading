import { View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

export function Divider({ label }: { label?: string }) {
  const { colors } = useTheme();

  if (label) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginVertical: spacing.sm,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
    );
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }}
    />
  );
}
