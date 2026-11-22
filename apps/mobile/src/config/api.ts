import Constants from 'expo-constants';

const DEFAULT_API_URL = 'http://localhost:3000';

/** En Android emulado `localhost` apunta al propio móvil. */
function resolveDefault(): string {
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  return extra?.apiUrl ?? DEFAULT_API_URL;
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? resolveDefault()).replace(/\/+$/, '');

export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`, {
    headers: { accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`La API respondió ${response.status}`);
  }

  return (await response.json()) as HealthResponse;
}
