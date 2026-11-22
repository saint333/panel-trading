import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  Divider,
  ListRow,
  Screen,
  SectionHeader,
  Skeleton,
  StateView,
  StatTile,
  Toggle,
} from '../src/components';
import { API_URL, fetchHealth, type HealthResponse } from '../src/config/api';
import { useTheme } from '../src/theme/ThemeProvider';

type Status = 'loading' | 'ok' | 'error';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, scheme, setPreference } = useTheme();
  const [status, setStatus] = useState<Status>('loading');
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const check = useCallback(async () => {
    setStatus('loading');
    setHealth(null);

    try {
      const result = await fetchHealth();
      setHealth(result);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  return (
    <Screen scroll>
      <View style={{ gap: 4 }}>
        <AppText variant="display" weight="bold">
          {t('app.name')}
        </AppText>
        <AppText tone="muted">{t('app.tagline')}</AppText>
      </View>

      <Card>
        <SectionHeader title={t('home.title')} subtitle={t('home.subtitle')} />

        {status === 'loading' ? (
          <View
            style={{ gap: 10, marginTop: 8 }}
            accessibilityLabel={t('home.stateLoading')}
            accessibilityRole="progressbar"
          >
            <Skeleton height={22} width="65%" />
            <Skeleton height={14} width="45%" />
            <Skeleton height={48} />
          </View>
        ) : null}

        {status === 'error' ? (
          <StateView
            state="error"
            title={t('home.stateError')}
            description={API_URL}
            onRetry={() => void check()}
            retryLabel={t('common.retry')}
          />
        ) : null}

        {status === 'ok' && health ? (
          <View style={{ gap: 12, marginTop: 8 }}>
            <Badge label={t('home.stateOk')} tone="success" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatTile label={t('home.uptime')} value={`${health.uptimeSeconds}s`} />
              <StatTile label={t('home.version')} value={`v${health.version}`} />
            </View>
          </View>
        ) : null}

        <Divider />

        <ListRow title={t('home.apiUrl')} subtitle={API_URL} value={health?.service} />

        {status !== 'loading' ? (
          <Button label={t('home.checkAgain')} variant="secondary" onPress={() => void check()} />
        ) : null}
      </Card>

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
