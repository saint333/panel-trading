# 14 — Generar e instalar el APK de Android

> **Ámbito:** `apps/mobile`. Complementa [`13-pruebas-en-dispositivo.md`](13-pruebas-en-dispositivo.md)
> (Expo Go) y el [`README.md`](../README.md) raíz. **Estado:** vigente desde M2 (2026-11-22).

## 1. Qué obtienes con cada camino

| Camino | Qué hace falta | Resultado |
|---|---|---|
| **EAS Build (nube)** | Cuenta gratuita de Expo, internet | Un `.apk` descargable desde el navegador o el enlace del build. Es el camino documentado aquí. |
| **Build local** | JDK 17 + Android SDK (Android Studio) | Un `.apk` generado en tu PC con Gradle. No hay Java ni SDK instalados en este equipo. |
| **Expo Go** | Nada nativo | No genera APK: ejecuta el bundle dentro de la app Expo Go (ver `13`). |

El APK **no incluye la API ni la base de datos**: la app sigue necesitando el servidor NestJS en marcha
y accesible desde el móvil.

## 2. Antes de compilar: la IP de la API

La URL de la API se **incrusta en el APK al compilar**. `apps/mobile/.env` no se sube a EAS (está en
`.gitignore`), así que el valor que cuenta es `EXPO_PUBLIC_API_URL` del perfil `preview` en
`apps/mobile/eas.json`:

```json
"env": {
  "EXPO_PUBLIC_API_URL": "http://192.168.15.17:3000"
}
```

1. En este equipo ya está puesta la IPv4 de la Wi‑Fi (`192.168.15.17`); `extra.apiUrl` de `app.json`
   usa el mismo valor como respaldo. Si cambias de red, sustituye la IP por la que muestre
   `ipconfig` en Windows → *Dirección IPv4* (y actualiza también `apps/mobile/.env`).
2. El móvil y el PC deben estar en la **misma Wi‑Fi** (las redes de invitados aíslan clientes).
3. Permite `node.exe` en el Firewall de Windows para redes privadas y comprueba desde el navegador
   del móvil que `http://<IP>:3000/health` responde.
4. Arranca la API con `pnpm db:up && pnpm dev` (o solo `pnpm --filter @binomo/api dev`).

El APK permite HTTP sin cifrar (`usesCleartextTraffic`) solo para probar contra la API local. En
producción la API debe ir por HTTPS y esa opción debe quitarse de `app.json`.

## 3. Compilar el APK (EAS, ~10–15 min la primera vez)

```bash
cd apps/mobile
npx --yes eas-cli@latest login        # cuenta gratuita en https://expo.dev/signup
npx --yes eas-cli@latest init         # solo la primera vez: vincula el proyecto
pnpm build:apk                        # equivale a: eas build -p android --profile preview
```

La primera vez la CLI pregunta: crear el proyecto en tu cuenta (`init`), generar un *keystore*
(firma) de Android y confirmar el perfil `preview`. Acepta las opciones por defecto.

- El perfil `preview` usa `distribution: internal` y `buildType: apk`, es decir, un APK instalable
  (no un `.aab` de Play Store) y con el bundle de JavaScript incluido: **funciona sin Metro**.
- Al terminar, la terminal muestra un enlace `https://expo.dev/accounts/.../builds/...`; ábrelo y
  pulsa **Install** / **Download**. También puedes listar builds con
  `npx --yes eas-cli@latest build:list`.
- Si cambias código de la app, la URL o cualquier configuración, hay que **volver a compilar**: el
  APK no se actualiza solo.

> EAS Build es gratuito para APK de uso interno; los builds pueden esperar en cola en horas punta.

## 4. Instalar en el teléfono

1. Descarga el APK en el móvil (mismo enlace del build) o pásalo por cable/Drive.
2. Abre el archivo y acepta **“Instalar apps desconocidas”** para el navegador o el explorador de
   archivos.
3. Si ya había una versión instalada con otra firma, Android responderá *“App not installed”*:
   desinstala la anterior y vuelve a instalar.
4. Abre **Binomo Analytics** y valida: registro → cuenta real → cierre y reapertura (la sesión debe
   persistir en SecureStore) → inicio con el listado de cuentas.

## 5. Alternativa: build local sin EAS

Requiere instalar JDK 17 y el Android SDK (Android Studio → SDK Manager), además de variables
`JAVA_HOME` y `ANDROID_HOME`.

```bash
cd apps/mobile
npx expo prebuild --platform android
npx expo run:android --variant release
```

El `.apk` queda en `apps/mobile/android/app/build/outputs/apk/release/`. Es más rápido para iterar,
pero `android/` está en `.gitignore`: se regenera en cada `prebuild`.

## 6. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| “Network request failed” en toda la app | IP incorrecta, otra Wi‑Fi, firewall o API parada | Probar `/health` en el navegador del móvil y corregir `EXPO_PUBLIC_API_URL`; recompilar |
| La app abre pero el login falla con error de red | Se compiló con la IP antigua | Editar `eas.json` y recompilar |
| “App not installed” | Firma distinta o versión anterior | Desinstalar la app previa |
| El build falla al instalar dependencias | `pnpm-lock.yaml` desactualizado | `pnpm install` en la raíz y volver a compilar |
| El build falla por versión de Node | EAS usa la imagen por defecto (Node 20) y `pnpm@11` exige ≥ 22.13 | Ya está fijado en el perfil `preview` con `"node": "22.14.0"`; si se cambia `packageManager`, revisar ese valor |
| Se subió el SDK de Expo y ya no abre Expo Go | Expo Go admite un solo SDK | Usar este APK en lugar de Expo Go (ver `13`, §3) |

## 7. Qué no resuelve este APK

- Publicación en Play Store (requiere `.aab`, firma de producción y ficha de tienda — M8).
- Uso fuera de la red local: mientras la API no esté desplegada con HTTPS, el APK solo funciona en la
  Wi‑Fi del PC que la ejecuta.
- Icono/splash definitivos y actualizaciones OTA (EAS Update), que no forman parte de M2.
