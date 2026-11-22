import { z } from 'zod';

export const themeSchema = z.enum(['light', 'dark', 'system']);

/** Zona horaria IANA válida. Se valida con Intl en lugar de mantener una lista. */
export const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, 'Zona horaria inválida: usa un identificador IANA (Europe/Madrid)');

export const localeSchema = z.enum(['es']);

export const updateSettingsSchema = z
  .object({
    theme: themeSchema.optional(),
    timezone: timezoneSchema.optional(),
    locale: localeSchema.optional(),
    weekStartsOn: z.number().int().min(0).max(6).optional(),
    defaultAccountId: z.uuid().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Nada que actualizar');

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
