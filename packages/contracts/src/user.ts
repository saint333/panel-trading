import { z } from 'zod';
import { localeSchema, themeSchema, timezoneSchema } from './settings.js';

/** Usuario tal y como lo ve el cliente. Nunca incluye hash de contraseña ni tokens. */
export const publicUserSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  timezone: timezoneSchema,
  locale: localeSchema,
  createdAt: z.string(),
});

export const userSettingsSchema = z.object({
  theme: themeSchema,
  weekStartsOn: z.number().int(),
  defaultAccountId: z.uuid().nullable(),
  notifyDaily: z.boolean(),
  notifyWeekly: z.boolean(),
});

export const sessionSchema = z.object({
  id: z.uuid(),
  userAgent: z.string().nullable(),
  current: z.boolean(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
  expiresAt: z.string(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;
export type UserSettingsView = z.infer<typeof userSettingsSchema>;
export type SessionView = z.infer<typeof sessionSchema>;
