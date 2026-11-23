#!/usr/bin/env node
/**
 * Aplica las migraciones de Prisma contra la base de Neon sin escribir la cadena
 * de conexión en el historial del shell ni en el repositorio.
 *
 * Orden de búsqueda de DATABASE_URL:
 *   1. la variable de entorno DATABASE_URL (lo que usa el CI);
 *   2. apps/api/.env.neon, que está en .gitignore y solo existe en tu equipo.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = resolve(root, 'apps/api/.env.neon');

function fromEnvFile() {
  if (!existsSync(envFile)) return null;

  for (const raw of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const match = /^(?:export\s+)?DATABASE_URL\s*=\s*(.+)$/.exec(line);
    if (match) return match[1].trim().replace(/^(['"])(.*)\1$/, '$2');
  }

  return null;
}

const url = process.env.DATABASE_URL?.trim() || fromEnvFile();

if (!url) {
  console.error(
    [
      '',
      'No encontré la cadena de conexión.',
      '',
      `Crea ${envFile} (está en .gitignore) con una sola línea:`,
      '',
      '  DATABASE_URL="postgresql://usuario:clave@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"',
      '',
      'O pásala como variable de entorno: DATABASE_URL="..." pnpm db:migrate:neon',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

// Los errores típicos se detectan aquí, antes de que Prisma falle con un mensaje críptico.
const problems = [];
if (!/^postgres(ql)?:\/\//.test(url)) {
  problems.push('no empieza por postgresql://');
}
if (url.includes('-pooler')) {
  problems.push('es la cadena con -pooler y las migraciones necesitan la conexión directa');
}
if (!/sslmode=require/.test(url)) {
  problems.push('le falta sslmode=require');
}

if (problems.length > 0) {
  console.error(`La cadena de conexión no sirve: ${problems.join('; ')}.`);
  process.exit(1);
}

// Nunca se imprime la cadena completa: solo host y base, para confirmar el proyecto.
let target = '(destino oculto)';
try {
  const parsed = new URL(url);
  target = `${parsed.pathname.replace(/^\//, '') || 'base'} @ ${parsed.hostname}`;
} catch {
  // Si la cadena trae caracteres sin codificar, seguimos sin mostrarla.
}

console.log(`Aplicando migraciones en ${target} ...`);

const result = spawnSync('pnpm', ['--filter', '@binomo/api', 'prisma:deploy'], {
  cwd: root,
  env: { ...process.env, DATABASE_URL: url },
  stdio: 'inherit',
  // En Windows el binario es pnpm.cmd y solo se resuelve a través del shell.
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
