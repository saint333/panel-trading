import { Pressable } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';
import { radii, spacing } from '../theme/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 36,
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? `${colors.primary}1f` : colors.surface,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppText
        variant="caption"
        weight={selected ? 'bold' : 'medium'}
        style={{ color: selected ? colors.primary : colors.text }}
      >
        {selected ? '✓ ' : ''}
        {label}
      </AppText>
    </Pressable>
  );
}
