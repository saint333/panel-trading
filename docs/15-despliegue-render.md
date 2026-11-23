# 15 — Desplegar la API en Render con PostgreSQL de Neon

> **Ámbito:** API (`apps/api`) y la URL que consume el APK. Complementa
> [`14-apk-android.md`](14-apk-android.md). **Estado:** vigente desde M2 (2026-11-22).
> Coste objetivo: **0 USD** (plan gratuito de Render + plan gratuito de Neon).

## 1. Qué queda desplegado y qué límites tiene

| Pieza | Dónde | Plan | Límite que te va a afectar |
|---|---|---|---|
| API NestJS | Render, runtime nativo Node | `free` | Se **duerme a los ~15 min** sin tráfico; el primer acceso tarda 30–60 s. Sin `preDeployCommand` (solo planes de pago). |
| PostgreSQL | Neon | `free` | ~0,5 GB y autosuspensión tras unos minutos de inactividad (la primera consulta tarda ~0,5 s). |

Los números exactos cambian: confírmalos en el panel al crear cada cuenta. Con estos planes
**no hace falta tarjeta** en ninguno de los dos servicios.

La API usa runtime nativo (no el `Dockerfile`), porque Render instala pnpm directamente y así el
build es más rápido y cacheable. El `apps/api/Dockerfile` sigue siendo válido para Fly.io, Koyeb o
un VPS.

## 2. Antes de empezar: el repositorio en GitHub

Render despliega desde GitHub. El repositorio ya está publicado en `origin`
(`github.com/saint333/panel-trading`) con la rama **`main`**, que es la que usa el blueprint.

> Si el repo es privado, autoriza a Render para leerlo desde *Account Settings → GitHub*.

## 3. Crear la base de datos en Neon

1. Entra en <https://neon.tech>, crea el proyecto y elige la región **más cercana al servidor de
   Render** (`aws-eu-central-1` para `frankfurt`; `aws-us-east-2` para `ohio`; etc.).
2. En *Dashboard → Connect*, **desactiva “Connection pooling”** y copia la cadena **directa**:

   ```
   postgresql://usuario:clave@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

   Se usa la conexión directa a propósito: la API es un proceso Node persistente (no serverless)
   y `prisma migrate` no funciona bien a través del pooler.
3. Guarda esa URL como `DATABASE_URL`.

## 4. Aplicar las migraciones

Con la base vacía hay que crear el esquema. El repo trae un script que lee la cadena de un archivo
ignorado por git, así que **no queda en el historial del shell**.

### 4.1 Con el script (recomendado)

1. Crea `apps/api/.env.neon` con una sola línea (`.env.*` está en `.gitignore`, nunca se commitea):

   ```
   DATABASE_URL="postgresql://usuario:clave@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"
   ```

2. Ejecuta desde la raíz:

   ```bash
   pnpm db:migrate:neon
   ```

El script imprime **solo** la base y el host (nunca la cadena), rechaza las URL con `-pooler` o sin
`sslmode=require`, y termina con `All migrations have been successfully applied` (o
`No pending migrations to apply` si ya estaban).

### 4.2 Con la variable en línea

Si prefieres no crear el archivo:

```bash
DATABASE_URL="postgresql://usuario:clave@ep-xxxx.../neondb?sslmode=require" \
  pnpm --filter @binomo/api prisma:deploy
```

En este caso la cadena queda en el historial del shell y en la lista de procesos.

Si te equivocas de base, borra el proyecto en Neon y repite: no hay `migrate reset` contra
producción.

### 4.3 Automático en cada push a `main`

[`.github/workflows/migrate.yml`](../.github/workflows/migrate.yml) aplica las migraciones pendientes
cuando un push a `main` toca `apps/api/prisma/**` (o al lanzarlo a mano desde *Actions*). Configúralo
una sola vez:

1. GitHub → *Settings → Secrets and variables → Actions → New repository secret*.
2. Nombre `NEON_DATABASE_URL`, valor: la misma cadena directa de Neon.

Así el esquema se actualiza sin tocar tu equipo. Es la alternativa gratuita a `preDeployCommand`,
que Render solo ofrece en planes de pago.

> El workflow y el deploy de Render arrancan a la vez. En la práctica el build de Render tarda varios
> minutos y la migración unos segundos, así que el esquema nuevo suele estar listo antes de que el
> código nuevo reciba tráfico. Mantén las migraciones **compatibles hacia atrás** (añadir columnas
> antes de usarlas) para que un solapamiento no rompa nada.

## 5. Crear el servicio en Render

1. Entra en <https://render.com> → *New → Blueprint* y conecta el repositorio.
2. Render lee [`render.yaml`](../render.yaml) y muestra un servicio `binomo-api` (plan free,
   `frankfurt`, health check en `/health`).
3. Al aplicar pedirá el valor de `DATABASE_URL` (está marcado `sync: false`): pega el de Neon.
   `JWT_ACCESS_SECRET` e `IP_HASH_SECRET` los genera Render automáticamente.
4. **Apply**. El build instala `pnpm@11.24.0` (la versión de `packageManager`, porque la global de
   Render es más antigua), instala el monorepo, compila `@binomo/domain` y `@binomo/contracts`,
   genera el cliente Prisma y compila la API.

Si tu región no es Europa, cambia `region` en `render.yaml` (`oregon`, `ohio`, `virginia`, `frankfurt`,
`singapore`) **antes** del primer apply y elige la región de Neon correspondiente.

### Variables de entorno

| Variable | Origen | Para qué |
|---|---|---|
| `DATABASE_URL` | Neon (conexión directa + `sslmode=require`) | Prisma |
| `JWT_ACCESS_SECRET` | Generada por Render | Firma del JWT de acceso; rotarla cierra todas las sesiones |
| `IP_HASH_SECRET` | Generada por Render | Sal para no guardar IPs en claro |
| `NODE_VERSION` | `render.yaml` (`22.14.0`) | `pnpm@11` exige Node ≥ 22.13 |
| `PORT` | La inyecta Render | El código ya lo lee |
| `CORS_ORIGINS` | Opcional | Solo si añades un cliente web; la app móvil no lo necesita |

`NODE_ENV=production` se fija en el `startCommand`, no como variable global, para que el build
conserve las devDependencies (`tsc`, `prisma`) que necesita.

## 6. Verificar

```bash
curl https://binomo-api.onrender.com/health        # {"status":"ok",...}
curl https://binomo-api.onrender.com/health/ready  # confirma conexión a Neon
```

- `/health` va **fuera** del prefijo `/v1` (así lo configura `app.setup.ts`).
- Swagger está desactivado con `NODE_ENV=production`: es lo esperado, no un fallo.
- El primer `curl` puede tardar ~1 min si el servicio estaba dormido.

Si `/health/ready` falla: revisa `DATABASE_URL` (falta `sslmode=require`, es la cadena con
`-pooler`, o el proyecto de Neon está suspendido), y luego los *Logs* del servicio.

## 7. Apuntar el APK al dominio HTTPS

Cuando la API responda:

1. En `apps/mobile/eas.json`, cambia el valor del perfil `preview`:

   ```json
   "env": { "EXPO_PUBLIC_API_URL": "https://binomo-api.onrender.com" }
   ```

2. En `apps/mobile/app.json`, actualiza `extra.apiUrl` al mismo dominio y **elimina el plugin
   `expo-build-properties`** (existía solo para permitir HTTP local):

   ```json
   "plugins": ["expo-router", "expo-secure-store"]
   ```

3. Recompila: `pnpm build:apk`. El APK anterior seguirá apuntando a la IP de la Wi‑Fi. Para listar
   builds y descargar el último: `npx --yes eas-cli@latest build:list --limit 3`.

A partir de ahí la app funciona en cualquier red. Con el plan gratuito, la primera petición tras
un rato sin uso puede tardar en responder (spin-down de Render).

## 8. Qué se despliega con cada push

Un `git push` a `main` no despliega todo por igual. Esto es lo que se actualiza solo:

| Pieza | ¿Se actualiza con el push? | Disparador |
|---|---|---|
| **CI** (lint, tipos, pruebas, build) | Sí, siempre | Cualquier push a `main` o PR |
| **Migraciones en Neon** | Sí, solo si cambia el esquema | Rutas de `apps/api/prisma/**` (o *Run workflow* manual) |
| **API en Render** | Sí, si cambia la API o lo compartido | `buildFilter` de [`render.yaml`](../render.yaml): `apps/api/**`, `packages/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.base.json` |
| **APK de Android** | **No** | Compilar e instalar a mano (§7.3). Los cambios de JavaScript sí llegan por OTA ([`14`, §6](14-apk-android.md)) |

Consecuencias prácticas:

- Tocar solo `docs/` o `README.md` **no** reconstruye Render: se salta el build que no aporta nada.
- Un push **no** compila el APK. Si cambias solo JavaScript de `apps/mobile`, publícalo con
  `pnpm --filter @binomo/mobile update:preview` y llega por OTA. Si cambias algo nativo (dependencia,
  permiso, icono) o la `version`, toca `pnpm build:apk` y reinstalar (`autoIncrement: true` sube el
  `versionCode` en cada build).
- El workflow de migraciones y el deploy de Render arrancan a la vez; el build de Render tarda
  minutos y la migración segundos, así que el esquema suele estar listo antes de que el código nuevo
  reciba tráfico. Aun así, mantén las migraciones **compatibles hacia atrás**.
- En plan gratuito no hay `preDeployCommand`; si contratas un plan de pago, descomenta esa línea en
  `render.yaml`.
- **Secretos:** cambiarlos en *Environment* del servicio reinicia el servicio y, en el caso del JWT,
  invalida las sesiones existentes (la app pedirá login de nuevo).

## 9. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| Build falla con `ERR_PNPM_UNSUPPORTED_ENGINE` o pide Node ≥ 22.13 | Render usó otra versión de Node | Mantener `NODE_VERSION=22.14.0` en `render.yaml` |
| `ERR_PNPM_BAD_PM_VERSION` o el lockfile “no es compatible” | La pnpm global de Render no coincide con `packageManager` | La versión se fija en el `buildCommand`; si cambias `packageManager`, actualízala ahí también |
| `Cannot find module '@binomo/domain'` / `'@binomo/contracts'` | Se compiló la API sin construir los paquetes | Respetar el orden del `buildCommand` |
| `The table public.users does not exist` (P2021) | No se aplicaron las migraciones | Ejecutar el §4 (o revisar el workflow del §4.3) y redesplegar |
| El login devuelve `500` en vez de `401` | La tabla existe pero falta esa migración | Mismo caso: `pnpm db:migrate:neon` |
| `Can't reach database server` / error de certificado | URL con `-pooler` o sin `sslmode=require` | Usar la cadena directa de Neon |
| `Application failed to respond` | El proceso no escucha en `PORT` o murió al arrancar | Revisar *Logs*; la API ya usa `PORT` inyectado |
| Primera petición de la mañana tarda ~1 min | Spin-down del plan gratuito | Aceptarlo o pasar a plan de pago |
| `502` tras un deploy correcto | Migración pendiente y *readiness* fallando | Ver §4 |
