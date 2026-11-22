import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, Card, Chip, Input, Screen, SectionHeader } from '../../src/components';
import { ApiError } from '../../src/api/client';
import { createAccount } from '../../src/api/auth';
import { parseAmountToMinor } from '../../src/utils/money';
import { spacing } from '../../src/theme/tokens';

export default function NewAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState('');
  const [type, setType] = useState<'REAL' | 'DEMO'>('REAL');
  const [currency, setCurrency] = useState('EUR');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);

    const openingBalanceMinor = parseAmountToMinor(amount);

    if (!name.trim()) {
      setError(t('accounts.name'));
      return;
    }

    if (openingBalanceMinor === null) {
      setError(t('accounts.invalidAmount'));
      return;
    }

    if (!/^[A-Za-z]{3}$/.test(currency.trim())) {
      setError(t('accounts.currency'));
      return;
    }

    setBusy(true);

    try {
      await createAccount({
        name: name.trim(),
        type,
        currency: currency.trim().toUpperCase(),
        openingBalanceMinor,
      });
      router.back();
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
          <SectionHeader title={t('accounts.newTitle')} />

          <Input
            label={t('accounts.name')}
            value={name}
            onChangeText={setName}
            placeholder={t('accounts.namePlaceholder')}
            autoCapitalize="sentences"
            maxLength={80}
            required
          />

          <View style={{ gap: spacing.xs }}>
            <AppText variant="caption" weight="medium" tone="muted">
              {t('accounts.type')}
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Chip
                label={t('accounts.real')}
                selected={type === 'REAL'}
                onPress={() => setType('REAL')}
              />
              <Chip
                label={t('accounts.demo')}
                selected={type === 'DEMO'}
                onPress={() => setType('DEMO')}
              />
            </View>
          </View>

          <Input
            label={t('accounts.currency')}
            value={currency}
            onChangeText={setCurrency}
            autoCapitalize="characters"
            maxLength={3}
            required
          />

          <Input
            label={t('accounts.openingBalance')}
            value={amount}
            onChangeText={setAmount}
            placeholder="1000,00"
            keyboardType="decimal-pad"
            hint={t('accounts.openingBalanceHint')}
          />
        </Card>

        {error ? (
          <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : null}

        <Button
          label={busy ? t('accounts.creating') : t('accounts.create')}
          onPress={() => void submit()}
          loading={busy}
          disabled={!name}
        />
      </View>
    </Screen>
  );
}
