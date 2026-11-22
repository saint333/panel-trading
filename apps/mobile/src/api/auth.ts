import { apiRequest } from './client';

export interface AuthUser {
  id: string;
  email: string;
  timezone: string;
  locale: string;
  createdAt: string;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

export interface Account {
  id: string;
  name: string;
  type: 'REAL' | 'DEMO';
  currency: string;
  openingBalanceMinor: string;
  confirmedBalanceMinor: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export interface CreateAccountInput {
  name: string;
  type: 'REAL' | 'DEMO';
  currency: string;
  openingBalanceMinor: string;
}

export function login(email: string, password: string): Promise<AuthResult> {
  return apiRequest<AuthResult>('/v1/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function register(input: {
  email: string;
  password: string;
  timezone: string;
}): Promise<AuthResult> {
  return apiRequest<AuthResult>('/v1/auth/register', {
    method: 'POST',
    body: { ...input, locale: 'es' },
    auth: false,
  });
}

export function logout(): Promise<void> {
  return apiRequest<void>('/v1/auth/logout', { method: 'POST' });
}

export interface MeOverview {
  user: AuthUser;
  settings: {
    theme: 'light' | 'dark' | 'system';
    weekStartsOn: number;
    defaultAccountId: string | null;
  };
}

export function fetchMe(): Promise<MeOverview> {
  return apiRequest<MeOverview>('/v1/me');
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  weekStartsOn: number;
  defaultAccountId: string | null;
  notifyDaily: boolean;
  notifyWeekly: boolean;
}

export function updateSettings(input: {
  timezone?: string;
  defaultAccountId?: string | null;
}): Promise<UserSettings> {
  return apiRequest<UserSettings>('/v1/me/settings', { method: 'PATCH', body: input });
}

export function fetchAccounts(): Promise<Account[]> {
  return apiRequest<Account[]>('/v1/accounts');
}

export function createAccount(input: CreateAccountInput): Promise<Account> {
  return apiRequest<Account>('/v1/accounts', { method: 'POST', body: input });
}
