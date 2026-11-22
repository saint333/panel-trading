import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Input, Screen } from '../../src/components';
import { ApiError } from '../../src/api/client';
import { useSession } from '../../src/session/SessionProvider';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setBusy(true);

    try {
      await signIn(email, password);
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 401
          ? t('auth.wrongCredentials')
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
        <AppText tone="muted">{t('auth.loginSubtitle')}</AppText>
      </View>

      <Card>
        <AppText variant="title" weight="bold">
          {t('auth.loginTitle')}
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
          autoComplete="current-password"
          textContentType="password"
          required
          error={error ?? undefined}
        />

        <Button
          label={busy ? t('auth.signingIn') : t('auth.signIn')}
          onPress={() => void submit()}
          loading={busy}
          disabled={!email || !password}
        />
      </Card>

      <Button
        label={t('auth.noAccount')}
        variant="secondary"
        onPress={() => router.push('/registro')}
      />

      <AppText variant="caption" tone="muted">
        {t('home.disclaimer')}
      </AppText>
    </Screen>
  );
}
