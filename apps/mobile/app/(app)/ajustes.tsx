import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppText,
  Badge,
  Button,
  Card,
  Chip,
  Input,
  ListRow,
  Screen,
  SectionHeader,
  Skeleton,
  Toggle,
} from '../../src/components';
import { ApiError } from '../../src/api/client';
import { fetchAccounts, fetchMe, updateSettings, type Account } from '../../src/api/auth';
import { useSession } from '../../src/session/SessionProvider';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing } from '../../src/theme/tokens';

const DEVICE_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, scheme, setPreference } = useTheme();
  const { signOut } = useSession();

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [timezone, setTimezone] = useState('');
  const [defaultAccountId, setDefaultAccountId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [me, list] = await Promise.all([fetchMe(), fetchAccounts()]);
      setTimezone(me.user.timezone);
      setDefaultAccountId(me.settings.defaultAccountId);
      setAccounts(list);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : t('settings.loadError'),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setError(null);
    setSaved(false);

    const value = timezone.trim();

    if (!isValidTimezone(value)) {
      setError(t('settings.invalidTimezone'));
      return;
    }

    setBusy(true);

    try {
      await updateSettings({ timezone: value, defaultAccountId });
      setSaved(true);
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
      <View style={{ gap: spacing.md }}>
        <Button label={t('accounts.back')} variant="secondary" onPress={() => router.back()} />

        <Card>
          <SectionHeader title={t('settings.appearance')} />
          <Toggle
            label={t('settings.darkTheme')}
            description={t('settings.darkThemeDescription')}
            value={scheme === 'dark'}
            onValueChange={(enabled) => setPreference(enabled ? 'dark' : 'light')}
          />
        </Card>

        <Card>
          <SectionHeader title={t('settings.title')} />

          {loading ? (
            <View style={{ gap: 10 }} accessibilityLabel={t('common.loading')}>
              <Skeleton height={20} width="50%" />
              <Skeleton height={48} />
              <Skeleton height={44} />
            </View>
          ) : (
            <>
              <Input
                label={t('settings.timezone')}
                value={timezone}
                onChangeText={(value) => {
                  setTimezone(value);
                  setSaved(false);
                }}
                hint={t('settings.timezoneHint')}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder={DEVICE_TIMEZONE}
              />

              <Button
                label={t('settings.deviceTimezone')}
                variant="secondary"
                onPress={() => {
                  setTimezone(DEVICE_TIMEZONE);
                  setSaved(false);
                }}
              />

              <ListRow
                title={t('settings.language')}
                subtitle={t('settings.languageHint')}
                value={t('settings.spanish')}
              />

              <View style={{ gap: spacing.xs }}>
                <AppText variant="caption" weight="medium" tone="muted">
                  {t('settings.defaultAccount')}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {t('settings.defaultAccountHint')}
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  <Chip
                    label={t('settings.noDefaultAccount')}
                    selected={defaultAccountId === null}
                    onPress={() => {
                      setDefaultAccountId(null);
                      setSaved(false);
                    }}
                  />
                  {accounts.map((account) => (
                    <Chip
                      key={account.id}
                      label={account.name}
                      selected={defaultAccountId === account.id}
                      onPress={() => {
                        setDefaultAccountId(account.id);
                        setSaved(false);
                      }}
                    />
                  ))}
                </View>
              </View>

              {saved ? <Badge label={t('settings.saved')} tone="success" /> : null}

              <Button
                label={busy ? t('settings.saving') : t('settings.save')}
                onPress={() => void save()}
                loading={busy}
                disabled={loading}
              />
            </>
          )}
        </Card>

        {error ? (
          <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : null}

        <Button label={t('accounts.logout')} variant="secondary" onPress={() => void signOut()} />

        <AppText variant="caption" tone="muted" style={{ color: colors.textMuted }}>
          {t('home.disclaimer')}
        </AppText>
      </View>
    </Screen>
  );
}
