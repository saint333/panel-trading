import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Correo inválido').max(254);

export const passwordSchema = z
  .string()
  .min(12, 'La contraseña debe tener al menos 12 caracteres')
  .max(128, 'La contraseña no puede superar 128 caracteres');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  timezone: z.string().min(1).max(64).default('UTC'),
  locale: z.enum(['es']).default('es'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).max(512),
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  accessTokenExpiresIn: z.number().int().positive(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
