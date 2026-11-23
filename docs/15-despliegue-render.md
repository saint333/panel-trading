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

Render despliega desde GitHub. Este repositorio **todavía no tiene remoto**:

```bash
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin master
```

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

## 4. Aplicar las migraciones (antes del primer deploy)

Con la base vacía hay que crear el esquema. Desde la raíz del repo:

```bash
DATABASE_URL="postgresql://usuario:clave@ep-xxxx.../neondb?sslmode=require" \
  pnpm --filter @binomo/api prisma:deploy
```

Debe imprimir `All migrations have been successfully applied`. Si te equivocas de base, borra el
proyecto en Neon y repite: no hay `migrate reset` contra producción.

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

3. Recompila: `pnpm build:apk`. El APK anterior seguirá apuntando a la IP de la Wi‑Fi.

A partir de ahí la app funciona en cualquier red. Con el plan gratuito, la primera petición tras
un rato sin uso puede tardar en responder (spin-down de Render).

## 8. Actualizaciones y migraciones futuras

- **Código:** `git push` a `master` → Render reconstruye solo (filtrado por `buildFilter`).
- **Esquema:** al añadir una migración, ejecuta el comando del §4 contra Neon **antes** de que el
  nuevo código quede activo. En plan gratuito no hay migración automática; si contratas un plan de
  pago, descomenta `preDeployCommand` en `render.yaml`.
- **Secretos:** cambiarlos en *Environment* del servicio reinicia el servicio y, en el caso del JWT,
  invalida las sesiones existentes (la app pedirá login de nuevo).

## 9. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| Build falla con `ERR_PNPM_UNSUPPORTED_ENGINE` o pide Node ≥ 22.13 | Render usó otra versión de Node | Mantener `NODE_VERSION=22.14.0` en `render.yaml` |
| `ERR_PNPM_BAD_PM_VERSION` o el lockfile “no es compatible” | La pnpm global de Render no coincide con `packageManager` | La versión se fija en el `buildCommand`; si cambias `packageManager`, actualízala ahí también |
| `Cannot find module '@binomo/domain'` / `'@binomo/contracts'` | Se compiló la API sin construir los paquetes | Respetar el orden del `buildCommand` |
| `The table public.users does not exist` (P2021) | No se aplicaron las migraciones | Ejecutar el §4 y redesplegar |
| `Can't reach database server` / error de certificado | URL con `-pooler` o sin `sslmode=require` | Usar la cadena directa de Neon |
| `Application failed to respond` | El proceso no escucha en `PORT` o murió al arrancar | Revisar *Logs*; la API ya usa `PORT` inyectado |
| Primera petición de la mañana tarda ~1 min | Spin-down del plan gratuito | Aceptarlo o pasar a plan de pago |
| `502` tras un deploy correcto | Migración pendiente y *readiness* fallando | Ver §4 |
