import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Input, Screen } from '../../src/components';
import { ApiError } from '../../src/api/client';
import { useSession } from '../../src/session/SessionProvider';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radii, spacing } from '../../src/theme/tokens';

const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { signUp } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('auth.invalidEmail'));
      return;
    }

    if (password.length < 12) {
      setError(t('auth.shortPassword'));
      return;
    }

    if (!accepted) {
      setError(t('auth.disclaimerRequired'));
      return;
    }

    setBusy(true);

    try {
      await signUp({ email, password, timezone: TIMEZONE });
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : t('common.offline'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: 4, marginTop: 24 }}>
        <AppText variant="display" weight="bold">
          {t('app.name')}
        </AppText>
        <AppText tone="muted">{t('auth.registerSubtitle')}</AppText>
      </View>

      <Card>
        <AppText variant="title" weight="bold">
          {t('auth.registerTitle')}
        </AppText>

        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          placeholder="tu@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          required
        />

        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••••••"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          hint={t('auth.registerSubtitle')}
          required
        />

        <AppText variant="caption" tone="muted">
          {t('auth.timezoneNote', { timezone: TIMEZONE })}
        </AppText>
      </Card>

      <Card>
        <AppText variant="title" weight="bold">
          {t('auth.disclaimerTitle')}
        </AppText>
        <AppText variant="body">{t('auth.disclaimerBody')}</AppText>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          accessibilityLabel={t('auth.acceptDisclaimer')}
          onPress={() => setAccepted((value) => !value)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            minHeight: 48,
            paddingHorizontal: spacing.sm,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: accepted ? colors.primary : colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <AppText weight="bold" style={{ color: accepted ? colors.primary : colors.textMuted }}>
            {accepted ? '✓' : '○'}
          </AppText>
          <AppText variant="caption" style={{ flex: 1 }}>
            {t('auth.acceptDisclaimer')}
          </AppText>
        </Pressable>
      </Card>

      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}

      <Button
        label={busy ? t('auth.registering') : t('auth.register')}
        onPress={() => void submit()}
        loading={busy}
        disabled={!email || !password || !accepted}
      />

      <Button
        label={t('auth.haveAccount')}
        variant="secondary"
        onPress={() => router.replace('/login')}
      />
    </Screen>
  );
}
