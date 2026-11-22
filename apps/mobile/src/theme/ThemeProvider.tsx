import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { palettes, type ColorScheme, type ThemeColors } from './tokens';

const PREFERENCE_KEY = 'binomo.themePreference';

type Preference = 'system' | ColorScheme;

function isPreference(value: string | null): value is Preference {
  return value === 'system' || value === 'light' || value === 'dark';
}

interface ThemeContextValue {
  scheme: ColorScheme;
  colors: ThemeColors;
  preference: 'system' | ColorScheme;
  setPreference: (preference: 'system' | ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<Preference>('system');

  // La preferencia no es un secreto, pero SecureStore es el almacén persistente
  // que ya usa la app y funciona sin añadir dependencias.
  useEffect(() => {
    let active = true;

    SecureStore.getItemAsync(PREFERENCE_KEY)
      .then((stored) => {
        if (active && isPreference(stored)) setPreference(stored);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const setPreferenceSafely = useCallback((next: Preference) => {
    setPreference(next);
    void SecureStore.setItemAsync(PREFERENCE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      colors: palettes[scheme],
      preference,
      setPreference: setPreferenceSafely,
    }),
    [scheme, preference, setPreferenceSafely],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }

  return context;
}
