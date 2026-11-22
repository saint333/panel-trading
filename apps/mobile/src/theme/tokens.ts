export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  caption: 12,
  body: 15,
  bodyLarge: 17,
  title: 22,
  display: 30,
} as const;

export const lineHeight = {
  caption: 16,
  body: 22,
  bodyLarge: 24,
  title: 28,
  display: 36,
} as const;

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  overlay: string;
}

const light: ThemeColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  primary: '#0f766e',
  primaryText: '#ffffff',
  success: '#15803d',
  danger: '#b91c1c',
  warning: '#b45309',
  info: '#1d4ed8',
  overlay: 'rgba(15, 23, 42, 0.45)',
};

const dark: ThemeColors = {
  background: '#0b1220',
  surface: '#111a2b',
  surfaceElevated: '#162134',
  border: '#22304a',
  text: '#e6edf7',
  textMuted: '#94a3b8',
  primary: '#2dd4bf',
  primaryText: '#04211d',
  success: '#4ade80',
  danger: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const palettes: Record<ColorScheme, ThemeColors> = { light, dark };
