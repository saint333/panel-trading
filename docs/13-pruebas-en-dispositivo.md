# 13 — Probar la app en un dispositivo real con Expo Go

> **Ámbito:** desarrollo local de `apps/mobile`. Complementa la puesta en marcha del
> [`README.md`](../README.md) raíz. **Estado:** vigente desde M1 (2026-11-22).

## 1. Para qué sirve este documento

Expo Go permite abrir la app en un teléfono físico sin compilar nada nativo: Metro sirve el bundle
por la red local y el teléfono lo ejecuta dentro de la aplicación Expo Go. Es el camino más corto
para validar UI y llamadas a la API durante los primeros hitos.

Su contrapartida es que **no es un entorno de producción**: cada versión de Expo Go trae un único
SDK de Expo y no admite código nativo propio. Este documento explica cómo conectar el teléfono y
qué cosas no se pueden probar así.

## 2. Requisitos

| Lado | Requisito |
|---|---|
| PC | Node ≥ 22, pnpm 11, dependencias instaladas, PostgreSQL arriba (`pnpm db:up`) |
| PC | API y Metro corriendo con `pnpm dev` |
| Red | PC y teléfono en la **misma Wi-Fi**, sin aislamiento de clientes (las redes de invitados suelen aislar) |
| Móvil | Expo Go con el **mismo SDK** que el proyecto: este repo usa **SDK 54** |

La app toma la IP del PC de `apps/mobile/.env` (`EXPO_PUBLIC_API_URL`). Si el router asigna otra IP,
actualiza esa línea; el comando para consultarla está en el propio archivo.

## 3. Limitación principal: un SDK por versión de Expo Go

Cada build de Expo Go incluye **un solo** SDK. Si el proyecto y la app no coinciden, Expo Go muestra
*“Project is incompatible with this version of Expo Go”* y no abre nada. No es un error del código.

| Plataforma | Qué instalar para SDK 54 |
|---|---|
| Android | Play Store ya distribuye SDK 58 → descarga el APK de **SDK 54** en <https://expo.dev/go> (elegir SDK 54 · Android) y permite la instalación de origen desconocido |
| iOS | La versión de App Store sigue en **SDK 54**, así que sirve la app normal. Las versiones de Expo Go para SDK ≥ 55 ya no se publican allí |

Consecuencias a tener presentes:

- **Actualizar `expo` en `package.json` obliga a actualizar Expo Go en todos los teléfonos** usados
  para probar; en iOS puede dejar de haber una versión de App Store disponible.
- El SDK del proyecto manda. No se debe subir el SDK solo para “que abra Expo Go”.
- Si en el futuro se adopta un SDK sin Expo Go en tiendas, la salida es un *development build*.

## 4. Pasos

```bash
# 1. Base de datos, API (3000) y Metro (8081)
pnpm db:up
pnpm dev
```

2. En el teléfono, abre Expo Go → **“Enter URL manually”** y pega:

```
exp://<IP-DE-TU-PC>:8081
```

Si arrancas Metro en una terminal interactiva (`cd apps/mobile && pnpm dev`) verás además un QR que
se escanea con la cámara (iOS) o con el propio Expo Go (Android).

3. Comprueba en el teléfono que la API es alcanzable abriendo `http://<IP-DE-TU-PC>:3000/health` en
   el navegador. Si ahí no responde, la app tampoco podrá hablar con la API.

## 5. Qué validar en M1

- [ ] La pantalla de inicio muestra esqueletos y después “API operativa” con uptime y versión.
- [ ] El interruptor de tema cambia entre claro y oscuro de inmediato.
- [ ] Con la API detenida, “Volver a comprobar” muestra el estado de error con reintento.
- [ ] Los textos no se cortan con fuente grande del sistema (Ajustes → Accesibilidad → tamaño de texto).
- [ ] El lector de pantalla anuncia botones y estados (TalkBack / VoiceOver).
- [ ] Al mover el teléfono a otra red, la app falla con error de red, no se queda cargando.

## 6. Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| “Project is incompatible with this version of Expo Go” | Expo Go no es SDK 54 | Instalar la versión correcta (ver §3) |
| “Network request failed” en la app | IP incorrecta, firewall de Windows o Wi-Fi distinta | Probar `/health` desde el navegador del móvil; permitir `node.exe` en redes privadas |
| El QR no conecta con Metro | La red aísla dispositivos | `npx expo start --tunnel` (Metro sí sale, pero la API sigue necesitando una URL alcanzable) |
| Los cambios no se reflejan | Caché del bundler | `npx expo start -c` |
| Puerto 8081 ocupado | Proceso anterior vivo | `pnpm stop:dev` |
| Bundle lento o agotado | Primera compilación en frío | Esperar; siguientes cargas son incrementales |

## 7. Qué no se puede probar con Expo Go

- **Código nativo propio** o librerías que lo requieran: obligan a un *development build*.
- **Icono, splash y nombre de app** definitivos: son configuración nativa.
- **App Links / Universal Links**: imposible sin asociación de dominio en el binario.
- **Notificaciones push en Android**: no funcionan en Expo Go desde SDK 53.
- **Rendimiento realista**: el bundle de desarrollo va sin minificar y con *dev tools* activas; las
  cifras no sirven como referencia de producción.
- **Secretos**: las variables `EXPO_PUBLIC_*` se incrustan en el bundle. Nunca deben contener claves
  privadas.

Nada de esto bloquea M1: la app solo usa módulos incluidos en Expo Go (Router, tema, `fetch`).
Cuando M2 introduzca autenticación con almacenamiento seguro o M3 necesite notificaciones, habrá que
pasar a un *development build* (`eas build --profile development`), que requiere cuenta de Expo y, en
iOS, Apple Developer Program.

## 8. Relación con la estrategia de pruebas

Expo Go es una herramienta de **verificación manual en dispositivo**, no sustituye a la pirámide de
pruebas de [`09-estrategia-pruebas.md`](09-estrategia-pruebas.md). Las pruebas automatizadas siguen
siendo la puerta de CI; este documento solo cubre lo que ninguna prueba en Node puede detectar:
aspecto, gestos, accesibilidad del sistema y conectividad real.
