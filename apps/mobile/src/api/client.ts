import { API_URL } from '../config/api';
import { clearTokens, loadTokens, saveTokens } from '../auth/token-storage';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class SessionExpiredError extends ApiError {
  constructor(message = 'Tu sesión caducó. Vuelve a iniciar sesión.') {
    super(401, 'SESSION_EXPIRED', message);
    this.name = 'SessionExpiredError';
  }
}

let onSessionExpired: (() => void) | null = null;

/** Permite que la sesión se cierre sola cuando el refresh deja de ser válido. */
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

/** Sin esto, una IP inalcanzable deja la pantalla cargando para siempre. */
const REQUEST_TIMEOUT_MS = 15_000;

async function rawRequest(
  path: string,
  options: { method: string; token?: string; body?: unknown },
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${API_URL}${path}`, {
      method: options.method,
      headers: {
        accept: 'application/json',
        ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[];
  } | null;

  return new ApiError(
    response.status,
    body?.code ?? 'HTTP_ERROR',
    body?.message ?? `La API respondió ${response.status}`,
    body?.details,
  );
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();

  if (!tokens) return null;

  // Si la red falla, `fetch` rechaza: se propaga y los tokens se conservan.
  const response = await rawRequest('/v1/auth/refresh', {
    method: 'POST',
    body: { refreshToken: tokens.refreshToken },
  });

  if (response.status === 401 || response.status === 403) {
    await clearTokens();
    return null;
  }

  // Un 5xx no invalida la sesión: se deja que el error llegue a la pantalla.
  if (!response.ok) {
    throw await readError(response);
  }

  const data = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });

  return data.accessToken;
}

/**
 * Petición a la API. Si el acceso caducó, rota el refresh una sola vez (aunque
 * haya varias peticiones en paralelo) y repite la original.
 */
export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  let response: Response;

  if (auth) {
    const tokens = await loadTokens();

    if (!tokens) {
      onSessionExpired?.();
      throw new SessionExpiredError();
    }

    response = await rawRequest(path, { method, body, token: tokens.accessToken });

    if (response.status === 401) {
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });

      const accessToken = await refreshInFlight;

      if (!accessToken) {
        onSessionExpired?.();
        throw new SessionExpiredError();
      }

      response = await rawRequest(path, { method, body, token: accessToken });
    }
  } else {
    response = await rawRequest(path, { method, body });
  }

  if (response.status === 204) return undefined as T;
  if (!response.ok) throw await readError(response);

  return (await response.json()) as T;
}
