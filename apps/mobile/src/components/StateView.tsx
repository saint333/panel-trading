import { ActivityIndicator, View } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

interface StateViewProps {
  state: 'loading' | 'error' | 'empty';
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function StateView({ state, title, description, onRetry, retryLabel }: StateViewProps) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
      {state === 'loading' ? <ActivityIndicator color={colors.primary} /> : null}
      <AppText weight="bold" style={{ textAlign: 'center' }}>
        {state === 'error' ? '× ' : ''}
        {title}
      </AppText>
      {description ? (
        <AppText tone="muted" style={{ textAlign: 'center' }}>
          {description}
        </AppText>
      ) : null}
      {onRetry && retryLabel ? <Button label={retryLabel} onPress={onRetry} /> : null}
    </View>
  );
}
