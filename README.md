# Binomo Analytics

App móvil de **registro, control financiero y análisis** de operaciones de opciones binarias.
No ejecuta operaciones, no se conecta a Binomo y no guarda credenciales del bróker.

- **App:** React Native + Expo (SDK 54) + Expo Router + TypeScript.
- **API:** NestJS 11 (monolito modular) + REST + OpenAPI + Prisma + PostgreSQL.
- **Dominio compartido:** un solo paquete con el dinero, el PnL y las métricas.
- **Monorepo:** pnpm workspaces + Turborepo.

La documentación de producto, arquitectura y decisiones vive en [`docs/`](docs/README.md).

## Estado

**M1 — Fundaciones completado** (2026-11-22):

- Monorepo, TypeScript estricto, ESLint/Prettier, husky y CI.
- `@binomo/domain`: dinero entero, PnL, saldo, conciliación y métricas (55 pruebas, cobertura 99 %).
- `@binomo/contracts`: esquemas Zod compartidos.
- API NestJS con `/health`, `/health/ready`, OpenAPI en `/v1/docs`, errores con `requestId` y logs sin PII.
- Esquema Prisma del MVP (17 tablas), migración con restricciones de integridad y Postgres en Docker.
- App Expo con Expo Router, tema claro/oscuro, i18n español y kit de 15 componentes de UI.
  La pantalla de inicio comprueba la API y muestra estados de carga, error y éxito.

Pendiente de M1: build instalable en dispositivo (requiere EAS o un equipo con Android Studio/Xcode).

## Requisitos

- Node.js ≥ 22 (probado con 24)
- pnpm 11 (`corepack enable`)
- Docker (solo para PostgreSQL local)

## Puesta en marcha

```bash
corepack enable
pnpm install

# Base de datos
pnpm db:up

# Variables y esquema (solo la primera vez)
cp apps/api/.env.example apps/api/.env
pnpm --filter @binomo/api prisma:migrate

# API (3000) + Metro (8081) a la vez
pnpm dev
```

- API: `http://localhost:3000/health` · Swagger: `http://localhost:3000/v1/docs`
- App: abre `exp://<IP-de-tu-PC>:8081` en Expo Go (SDK 54). La app toma
  `EXPO_PUBLIC_API_URL` de `apps/mobile/.env`; si la IP del PC cambia, actualízala allí.
- Parar: `Ctrl+C` y `pnpm db:down`.
- Prueba en un móvil real: ver [`docs/13-pruebas-en-dispositivo.md`](docs/13-pruebas-en-dispositivo.md).

## Estructura

```
apps/
  api/        NestJS + Prisma (REST /v1)
  mobile/     Expo + Expo Router
packages/
  domain/     Dinero, PnL, saldo, métricas (sin dependencias)
  contracts/  Esquemas Zod compartidos
  testing/    Fixtures deterministas
docs/         Producto, arquitectura, modelo de datos, roadmap
```

Regla: **la lógica financiera solo existe en `packages/domain`**. Ni la API ni la app reimplementan fórmulas.

## Comandos

| Comando            | Qué hace                                |
| ------------------ | --------------------------------------- |
| `pnpm build`       | Compila todos los paquetes              |
| `pnpm typecheck`   | TypeScript estricto en todo el monorepo |
| `pnpm lint`        | ESLint                                  |
| `pnpm test`        | Pruebas (dominio y API)                 |
| `pnpm test:domain` | Solo dominio, con cobertura             |
| `pnpm dev`         | API y app a la vez, con recarga         |
| `pnpm db:up`       | Levanta PostgreSQL en Docker            |
| `pnpm db:down`     | Para PostgreSQL                         |
| `pnpm stop:dev`    | Libera los puertos 3000 y 8081          |
| `pnpm format`      | Prettier                                |

## Decisiones que no se negocian

1. **Dinero en enteros** (unidades menores `bigint`, `BIGINT` en Postgres). Nunca `number` para importes.
2. **PnL derivado**: el cliente no envía `netPnlMinor`; lo calcula el dominio y lo valida la base de datos.
3. **Saldo calculado vs confirmado**: la app nunca “corrige” sola; muestra la diferencia.
4. **Sin integración con Binomo**: registro manual e importación de archivos del usuario.
5. **Métricas con `null`**: si no se pueden calcular, no se muestra `0`.
6. **Los empates no cortan rachas** y quedan fuera del win rate.

## Verificación

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

La CI (`.github/workflows/ci.yml`) aplica las migraciones desde cero en un Postgres limpio,
ejecuta lint, tipos, pruebas, build y un escaneo de secretos con gitleaks.
