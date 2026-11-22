import { z } from 'zod';

const DEV_ACCESS_SECRET = 'dev-only-access-secret-change-me-0123456789';
const DEV_IP_HASH_SECRET = 'dev-only-ip-hash-secret';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    DATABASE_URL: z.string().min(1).optional(),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    CORS_ORIGINS: z.string().default(''),
    API_VERSION: z.string().default('0.1.0'),
    /** Secreto del JWT de acceso. En producción es obligatorio y sin valor por defecto. */
    JWT_ACCESS_SECRET: z.string().min(32).default(DEV_ACCESS_SECRET),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
    /** Sal para no guardar IPs en claro en la tabla de sesiones. */
    IP_HASH_SECRET: z.string().min(16).default(DEV_IP_HASH_SECRET),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;

    if (env.JWT_ACCESS_SECRET === DEV_ACCESS_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_ACCESS_SECRET'],
        message: 'Obligatorio definir un secreto propio en producción',
      });
    }

    if (env.IP_HASH_SECRET === DEV_IP_HASH_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['IP_HASH_SECRET'],
        message: 'Obligatorio definir una sal propia en producción',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function loadEnv(raw: Record<string, unknown> = process.env): Env {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');

    throw new Error(`Configuración de entorno inválida → ${details}`);
  }

  return parsed.data;
}

export function parseCorsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
