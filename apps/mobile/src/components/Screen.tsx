import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = false, style }: ScreenProps) {
  const { colors } = useTheme();

  const content = (
    <View style={[{ flex: 1, padding: spacing.md, gap: spacing.md }, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.md, gap: spacing.md }}>
          {children}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
