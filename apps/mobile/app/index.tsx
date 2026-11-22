import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText } from '../src/components/AppText';
import { Badge } from '../src/components/Badge';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { StateView } from '../src/components/StateView';
import { API_URL, fetchHealth, type HealthResponse } from '../src/config/api';
import { useTheme } from '../src/theme/ThemeProvider';

type Status = 'loading' | 'ok' | 'error';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
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
    <Screen>
      <View style={{ gap: 4 }}>
        <AppText variant="display" weight="bold">
          {t('app.name')}
        </AppText>
        <AppText tone="muted">{t('app.tagline')}</AppText>
      </View>

      <Card>
        <AppText variant="title" weight="bold">
          {t('home.title')}
        </AppText>
        <AppText tone="muted">{t('home.subtitle')}</AppText>

        {status === 'loading' ? <StateView state="loading" title={t('home.stateLoading')} /> : null}

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
          <View style={{ gap: 6, marginTop: 4 }}>
            <Badge label={t('home.stateOk')} tone="success" />
            <AppText variant="caption" tone="muted">
              {health.service} · v{health.version} · {health.uptimeSeconds}s
            </AppText>
          </View>
        ) : null}

        <View
          style={{
            marginTop: 8,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 4,
          }}
        >
          <AppText variant="caption" tone="muted">
            {t('home.apiUrl')}: {API_URL}
          </AppText>
        </View>

        {status !== 'loading' ? (
          <Button label={t('home.checkAgain')} variant="secondary" onPress={() => void check()} />
        ) : null}
      </Card>

      <AppText variant="caption" tone="muted">
        {t('home.disclaimer')}
      </AppText>
    </Screen>
  );
}
