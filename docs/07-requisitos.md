# 07 — Requisitos funcionales y no funcionales

## 1. Requisitos funcionales (RF)

### Autenticación y cuenta

| ID | Requisito | Prioridad | Módulo | Hito |
|---|---|---|---|---|
| RF-001 | Registro con correo y contraseña, con validación de fortaleza y correo único. | M | auth | M2 |
| RF-002 | Login con access token de 15 min y refresh rotativo de 30 días. | M | auth | M2 |
| RF-003 | Detección de reutilización de refresh token y revocación de la cadena. | M | auth | M2 |
| RF-004 | Listado y revocación de sesiones por dispositivo. | S | auth | M2 |
| RF-005 | Bloqueo local con PIN/biometría. | C | auth | M7 |
| RF-006 | Cambio de contraseña invalidando todas las sesiones. | S | auth | M2 |

### Cuentas de trading

| ID | Requisito | Prioridad | Módulo | Hito |
|---|---|---|---|---|
| RF-010 | Crear, editar y archivar cuentas con tipo real/demo, divisa y saldo inicial. | M | trading-accounts | M2 |
| RF-011 | Registrar saldo confirmado con fecha y compararlo con el calculado. | M | trading-accounts / balance | M4 |
| RF-012 | Excluir cuentas demo de los indicadores globales por defecto. | M | analytics | M5 |
| RF-013 | Soportar múltiples cuentas por usuario y plataforma (`BINOMO`, `MANUAL`, `OTHER`). | M | trading-accounts | M2 |

### Operaciones

| ID | Requisito | Prioridad | Módulo | Hito |
|---|---|---|---|---|
| RF-020 | Alta manual con todos los campos del plan (incluye observaciones y estrategia). | M | trades | M3 |
| RF-021 | Cálculo de resultado neto en el dominio, sin punto flotante. | M | domain | M1 |
| RF-022 | Edición con control de versión y auditoría. | M | trades | M3 |
| RF-023 | Borrado lógico con deshacer y exclusión de métricas. | M | trades | M3 |
| RF-024 | Detalle con contexto (anterior/siguiente operación, diario, origen). | M | trades | M3 |
| RF-025 | Duplicar operación precargando datos sin resultado. | S | trades | M3 |
| RF-026 | Búsqueda y filtros combinables con paginación por cursor. | M | trades | M3 |
| RF-027 | Deduplicación por `externalId` o huella determinista. | M | trades | M3 |
| RF-028 | Idempotencia en creación (`Idempotency-Key`). | M | trades | M3 |
| RF-029 | Soporte de operaciones abiertas (`OPEN`) sin afectar métricas hasta liquidarse. | C | trades | M6 |

### Importación

| ID | Requisito | Prioridad | Módulo | Hito |
|---|---|---|---|---|
| RF-030 | Importar CSV (UTF-8, `,`/`;`) y XLSX hasta 10 000 filas / 5 MB. | M | imports | M4 |
| RF-031 | Mapeo de columnas asistido y guardado por perfil de origen. | M | imports | M4 |
| RF-032 | Vista previa con válidas, duplicadas y erróneas antes de escribir. | M | imports | M4 |
| RF-033 | Importación transaccional con informe y errores descargables. | M | imports | M4 |
| RF-034 | Historial de importaciones con conteos y estado. | S | imports | M4 |
| RF-035 | Detección de formatos de fecha/número (`dd/mm/yyyy`, coma decimal, etc.). | M | imports | M4 |
| RF-036 | Advertencia si el archivo completo ya fue importado (checksum). | S | imports | M4 |

### Finanzas

| ID | Requisito | Prioridad | Módulo | Hito |
|---|---|---|---|---|
| RF-040 | Registrar depósitos, retiros, comisiones, bonos, ajustes y correcciones. | M | transactions | M4 |
| RF-041 | Saldo calculado según la fórmula canónica de `05`. | M | balance | M4 |
| RF-042 | Nunca contabilizar el PnL de una operación como movimiento adicional. | M | balance | M4 |
| RF-043 | Mostrar diferencia confirmado vs calculado y no corregir automáticamente. | M | balance | M4 |
| RF-044 | Desglose del saldo enlazado a los movimientos que lo componen. | M | balance | M4 |
| RF-045 | Historial de conciliaciones (`BalanceSnapshot`). | S | balance | M4 |

### Dashboard y analítica

| ID | Requisito | Prioridad | Módulo | Hito |
|---|---|---|---|---|
| RF-050 | Mostrar los 13 indicadores principales del plan con su periodo. | M | analytics | M5 |
| RF-051 | Filtros por fecha, cuenta y activo aplicados a todo el dashboard. | M | analytics | M5 |
| RF-052 | Gráfico de evolución del capital interactivo. | M | analytics | M5 |
| RF-053 | Ganancias/pérdidas por día, semana y mes. | M | analytics | M5 |
| RF-054 | Comparación ganadas vs perdidas y distribución de resultados. | M | analytics | M5 |
| RF-055 | Rendimiento por activo, hora y estrategia. | S | analytics | M5/M6 |
| RF-056 | Métricas avanzadas: profit factor, expectativa, rachas, drawdown, ROI. | S | analytics | M6 |
| RF-057 | Distribución del capital arriesgado por tramos. | C | analytics | M6 |
| RF-058 | Nivel de muestra visible en toda métrica agregada. | M | analytics | M5 |
| RF-059 | Explicación de fórmula y exclusiones por métrica. | M | analytics | M5 |
| RF-060 | Curva de capital calculada desde saldo inicial + movimientos + PnL. | M | balance / analytics | M5 |

### Diario

| ID | Requisito | Prioridad | Módulo | Hito |
|---|---|---|---|---|
| RF-070 | Diario por operación con estrategia, motivo, emoción, plan, errores y aprendizaje. | M | journal | M3 |
| RF-071 | Borrador local con autoguardado. | S | journal | M3 |
| RF-072 | Filtros del diario por error, estrategia y disciplina. | C | journal | M6 |
| RF-073 | Adjuntar capturas comprimidas sin EXIF en almacenamiento privado. | C | journal | M6 |

### Feedback

| ID | Requisito | Prioridad | Módulo | Hito |
|---|---|---|---|---|
| RF-080 | Generar informes diario, semanal, mensual y personalizado. | S | feedback | M6 |
| RF-081 | Basar cada afirmación en métricas calculadas y citar el dato. | S | feedback | M6 |
| RF-082 | Validar esquema y cifras contra el snapshot; rechazar y regenerar si no coincide. | S | feedback | M6 |
| RF-083 | No enviar notas, capturas, correo ni datos identificativos al proveedor de IA. | M | feedback | M6 |
| RF-084 | Prohibir lenguaje predictivo, garantías y señales mediante filtro de frases. | M | feedback | M6 |
| RF-085 | Guardar modelo y versión de prompt de cada informe. | S | feedback | M6 |
| RF-086 | Limitar coste y frecuencia (máx. N generaciones/día) con caché por periodo. | S | feedback | M6 |

### Alertas, reportes y ajustes

| ID | Requisito | Prioridad | Módulo | Hito |
|---|---|---|---|---|
| RF-090 | Alertas configurables de pérdida diaria, racha, importe máximo e incremento tras pérdida. | C | notifications | M7 |
| RF-091 | Resúmenes diarios/semanales con hora local y silencio configurable. | C | notifications | M7 |
| RF-092 | Exportar operaciones y datos completos a CSV/ZIP. | M | reports | M4/M7 |
| RF-093 | Tema claro/oscuro/sistema persistente. | M | settings | M2 |
| RF-094 | Textos externalizados para i18n con español como idioma base. | M | settings | M2 |
| RF-095 | Exportación y eliminación de cuenta con periodo de gracia. | S | users | M7 |
| RF-096 | Mostrar advertencia permanente de que la app no es asesoramiento financiero. | M | settings / onboarding | M2 |

## 2. Requisitos no funcionales (RNF)

| ID | Categoría | Requisito | Métrica de aceptación | Verificación |
|---|---|---|---|---|
| RNF-001 | Rendimiento | Arranque en frío del móvil | ≤ 2,0 s en gama media (500 operaciones cacheadas) | Medición en dispositivo + Sentry |
| RNF-002 | Rendimiento | Dashboard con 10 000 operaciones | p95 ≤ 400 ms en API; render ≤ 1,5 s | k6 + perfilado |
| RNF-003 | Rendimiento | Listado | Primera página ≤ 300 ms p95; scroll a 60 fps | k6 + medición |
| RNF-004 | Rendimiento | Alta de operación percibida | ≤ 45 s de interacción; respuesta API p95 ≤ 250 ms | Prueba de usabilidad + k6 |
| RNF-005 | Disponibilidad | API en producción | 99,5 % mensual (MVP) | Monitor externo |
| RNF-006 | Escalabilidad | Operaciones por usuario | 100 000 sin degradación > 2× (con índices) | Prueba de carga |
| RNF-007 | Seguridad | Contraseñas | Argon2id con parámetros OWASP 2026; nunca en logs | Revisión + tests |
| RNF-008 | Seguridad | Transporte | HTTPS/TLS 1.2+ obligatorio; HSTS en producción | Config + escaneo |
| RNF-009 | Seguridad | Autorización | 100 % de endpoints con `userId` del token; cero IDOR en pruebas | Tests de integración |
| RNF-010 | Seguridad | Rate limiting | 100 rpm lectura / 20 rpm escritura / 10 rpm auth por IP+usuario | Tests + configuración |
| RNF-011 | Seguridad | Secretos | Ningún secreto en repositorio; gitleaks en CI | CI |
| RNF-012 | Seguridad | Sesiones | Refresh rotativo con detección de reutilización | Tests |
| RNF-013 | Privacidad | IA | Payload sin PII verificable por test de contrato | Test automatizado |
| RNF-014 | Privacidad | Datos del usuario | Exportación completa ≤ 5 min; borrado efectivo ≤ 7 días | Prueba manual + test |
| RNF-015 | Precisión | Dinero | Cero operaciones con coma flotante; 100 % de escenarios de redondeo probados | Pruebas de dominio + revisión |
| RNF-016 | Precisión | Consistencia | API y móvil producen el mismo resultado para el mismo conjunto | Pruebas de contrato compartidas |
| RNF-017 | Fiabilidad | Importación | Idempotente: repetir 3 veces el mismo archivo produce el mismo estado | Test de integración |
| RNF-018 | Usabilidad | Accesibilidad | Contraste AA, táctil ≥ 44 px, no depender solo del color | Auditoría + revisión |
| RNF-019 | Usabilidad | Estados | Toda pantalla con datos tiene carga, vacío, error y offline | Revisión de diseño |
| RNF-020 | Compatibilidad | Android | API 26+ (Android 8) | Matriz de dispositivos |
| RNF-021 | Compatibilidad | iOS | iOS 15.1+ | Matriz de dispositivos |
| RNF-022 | Compatibilidad | Tamaños | 320 pt de ancho a tablet; orientación vertical prioritaria | Pruebas visuales |
| RNF-023 | Mantenibilidad | Cobertura | ≥ 90 % en `packages/domain`; ≥ 70 % en servicios críticos | Cobertura en CI |
| RNF-024 | Mantenibilidad | Tipos | `strict` sin `any` implícito; build sin errores | CI |
| RNF-025 | Mantenibilidad | Complejidad | Sin funciones de dominio > 40 líneas ni ciclos de dependencia | Lint + madge |
| RNF-026 | Observabilidad | Trazabilidad | `requestId` en toda respuesta y log; errores en Sentry | Revisión + test |
| RNF-027 | Localización | Fechas/números | Formato según locale del usuario sin hardcodear | Tests de i18n |
| RNF-028 | Localización | Zona horaria | Agrupaciones correctas en DST (23/25 h) | Tests de zona horaria |
| RNF-029 | Legal | Aviso | Disclaimer visible en onboarding y ajustes; sin promesas de rentabilidad | Revisión de textos |
| RNF-030 | Legal | Términos del bróker | Sin credenciales ni endpoints privados de Binomo | Revisión de código + checklist |
| RNF-031 | Operación | Recuperación | Backup diario gestionado; RPO ≤ 24 h, RTO ≤ 4 h | Config del proveedor |
| RNF-032 | Operación | Migraciones | Despliegue con migración previa y rollback documentado | Ensayo en staging |
| RNF-033 | Coste | Infraestructura MVP | ≤ 25 USD/mes (sin contar tiendas; IA en nivel gratuito) | Revisión mensual |
| RNF-034 | Coste | IA | 0 USD/mes: solo nivel gratuito de Groq con caché y límites; al agotar cuota se degrada a resumen determinista | Test de cuota + revisión mensual |
| RNF-035 | Calidad | CI | Pipeline completo ≤ 10 min; bloquea merge si falla | Medición de CI |

## 3. Matriz de trazabilidad (resumen)

| Módulo | RF | US | AC |
|---|---|---|---|
| Autenticación | RF-001…006 | US-01…04 | AC-01 |
| Cuentas | RF-010…013 | US-05…07 | AC-02 |
| Operaciones | RF-020…029 | US-08…12 | AC-03 |
| Historial | RF-026 | US-13, US-14 | AC-04 |
| Importación | RF-030…036 | US-15…17 | AC-05 |
| Finanzas | RF-040…045 | US-18…20 | AC-06 |
| Dashboard | RF-050…054, RF-058…060 | US-21…23, US-38 | AC-07 |
| Analítica | RF-055…059 | US-24…27 | AC-08 |
| Diario | RF-070…073 | US-28…30 | AC-09 |
| Feedback | RF-080…086 | US-31…33 | AC-10 |
| Alertas | RF-090, RF-091 | US-34, US-35 | AC-11 |
| Ajustes/privacidad | RF-092…096 | US-36…38 | AC-12 |

Los criterios de aceptación por módulo están en `12-criterios-de-aceptacion.md`.
