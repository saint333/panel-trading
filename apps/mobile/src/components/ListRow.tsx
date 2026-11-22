import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { radii, spacing } from '../theme/tokens';

interface ListRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  left?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  accessibilityHint?: string;
}

export function ListRow({
  title,
  subtitle,
  value,
  left,
  onPress,
  chevron = false,
  destructive = false,
  accessibilityHint,
}: ListRowProps) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 52,
        paddingVertical: spacing.sm,
      }}
    >
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText weight="medium" tone={destructive ? 'danger' : 'default'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="caption" tone="muted">
          {value}
        </AppText>
      ) : null}
      {chevron ? (
        <AppText tone="muted" accessibilityElementsHidden>
          ›
        </AppText>
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint ?? subtitle}
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radii.sm,
        opacity: pressed ? 0.7 : 1,
        paddingHorizontal: spacing.xs,
        marginHorizontal: -spacing.xs,
      })}
    >
      {content}
    </Pressable>
  );
}
