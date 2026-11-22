# 08 — Registro de riesgos técnicos

Escala: probabilidad (P) e impacto (I) de 1 a 5. Exposición = P × I.
Estados: `abierto`, `mitigado`, `aceptado`, `cerrado`. Revisión al cierre de cada hito.

| ID | Riesgo | P | I | Exp. | Mitigación | Disparador / señal | Estado |
|---|---|---|---|---|---|---|---|
| R-01 | **Binomo no tiene API oficial ni exportación documentada**: la sincronización automática no es viable | 5 | 5 | 25 | Registro manual + importación de archivo desde el día 1; arquitectura de adaptadores; comunicación explícita en la UI; no prometer sincronización | Usuario espera datos automáticos o pregunta por “conectar cuenta” | Mitigado por diseño |
| R-02 | **Uso de endpoints privados o cookies viola el Acuerdo 12.12** y puede costar la cuenta | 3 | 5 | 15 | Prohibición explícita en arquitectura y revisión de código; adaptador Binomo inactivo; checklist de seguridad en cada release | Aparición de una tarea que requiera `authtoken`, WebSocket o scraping | Mitigado por diseño |
| R-03 | **Rechazo en App Store / Google Play** por tratarse de una app financiera de opciones binarias | 3 | 4 | 12 | Presentarla como herramienta de registro y análisis (no broker, no trading); sin marca Binomo en icono/nombre; disclaimer; metadatos que no prometan rentabilidad; lanzar primero TestFlight/Internal Testing | Revisión previa con directrices 3.2.1/5.x y feedback del revisor | Abierto |
| R-04 | **Riesgo regulatorio**: opciones binarias prohibidas o restringidas para retail en varias jurisdicciones | 2 | 4 | 8 | Producto personal, sin promoción, sin captación, sin señales; aviso legal; no monetizar; no publicar en países restringidos; consulta legal antes de distribución pública | Intención de publicar en tiendas o abrir a terceros | Abierto |
| R-05 | **Fricción del registro manual** → datos incompletos y métricas inútiles | 4 | 4 | 16 | Formulario rápido, precarga, duplicar, importación, recordatorios, indicador de cobertura | Tasa de operaciones registradas < 80 % de días activos | Abierto |
| R-06 | **Errores de precisión monetaria** (redondeo, flotantes) | 2 | 5 | 10 | Enteros en unidades menores, una sola implementación en dominio, pruebas de propiedades y escenarios de redondeo | Cualquier `number` usado para dinero en revisión | Mitigado por diseño |
| R-07 | **Errores de zona horaria/DST** en agrupaciones diarias/mensuales | 3 | 3 | 9 | UTC en BD, IANA del usuario, pruebas con fechas DST y zonas de 30/45 min | Métricas que no cuadran al cambiar de mes | Abierto |
| R-08 | **Conflicto de sincronización/offline** con ediciones simultáneas | 2 | 3 | 6 | Offline de lectura en MVP; escritura offline en Fase 5 con outbox, versiones y resolución explícita | Reportes de “se perdió mi cambio” | Aceptado (fase 5) |
| R-09 | **Alucinación de la IA** (cifras o afirmaciones no respaldadas) | 3 | 4 | 12 | Métricas deterministas + snapshot inmutable + validación de cada cifra citada + filtro de frases + muestra mínima | Cifra del texto distinta al snapshot | Mitigado por diseño |
| R-10 | **Cuota o latencia de IA** fuera de control | 3 | 2 | 6 | Groq gratuito (1.000 req/día), límite interno de 20 informes/día, caché por periodo, prompt corto y degradación a resumen determinista | 429 reiterado, > 80 % de cuota diaria o generación > 20 s | Mitigado por diseño |
| R-11 | **Dependencia de EAS/Expo** para compilar iOS | 3 | 3 | 9 | Configurar `eas.json` y build de dispositivo en M1; documentar build local alternativo; pin de SDK | Primer build de iOS fallido o bloqueado por cuenta | Abierto |
| R-12 | **Fuga de datos financieros** en logs, Sentry, notificaciones o capturas | 2 | 5 | 10 | Scrubbing de PII, no loguear importes/notas, notificaciones sin cifras por defecto, adjuntos privados con URL firmada y EXIF eliminado | Cualquier importe en un log | Abierto |
| R-13 | **Rendimiento analítico** con historiales grandes | 3 | 3 | 9 | Índices dedicados, agregación en SQL, downsampling de gráficos, tabla de agregados diarios si hace falta | p95 > 400 ms con 10 k operaciones | Abierto |
| R-14 | **Sobrecarga de alcance** (el plan es muy amplio) | 4 | 4 | 16 | MVP cerrado y congelado en `10`; fases con criterios de salida; cualquier extra entra al backlog, no a la fase | Nuevas funciones a mitad de hito | Mitigado por proceso |
| R-15 | **Documentación desactualizada** respecto al código | 3 | 2 | 6 | Docs en el mismo repo, ADR por decisión, checklist de PR que exige actualizar docs | PR que cambia contrato sin tocar `docs/` | Abierto |
| R-16 | **Pérdida de datos** por fallo del proveedor o migración | 2 | 5 | 10 | Backups gestionados, export mensual, migraciones ensayadas en staging, rollback documentado | Fallo de restore en ensayo | Abierto |
| R-17 | **Robo de refresh token** en dispositivo comprometido | 2 | 4 | 8 | SecureStore, rotación con detección de reutilización, revocación por dispositivo, bloqueo local (Fase 5) | Refresh reutilizado detectado | Abierto |
| R-18 | **Dependencias abandonadas** (gráficos, SQLite, IA) | 3 | 3 | 9 | Encapsular librerías tras interfaces propias; revisar mantenimiento antes de adoptar; Dependabot | Sin releases en 12 meses / issues críticos sin respuesta | Abierto |
| R-19 | **Complejidad del importador** (formatos heterogéneos) | 4 | 3 | 12 | Mapeo manual + vista previa + perfiles guardados + límites de tamaño; errores por fila; nunca adivinar en silencio | > 10 % de filas rechazadas en pruebas reales | Abierto |
| R-20 | **Falta de verificación de correo** y cuentas duplicadas | 2 | 2 | 4 | Verificación opcional en MVP, obligatoria antes de compartir datos; límite de registros por IP | Registros masivos o quejas | Aceptado |
| R-21 | **Cambio o desaparición del nivel gratuito de Groq** (límites, modelo o condiciones) | 3 | 2 | 6 | Abstracción de proveedor, segundo adaptador para Cloudflare Workers AI y resumen determinista como salida mínima | Cambio de precios/límites o modelo deprecado | Abierto |
| R-22 | **Uso de datos por el proveedor de IA** en el nivel gratuito | 2 | 4 | 8 | Solo métricas agregadas, ZDR activado en Groq, sin PII en el payload, y prohibición de proveedores que entrenan con datos gratuitos sin consentimiento | Cambio en la política de datos o auditoría del payload | Mitigado por diseño |

## Riesgos que bloquean el proyecto (decisión del usuario)

1. **R-03/R-04 (distribución pública):** si el objetivo es publicar en tiendas, se necesita revisar
   las políticas vigentes de Apple y Google y la legalidad local antes de invertir en el build de
   producción. El MVP se puede desarrollar y usar sin resolverlo (build interno).
2. **R-01 (automatización):** si el requisito real es “que se actualice solo”, **no se puede cumplir**
   con las reglas actuales de Binomo. Es la decisión de producto más importante a confirmar antes de
   la Fase 2.

## Supuestos

- Un solo usuario principal durante el MVP (aunque el modelo es multi-usuario).
- Los datos se registran en la divisa de la cuenta; no hay conversión entre divisas en el MVP.
- La zona horaria del usuario no cambia con frecuencia.
- El usuario acepta registrar manualmente o importar archivos (no hay sincronización).
- El presupuesto de infraestructura es ≤ 25 USD/mes y la IA se mantiene en el nivel gratuito (0 USD).
