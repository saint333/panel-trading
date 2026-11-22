# 10 — Alcance del MVP

## 1. Definición de MVP

> El MVP es una app instalable en Android e iOS que permite **registrar operaciones manualmente e
> importarlas desde un archivo**, **controlar el saldo** (calculado vs confirmado) y **ver un
> dashboard con métricas correctas y explicadas**. Nada más.

El MVP debe ser **usable a diario durante un mes** sin funciones simuladas ni datos ficticios.
Todo lo demás (IA, alertas, adjuntos, escritura offline) llega en fases posteriores y no bloquea
su entrega.

## 2. Dentro del MVP

### M1 — Fundaciones
- Monorepo, CI, entornos, Docker Compose, migraciones, `/health`.
- Sistema de diseño base (tokens, tema claro/oscuro, 15 componentes).
- Navegación con Expo Router y gate de sesión.
- `packages/domain` con Money, PnL y pruebas de propiedades.

### M2 — Identidad y cuentas
- Registro, login, refresh rotativo, revocación de sesión, cambio de contraseña.
- Perfil, zona horaria, divisa base, locale `es`.
- Cuentas real/demo con saldo inicial.
- Disclaimer financiero en onboarding y ajustes.

### M3 — Operaciones e historial
- Alta manual rápida (≤ 45 s), duplicar, editar, borrar con deshacer.
- Detalle con contexto.
- Historial con filtros combinables y paginación por cursor.
- Diario en texto por operación (sin adjuntos).
- Deduplicación e idempotencia.

### M4 — Importación y finanzas
- Importación CSV/XLSX con mapeo, vista previa, deduplicación e informe.
- Depósitos, retiros, comisiones, bonos, ajustes y correcciones.
- Saldo calculado, saldo confirmado, conciliación y desglose.
- Exportación CSV de operaciones filtradas.

### M5 — Dashboard y analítica núcleo
- 13 indicadores con periodo y nivel de muestra.
- Filtros globales (fecha, cuenta, activo).
- Gráficos: evolución del capital, ganancias/pérdidas por periodo, distribución de resultados,
  rendimiento por activo.
- Explicación de fórmula por métrica.
- Estados de carga, vacío, error y sin conexión (lectura cacheada).

## 3. Fuera del MVP (y por qué)

| Funcionalidad | Fase | Motivo de exclusión |
|---|---|---|
| Feedback con IA | M6 | Depende de métricas estables y de la cuenta gratuita de Groq; riesgo de alucinación a controlar |
| Métricas avanzadas (profit factor, expectativa, rachas, drawdown) | M6 | Pueden esperar; el núcleo ya aporta valor |
| Rendimiento por hora y estrategia | M6 | Requiere más datos y diseño de visualización |
| Adjuntos/capturas | M6 | Almacenamiento, privacidad y coste; no bloquea el uso |
| Notificaciones y alertas | M7 | Requiere reglas estables y permisos del sistema |
| Escritura offline (outbox) | M7 | Complejidad de conflictos; el MVP ya funciona con red |
| Bloqueo con PIN/biometría | M7 | Mejora de seguridad, no requisito inicial |
| Reportes PDF | M7 | CSV resuelve el respaldo |
| Segundo idioma | M7 | La arquitectura queda preparada; solo hay español |
| Sincronización con Binomo | **Sin fase** | No es viable ni legítima hoy (`02`) |
| Multiusuario compartido / equipos | — | El modelo lo soporta, pero el producto es personal |
| Conversión de divisas | — | Requiere tipos de cambio y reglas contables |
| Fiscalidad | — | Fuera de alcance; la app no es asesor fiscal |

## 4. Criterio de salida del MVP

El MVP está terminado cuando **todas** se cumplen:

1. Un usuario nuevo puede registrarse, crear una cuenta real y registrar 50 operaciones mezclando
   manual e importación sin ayuda externa.
2. El saldo calculado coincide con el ejemplo de `05` y cualquier divergencia se muestra con aviso.
3. Repetir la importación tres veces no crea duplicados ni deja datos parciales.
4. Todos los indicadores del dashboard muestran periodo, `n` y nivel de muestra.
5. Las cifras del móvil coinciden con las de la API para el mismo conjunto de datos (prueba de
   contrato compartida).
6. Build instalable en un Android físico y en un iPhone (TestFlight o build local).
7. Cobertura de dominio ≥ 90 %; pipeline de CI verde; sin defectos críticos abiertos.
8. Revisión de seguridad del checklist de `12` completada.
9. Documentación actualizada (modelo, contratos, decisiones) y `CHANGELOG` del release.

## 5. Métricas para decidir la Fase 4

Antes de construir IA y analítica avanzada:

- El usuario ha registrado ≥ 100 operaciones reales.
- El registro se usa ≥ 4 días por semana.
- Hay al menos 30 operaciones liquidadas por cuenta real.
- No hay incidencias abiertas de cálculo o conciliación.

Si no se cumplen, la prioridad es mejorar la captura de datos, no añadir funciones.

## 6. Supuestos del MVP

- Un usuario principal; sin invitaciones ni roles.
- Sin verificación de correo obligatoria (se añade antes de abrir a terceros).
- Una divisa por cuenta; los agregados no mezclan divisas (se muestra por cuenta).
- Conectividad habitual; el modo offline es de lectura.
- Sin integraciones externas de pago; la IA (Groq gratuito) llega en M6, fuera del MVP.
- Distribución interna/prueba, no publicación pública (ver R-03/R-04).
