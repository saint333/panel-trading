import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  AppText,
  Badge,
  Button,
  Card,
  Divider,
  Screen,
  SectionHeader,
  Skeleton,
  StateView,
  Toggle,
} from '../../src/components';
import { ApiError } from '../../src/api/client';
import { fetchAccounts, type Account } from '../../src/api/auth';
import { useSession } from '../../src/session/SessionProvider';
import { useTheme } from '../../src/theme/ThemeProvider';
import { formatMinor } from '../../src/utils/money';

type Status = 'loading' | 'ready' | 'error';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, scheme, setPreference } = useTheme();
  const { user } = useSession();

  const [status, setStatus] = useState<Status>('loading');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);

    try {
      setAccounts(await fetchAccounts());
      setStatus('ready');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof ApiError ? cause.message : t('common.offline'));
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="display" weight="bold">
            {t('app.name')}
          </AppText>
          <AppText tone="muted" variant="caption">
            {t('accounts.signedInAs', { email: user?.email ?? '' })}
          </AppText>
        </View>
      </View>

      <Card>
        <SectionHeader title={t('accounts.title')} subtitle={t('accounts.subtitle')} />

        {status === 'loading' ? (
          <View style={{ gap: 10 }} accessibilityLabel={t('common.loading')}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={14} width="40%" />
            <Skeleton height={44} />
          </View>
        ) : null}

        {status === 'error' ? (
          <StateView
            state="error"
            title={t('home.stateError')}
            description={error ?? undefined}
            onRetry={() => void load()}
            retryLabel={t('common.retry')}
          />
        ) : null}

        {status === 'ready' && accounts.length === 0 ? (
          <AppText tone="muted">{t('accounts.empty')}</AppText>
        ) : null}

        {status === 'ready' && accounts.length > 0 ? (
          <View>
            {accounts.map((account, index) => (
              <View key={account.id}>
                {index > 0 ? <Divider /> : null}
                <View style={{ gap: 6, paddingVertical: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AppText weight="bold" style={{ flex: 1 }}>
                      {account.name}
                    </AppText>
                    <Badge
                      label={account.type === 'REAL' ? t('accounts.real') : t('accounts.demo')}
                      tone={account.type === 'REAL' ? 'success' : 'info'}
                    />
                  </View>
                  <AppText variant="caption" tone="muted">
                    {t('accounts.openingBalance')}:{' '}
                    {formatMinor(account.openingBalanceMinor, account.currency)}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <Button
          label={t('accounts.add')}
          variant="secondary"
          onPress={() => router.push('/nueva-cuenta')}
        />
      </Card>

      <Button
        label={t('settings.title')}
        variant="secondary"
        onPress={() => router.push('/ajustes')}
      />

      <Card>
        <SectionHeader title={t('settings.appearance')} />
        <Toggle
          label={t('settings.darkTheme')}
          description={t('settings.darkThemeDescription')}
          value={scheme === 'dark'}
          onValueChange={(enabled) => setPreference(enabled ? 'dark' : 'light')}
        />
      </Card>

      <AppText variant="caption" tone="muted" style={{ color: colors.textMuted }}>
        {t('home.disclaimer')}
      </AppText>
    </Screen>
  );
}
