# 03 — Stack tecnológico definitivo

## 1. Criterios de selección

1. **Multiplataforma real** con una sola base de código y rendimiento nativo suficiente.
2. **Madurez y mantenimiento activo** (versiones estables, comunidad, soporte de la librería).
3. **Tipado extremo a extremo** para reducir errores en cálculos y contratos.
4. **Un solo lenguaje** (TypeScript) en móvil, backend y dominio compartido.
5. **Ejecución local y sin conexión** en el dispositivo.
6. **Seguridad por defecto** (validación, autenticación, almacenamiento seguro).
7. **Coste operativo bajo** y despliegue simple para un producto personal.
8. **Sin dependencias innecesarias**: nada de microservicios, colas o caché distribuida sin necesidad.

## 2. Stack definitivo

### 2.1 Aplicación móvil

| Capa | Tecnología | Versión objetivo | Motivo |
|---|---|---|---|
| Framework | React Native + Expo (Development Builds) | SDK estable al inicializar (referencia: SDK 54 / RN 0.81+) | Un solo código Android/iOS; builds nativos cuando se necesita un módulo fuera de Expo Go |
| Lenguaje | TypeScript (strict) | 5.9 | Tipado seguro en dominio, API y UI |
| Rutas | Expo Router | 6.x+ | Rutas por archivos, deep links, layouts por grupo |
| Estado servidor | TanStack Query | 5.x | Caché, reintentos, invalidación, estados de carga/error |
| Estado global | Zustand | 5.x | Solo estado efímero de UI (filtros, tema, sesión en memoria) |
| Formularios | React Hook Form + Zod | 7.x / 4.x | Formularios rápidos sin re-render, validación compartida con el backend |
| Persistencia local | expo-sqlite | SDK 54 | Espejo de lectura offline y cola de escritura (Fase 5) |
| Almacenamiento seguro | expo-secure-store | SDK 54 | Tokens de refresco y bloqueo local |
| Gráficos | react-native-gifted-charts | 1.x | Interactivos, SVG, ligeros, buen comportamiento en pantallas pequeñas |
| Animaciones | react-native-reanimated | 4.x | Transiciones sutiles a 60 fps |
| i18n | i18next + react-i18next + expo-localization | 25.x / 16.x | Español inicial, arquitectura preparada para más idiomas |
| Notificaciones | expo-notifications | SDK 54 | Alertas locales (Fase 5); push opcional |
| Adjuntos | expo-image-picker + expo-image-manipulator | SDK 54 | Capturas comprimidas y sin EXIF (Fase 4) |
| Cámara de pruebas | Maestro | 2.x | E2E de flujos críticos, menos frágil que Detox con Expo |
| Tests | jest-expo + React Native Testing Library | — | Componentes y hooks |
| Builds | EAS Build (perfil `development`/`preview`/`production`) | — | Compilación iOS/Android sin Mac para Android; iOS requiere cuenta Apple |

### 2.2 Backend

| Capa | Tecnología | Versión objetivo | Motivo |
|---|---|---|---|
| Runtime | Node.js LTS | 24.x | Estable, soporte largo |
| Framework | NestJS | 11.x | Monolito modular, DI, guards, pipes, OpenAPI |
| Lenguaje | TypeScript (strict) | 5.9 | Contratos y dominio compartidos |
| API | REST versionada (`/v1`) | — | Simple, cacheable, fácil de consumir desde móvil |
| Documentación | `@nestjs/swagger` (OpenAPI 3.1) | 11.x | Contrato vivo; genera tipos del cliente |
| Validación | Zod (schemas en `packages/contracts`) | 4.x | Una sola definición de validación para móvil y API |
| Autenticación | JWT de acceso (15 min) + refresh rotativo | — | Sesión corta, revocación por dispositivo |
| Hash de contraseñas | Argon2id (`argon2`) | — | Estándar recomendado para contraseñas |
| Logs | pino + nestjs-pino | — | JSON estructurado, sin datos sensibles |
| Rate limiting | `@nestjs/throttler` | — | Protección de endpoints públicos |
| Cliente IA | HTTP compatible OpenAI (Groq) + JSON Schema estricto | — | Sin SDK pesado; base URL y clave por entorno; salida validada por Zod |

### 2.3 Base de datos y ORM

| Elemento | Decisión | Motivo |
|---|---|---|
| Motor | PostgreSQL 16+ | Exactitud numérica, integridad, ventanas analíticas |
| ORM | Prisma | Migraciones versionadas, tipos generados, buen DX |
| Tipos monetarios | `BIGINT` en unidades menores | Sin punto flotante; suma exacta |
| Tipos de porcentaje | `INTEGER` en puntos básicos | 8000 = 80,00 % |
| Extensiones | `pgcrypto` (uuid) | IDs generados en servidor; el cliente usa UUIDv7 |
| Búsqueda | `pg_trgm` (opcional, Fase 5) | Búsqueda por texto en observaciones |

### 2.4 Infraestructura y servicios

| Necesidad | Decisión | Alternativas evaluadas | Nota |
|---|---|---|---|
| Entorno local | Docker Compose (Postgres + API) | — | Móvil corre en dispositivo/emulador |
| Base de datos gestionada | **Neon** (Postgres serverless) | Supabase, Aiven, Crunchy Bridge, Tiger Cloud | Plan gratuito suficiente para MVP; branching para pruebas |
| Hosting API | **Render** (contenedor Docker) | Fly.io, DigitalOcean App Platform, Railway | Despliegue simple, health checks, auto-deploy desde Git |
| Proveedor de IA | **Groq (nivel gratuito)** | Google Gemini, Cloudflare Workers AI, OpenRouter, Mistral, Cerebras | 0 USD; 1.000 req/día; JSON con esquema estricto; sin retención por defecto (ZDR activable) |
| CI/CD | GitHub Actions | GitLab CI, Bitbucket Pipelines | Lint, tipos, tests, build y migraciones |
| Distribución móvil | EAS Build + TestFlight / Internal Testing | Codemagic, Bitrise | Camino oficial de Expo |
| Monitoreo de errores | Sentry (móvil + API) | Bugsnag | Free tier; scrubbing de PII |
| Almacenamiento de adjuntos | S3-compatible privado (R2 o S3) con URLs firmadas | Supabase Storage, disco local | Solo Fase 4; nunca bucket público |
| Secretos | Variables de entorno del proveedor + `.env` local | Vault (innecesario) | Nunca en el repositorio |

> **Ningún servicio se ha contratado ni se ha creado cuenta.** Antes de aprovisionar Neon, Render,
> Groq o Sentry se pedirá autorización explícita y se confirmará el coste.

#### 2.4.1 Proveedor de IA gratuito — decisión

Requisitos del caso de uso: coste **0 USD**, sin tarjeta, salida **JSON con esquema**, privacidad
aceptable (sin entrenamiento con nuestros datos) y volumen bajo (2–10 informes al día).

| Proveedor | Gratis | Límites publicados | JSON estructurado | Datos en nivel gratuito | Veredicto |
|---|---|---|---|---|---|
| **Groq** | Sí, sin tarjeta | 30 RPM · 1.000 req/día · 8.000 TPM · 200.000 tokens/día (`gpt-oss-120b`) | `response_format: json_schema` con modo `strict: true` | Sin retención por defecto; ZDR activable; EE. UU. con SCC | **Elegido** |
| Google Gemini | Sí, sin tarjeta | Por proyecto; visibles solo en AI Studio | `responseSchema` | **“Used to improve our products: Yes”** en Free (No en Paid) | Descartado sin consentimiento explícito |
| Cloudflare Workers AI | Sí | 10.000 neuronas/día (≈ 300k tokens de entrada) | JSON mode; esquema vía prompt | Sin entrenamiento según su documentación | **Reserva** |
| OpenRouter `:free` | Sí | 20 RPM · 50 req/día (1.000 tras comprar crédito) | Según modelo | Depende del proveedor que sirve el modelo | Descartado |
| Mistral (Free) | Sí, con teléfono | Solo en consola | JSON mode | Entrena salvo opt-out | Descartado |
| Cerebras | Prueba de 30 días con tarjeta | 5 RPM · 1M tokens/día | Sí | — | Descartado (no es gratuito permanente) |

**Configuración decidida**

- Modelo principal: `openai/gpt-oss-120b`; reserva `openai/gpt-oss-20b` (mismos límites, menor
  latencia) por si la cuota de tokens se agota.
- Base URL compatible OpenAI: `https://api.groq.com/openai/v1`.
- Variables: `AI_ENABLED` (`false` por defecto), `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_BASE_URL`.
- Sin clave o con `AI_ENABLED=false`, la app funciona igual y muestra el **resumen determinista**
  calculado en el dominio; nunca se simula un informe de IA.
- Salida: `json_schema` en modo estricto + validación Zod + verificación de cada cifra contra el
  snapshot (si una cifra no coincide, se rechaza y se regenera una vez).
- Límite interno: **20 informes/día** y caché por periodo; muy por debajo de la cuota.
- Consumo estimado: ~1.200 tokens de entrada + ~600 de salida por informe → 10 informes/día
  ≈ 18.000 tokens/día (≈ 9 % de los 200.000 disponibles).
- Privacidad: solo métricas agregadas; sin correo, notas, diario, capturas ni IDs de cuenta. Activar
  **Zero Data Retention** en Data Controls antes de generar el primer informe.
- Coste: **0 USD/mes**. Si Groq cambia el nivel gratuito, se conmuta a Cloudflare Workers AI (mismo
  contrato) o se queda el resumen determinista; nunca se activa facturación sin autorización.

Fuentes consultadas el 2026-11-21: límites y datos de Groq (`console.groq.com/docs/rate-limits`,
`console.groq.com/docs/structured-outputs`, `console.groq.com/docs/your-data`), precios de Gemini
(`ai.google.dev/gemini-api/docs/pricing`) y de Cloudflare (`developers.cloudflare.com/workers-ai/platform/pricing`).
Los límites gratuitos cambian con frecuencia; se revalidan antes de M6.

### 2.5 Herramientas de calidad

| Herramienta | Uso |
|---|---|
| pnpm workspaces + Turborepo | Monorepo, caché de tareas, scripts unificados |
| ESLint 9 (flat config) + Prettier | Estilo consistente |
| TypeScript `strict` + `noUncheckedIndexedAccess` | Seguridad de tipos |
| Vitest | Dominio, contratos y utilidades |
| Jest + Supertest | API (unitarias e integración HTTP) |
| Testcontainers | PostgreSQL real y efímero para pruebas de API |
| fast-check | Pruebas basadas en propiedades para dinero y métricas |
| Maestro | E2E móvil |
| k6 | Pruebas de carga de endpoints analíticos |
| `pnpm audit` + Dependabot | Vulnerabilidades de dependencias |
| gitleaks | Detección de secretos en CI |

## 3. Decisiones justificadas y alternativas descartadas

### D1 — Expo con Development Builds (no Expo Go, no RN CLI puro)

- **A favor:** desarrollo rápido, módulos nativos (SQLite, SecureStore, notificaciones, Skia),
  builds reproducibles con EAS, actualizaciones OTA cuando convenga.
- **En contra:** dependencia de EAS para builds de iOS sin Mac; requiere `prebuild` y disciplina de
  versiones al añadir módulos nativos.
- **Descartado:** React Native CLI puro (más mantenimiento nativo sin ventaja para este producto) y
  Expo Go (no soporta todos los módulos necesarios en producción).

### D2 — Monolito modular NestJS (no microservicios, no BaaS como backend)

- **A favor:** un despliegue, transacciones ACID, un solo lenguaje, límites de módulo claros;
  suficiente para decenas de miles de operaciones y pocos usuarios.
- **En contra:** el escalado horizontal exige stateless (ya se diseña así).
- **Descartado:** microservicios (complejidad prematura), Supabase como backend completo
  (acoplaría autenticación y lógica a un proveedor y dificultaría el dominio compartido),
  Firebase (NoSQL no encaja con integridad financiera y consultas analíticas).

### D3 — Monorepo con dominio compartido

- **A favor:** las fórmulas financieras viven en **un solo lugar** (`packages/domain`) y se usan en
  backend y móvil; imposible que win rate o redondeo difieran entre pantallas.
- **En contra:** configuración inicial algo mayor; requiere disciplina de dependencias.
- **Descartado:** dos implementaciones separadas (duplicación de lógica, viola la regla 6 del plan).

### D4 — Dinero en unidades menores enteras (no `float`, no `number` decimal)

- **A favor:** exactitud absoluta en sumas y comparaciones; fácil de serializar en JSON.
- **En contra:** hay que convertir en la UI y definir redondeo explícito para payouts.
- **Descartado:** `float`/`double` (errores de representación), `decimal.js` en todos lados
  (más lento y propenso a conversiones implícitas). Se permite `Prisma.Decimal` solo en la capa de
  persistencia si alguna consulta lo exige, convertido inmediatamente a enteros.

### D5 — Zod compartido (no `class-validator` en el backend + formularios aparte)

- **A favor:** un esquema valida formulario y API; los tipos se infieren del esquema.
- **En contra:** hay que integrar Zod con los pipes de NestJS (una vez).
- **Descartado:** `class-validator` + DTOs duplicados en el cliente.

### D6 — react-native-gifted-charts (no victory-native XL)

- **A favor:** API simple, SVG, interactividad táctil lista, menor peso y menos dependencias nativas
  que Skia; suficiente para líneas, barras, donut y heatmap simple.
- **En contra:** menos flexible que Skia para visualizaciones muy custom.
- **Descartado por ahora:** victory-native XL (Skia) — se reevalúa si hay problemas de rendimiento
  con series largas. Se encapsula en `components/charts/` para poder sustituir sin tocar pantallas.

### D7 — Prisma (no Drizzle, no SQL a mano)

- **A favor:** migraciones claras, introspección, tipos generados y ecosistema maduro.
- **En contra:** consultas analíticas complejas requieren SQL crudo (`$queryRaw`), lo cual está
  previsto y aislado en repositorios.
- **Descartado:** Drizzle (menos maduro en migraciones automáticas para este equipo), TypeORM
  (mantenimiento irregular).

### D8 — Vitest en dominio + Jest en API (no un único runner)

- **A favor:** Vitest es rápido y excelente para paquetes puros y pruebas basadas en propiedades;
  Jest es el camino soportado por NestJS y jest-expo.
- **En contra:** dos configuraciones.
- **Descartado:** forzar Jest en todo (más lento en el paquete de dominio) o Vitest en NestJS
  (soporte irregular de decoradores).

### D9 — IA detrás de una interfaz propia

- **A favor:** el proveedor (Groq en nivel gratuito) es un detalle de infraestructura; se puede
  cambiar a Cloudflare Workers AI u otro compatible con una variable de entorno, y el dominio no
  depende de ningún SDK.
- **En contra:** hay que mantener adaptadores y pruebas de contrato.
- **Descartado:** llamar al SDK del proveedor desde servicios de negocio; enviar cualquier dato
  personal al modelo.

## 4. Lo que NO se usará (y por qué)

| Tecnología | Motivo de exclusión |
|---|---|
| Redis / BullMQ | No hay procesamiento asíncrono que lo justifique en el MVP; los resúmenes caben en un cron simple |
| Microservicios / Kubernetes | Complejidad operativa desproporcionada |
| GraphQL | REST cubre el caso; menos superficie de ataque y más simple de cachear |
| Firebase / Firestore | Modelo documental inadecuado para integridad financiera |
| Supabase Auth | Se quiere control total de sesiones, rotación y auditoría |
| BinomoAPI y similares | Ingeniería inversa de endpoints privados; prohibido (ver `02`) |
| Web scraping / Puppeteer | Prohibido e inestable |
| Motor de recomendación propio | El feedback es descriptivo, no prescriptivo |
| Animaciones pesadas / 3D | No aportan y degradan rendimiento |

## 5. Versiones y actualización

- Las versiones indicadas son **objetivo**, no una promesa de pin exacto; se fijan en el `lockfile`
  al inicializar el proyecto (Fase 2).
- Actualizaciones de dependencias: Dependabot semanal, revisión manual de mayores y prueba completa
  antes de fusionar.
- Se prohíbe actualizar React Native/Expo en medio de una fase sin ventana de regresión dedicada.
- Cada actualización relevante se registra en `CHANGELOG.md` (se crea en Fase 2).
