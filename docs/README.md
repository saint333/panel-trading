# Binomo Analytics — Documentación del proyecto

> **Estado:** Fase 1 (análisis y planificación) **aprobada** el 2026-11-21 y **M1 — Fundaciones completado** el 2026-11-22.
> El código vive en la raíz del repositorio; la puesta en marcha y la estructura real están en el
> [`README.md`](../README.md) raíz. Esta carpeta sigue siendo la fuente de verdad de producto,
> arquitectura y decisiones.

Este directorio contiene la documentación de referencia del producto. Es la fuente de verdad para
decisiones de arquitectura, alcance y calidad. Toda desviación posterior debe reflejarse aquí
(documentación como código, versionada junto al repositorio).

## Índice

| # | Documento | Contenido |
|---|---|---|
| 01 | [Resumen de producto y análisis funcional](01-resumen-producto.md) | Resumen ejecutivo, propuesta de valor, actores, flujos, reglas de negocio, glosario |
| 02 | [Viabilidad de integración con Binomo](02-viabilidad-binomo.md) | Investigación, hallazgos, matriz de mecanismos, decisión y diseño desacoplado |
| 03 | [Stack tecnológico](03-stack-tecnologico.md) | Stack definitivo, justificación, alternativas descartadas, servicios externos |
| 04 | [Arquitectura](04-arquitectura.md) | Contexto, contenedores, capas, módulos, contratos API, offline, estructura de carpetas |
| 05 | [Modelo de datos](05-modelo-datos.md) | Diagrama entidad-relación, tablas, invariantes, índices, deduplicación, saldo |
| 06 | [Historias de usuario](06-historias-usuario.md) | Historias con prioridad MoSCoW y criterios de aceptación |
| 07 | [Requisitos](07-requisitos.md) | Requisitos funcionales y no funcionales medibles |
| 08 | [Riesgos técnicos](08-riesgos.md) | Registro de riesgos con probabilidad, impacto, mitigación y disparadores |
| 09 | [Estrategia de pruebas](09-estrategia-pruebas.md) | Pirámide de pruebas, herramientas, matriz de cálculos financieros, puertas de CI |
| 10 | [Alcance del MVP](10-alcance-mvp.md) | Qué entra, qué no entra y por qué; criterio de salida del MVP |
| 11 | [Roadmap de implementación](11-roadmap.md) | Hitos, fases, dependencias, estimaciones y criterios de salida |
| 12 | [Criterios de aceptación](12-criterios-de-aceptacion.md) | Definition of Done, aceptación por módulo y checklist de release |
| 13 | [Pruebas en dispositivo](13-pruebas-en-dispositivo.md) | Expo Go, límite de un SDK por versión, problemas frecuentes y qué no se puede probar |
| 14 | [APK de Android](14-apk-android.md) | Compilar con EAS, descargar e instalar el APK, URL de la API incrustada y problemas frecuentes |

## Cómo leer esta documentación

- **Si se dispone de 10 minutos:** lee `01`, el apartado “Decisión” de `02` y `11`.
- **Antes de escribir código:** `03`, `04`, `05` y `12`.
- **Si algo no cuadra entre documentos:** prevalece `02` (viabilidad) > `03` (stack) > `04` (arquitectura)
  > `05` (datos) > resto. Abre una incidencia de documentación para corregir la inconsistencia.

## Convenciones de identificadores

| Prefijo | Significado | Ejemplo |
|---|---|---|
| `RF-xxx` | Requisito funcional | `RF-040 Importación CSV` |
| `RNF-xxx` | Requisito no funcional | `RNF-010 Seguridad` |
| `US-xx` | Historia de usuario | `US-12 Registrar operación manual` |
| `BR-xx` | Regla de negocio | `BR-03 El saldo calculado no es saldo real` |
| `R-xx` | Riesgo | `R-01 Binomo sin API oficial` |
| `AC-xx` | Criterio de aceptación de módulo | `AC-05 Dashboard` |

Cada requisito e historia debe poder rastrearse hasta un módulo (ver `04`) y un criterio de
aceptación (ver `12`). Ninguna funcionalidad se considera terminada sin pruebas y sin estar
documentada.

## Equipo de trabajo simulado

El proyecto se aborda como un equipo senior multidisciplinar. Cada rol tiene responsabilidades
explícitas para que las decisiones no queden implícitas:

| Rol | Responsabilidad principal | Artefactos que firma |
|---|---|---|
| Arquitecto de software | Coherencia de arquitectura, límites de módulos, ADRs | `03`, `04` |
| Ingeniero backend | API, dominio, persistencia, integraciones, seguridad de servicios | `04`, `05`, `07` |
| Ingeniero mobile | UX técnica, offline, rendimiento, build Android/iOS | `04`, `10` |
| Diseñador UX/UI | Sistema de diseño, accesibilidad, estados, flujos | `01`, `12` |
| Especialista en datos | Modelo, integridad, índices, migraciones | `05` |
| Ingeniero QA | Estrategia de pruebas, automatización, criterios de salida | `09`, `12` |
| Especialista en seguridad | Modelo de amenazas, autenticación, privacidad | `07`, `08`, `12` |

## Reglas de trabajo vigentes

1. Se trabaja por fases; cada fase termina con resultados funcionales y documentación actualizada.
2. No se inventan capacidades de Binomo ni se asume la existencia de APIs.
3. No se implementan funcionalidades simuladas que parezcan terminadas.
4. Los cálculos financieros se prueban con escenarios explícitos y tipos sin punto flotante.
5. Se pide autorización antes de acciones irreversibles, contratación de servicios, gastos o uso de
   credenciales reales.
6. Se evita introducir tecnología sin una necesidad demostrada (YAGNI).

## Próximo paso

Revisión del plan por parte del usuario. Tras la aprobación, se inicia la **Fase 2 (M1 —
Fundaciones)** según `11-roadmap.md`.
