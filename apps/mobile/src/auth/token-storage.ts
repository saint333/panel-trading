import * as SecureStore from 'expo-secure-store';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_KEY = 'binomo.accessToken';
const REFRESH_KEY = 'binomo.refreshToken';

/** `undefined` = todavía no se ha leído el almacén; `null` = no hay sesión. */
let cache: Tokens | null | undefined;

export async function loadTokens(): Promise<Tokens | null> {
  if (cache !== undefined) return cache;

  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);

    cache = accessToken && refreshToken ? { accessToken, refreshToken } : null;
  } catch {
    // Almacén no disponible (por ejemplo, web o dispositivo restringido).
    cache = null;
  }

  return cache;
}

export async function saveTokens(tokens: Tokens): Promise<void> {
  cache = tokens;

  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  cache = null;

  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]).catch(() => undefined);
}
