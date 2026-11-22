import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { palettes, type ColorScheme, type ThemeColors } from './tokens';

interface ThemeContextValue {
  scheme: ColorScheme;
  colors: ThemeColors;
  preference: 'system' | ColorScheme;
  setPreference: (preference: 'system' | ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<'system' | ColorScheme>('system');

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const setPreferenceSafely = useCallback((next: 'system' | ColorScheme) => {
    setPreference(next);
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
