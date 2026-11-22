import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { clearTokens, loadTokens, saveTokens } from '../auth/token-storage';
import { fetchMe, login, logout, register, type AuthResult, type AuthUser } from '../api/auth';
import { setSessionExpiredHandler } from '../api/client';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface SessionValue {
  status: Status;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; timezone: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const applySession = useCallback(async (result: AuthResult) => {
    await saveTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    setUser(result.user);
    setStatus('signedIn');
  }, []);

  const forgetSession = useCallback(async () => {
    await clearTokens();
    setUser(null);
    setStatus('signedOut');
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus('signedOut');
    });

    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const tokens = await loadTokens();

      if (!tokens) {
        if (active) setStatus('signedOut');
        return;
      }

      try {
        const me = await fetchMe();
        if (!active) return;
        setUser(me.user);
        setStatus('signedIn');
      } catch {
        await clearTokens();
        if (active) setStatus('signedOut');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await login(email.trim(), password);
      await applySession(result);
    },
    [applySession],
  );

  const signUp = useCallback(
    async (input: { email: string; password: string; timezone: string }) => {
      const result = await register({ ...input, email: input.email.trim() });
      await applySession(result);
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    await logout().catch(() => undefined);
    await forgetSession();
  }, [forgetSession]);

  const value = useMemo<SessionValue>(
    () => ({ status, user, signIn, signUp, signOut }),
    [status, user, signIn, signUp, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession debe usarse dentro de SessionProvider');
  }

  return context;
}
