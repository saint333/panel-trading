import '../src/i18n';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '../src/session/SessionProvider';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';

function RootNavigator() {
  const { colors, scheme } = useTheme();
  const { status } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'signedOut' && !inAuthGroup) {
      router.replace('/login');
    } else if (status === 'signedIn' && inAuthGroup) {
      router.replace('/(app)/index');
    }
  }, [status, inAuthGroup, router]);

  if (status === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
        accessibilityLabel="Comprobando la sesión"
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
