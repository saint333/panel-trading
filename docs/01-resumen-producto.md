# 01 — Resumen de producto y análisis funcional

## 1. Resumen ejecutivo

**Binomo Analytics** es una aplicación móvil multiplataforma (Android e iOS) para el seguimiento,
control financiero y análisis del rendimiento de un operador de opciones binarias.
No ejecuta operaciones: registra, importa, ordena, calcula y explica.

El producto sustituye la libreta de operaciones y las hojas de cálculo por:

1. Un **registro fiable** de operaciones (manual y por importación de archivos).
2. Un **control financiero** que distingue saldo confirmado de saldo calculado.
3. Un **dashboard** con indicadores y gráficos filtrables.
4. Una **analítica** con fórmulas definidas y muestras mínimas.
5. Un **diario** de decisiones y errores.
6. Un **feedback** generado a partir de métricas deterministas, con evidencias y sin predicciones.

La propuesta no es “ganar más dinero”. Es **medir con rigor para dejar de repetir errores**.
La aplicación nunca promete rentabilidad, no emite señales y no sugiere operar.

## 2. Problema y oportunidad

| Problema actual | Consecuencia | Cómo lo resuelve el producto |
|---|---|---|
| Resultados dispersos en el historial de la plataforma y capturas de pantalla | No hay visión acumulada ni comparación entre periodos | Registro único, importable y exportable |
| Memory sesgada (se recuerdan las ganancias, no las pérdidas) | Decisiones basadas en percepción | Métricas con denominadores explícitos y muestra indicada |
| No se separa dinero real de dinero demo | Métricas y decisiones contaminadas | Cuenta con `accountType` obligatorio y filtros por defecto en real |
| El saldo “calculado” se confunde con el saldo del bróker | Riesgo de operar con una cifra falsa | Doble saldo: **confirmado** vs **calculado**, con divergencia visible |
| Se sube el importe tras una pérdida (persecución de pérdidas) | Mayor pérdida esperada | Detección determinista y alertas informativas |
| No hay registro del motivo de la operación | No se puede aprender del proceso | Diario ligado a cada operación |

**Oportunidad:** el usuario objetivo ya opera manualmente y necesita control, no otra plataforma de
trading. El producto es de bajo riesgo regulatorio frente a un bot, siempre que se mantenga en el
terreno de **registro y análisis** y no se presente como asesoramiento financiero.

## 3. Usuario objetivo y contextos de uso

- **Usuario primario:** operador individual de opciones binarias, con cuenta demo y real, que opera
  desde el móvil en sesiones cortas (5–30 minutos) varias veces al día.
- **Contextos:**
  - *Registro inmediato* tras cerrar una operación (30–60 s, una mano, posiblemente sin conexión).
  - *Revisión diaria* por la noche (resumen, errores, racha).
  - *Revisión semanal/mensual* (comparativas, activos, horarios, estrategia).
  - *Importación masiva* desde escritorio o móvil cuando exista un archivo del bróker.
- **Restricciones de contexto:** pantallas pequeñas, uso con una mano, interrupciones, conectividad
  intermitente, necesidad de privacidad (datos financieros en el dispositivo).

## 4. Alcance funcional (mapa de capacidades)

| Módulo | Capacidad | Fase |
|---|---|---|
| Autenticación y sesión | Registro, acceso, renovación de token, bloqueo local, cierre de sesión por dispositivo | MVP |
| Cuentas de trading | Cuentas real/demo, divisa, saldo inicial, plataforma de origen | MVP |
| Operaciones | Alta manual, edición, detalle, listado, filtros, búsqueda, borrado lógico | MVP |
| Importación | CSV/Excel con mapeo de columnas, previsualización, deduplicación, informe de errores | MVP |
| Historial | Listado paginado, filtros combinables, exportación | MVP |
| Control financiero | Depósitos, retiros, ajustes, comisiones, saldo calculado, último saldo confirmado | MVP |
| Dashboard | 13 indicadores, 4 gráficos en MVP, filtros por fecha/activo/cuenta | MVP |
| Analítica | Win rate, profit factor, expectativa, rachas, drawdown, rendimiento por activo/hora/estrategia | MVP (núcleo) / Fase 4 (avanzada) |
| Diario | Estrategia, motivo, emoción, disciplina, errores, aprendizaje | MVP |
| Feedback IA | Informes diario/semanal/mensual con evidencias y validación anti-alucinación | Fase 4 |
| Adjuntos | Capturas por operación en almacenamiento privado | Fase 4 |
| Alertas | Límite de pérdida diaria, racha, importe inusual, resúmenes | Fase 5 |
| Reportes | Exportación CSV/PDF y compartir | Fase 5 |
| Ajustes | Tema, idioma, zona horaria, divisa, privacidad, exportar/eliminar datos | MVP (núcleo) / Fase 5 (resto) |

## 5. Análisis funcional

### 5.1 Actores

| Actor | Descripción | Permisos |
|---|---|---|
| Usuario autenticado | Dueño de sus datos | CRUD sobre sus cuentas, operaciones, movimientos, diario y ajustes |
| Sistema (jobs) | Cálculos programados, resúmenes, feedback | Lectura/escritura de agregados y reportes del usuario |
| Proveedor de IA (Groq, nivel gratuito) | Genera texto a partir de métricas | Sin acceso a base de datos; recibe solo un payload agregado, sin PII |
| Plataforma de origen (Binomo) | Fuente externa de operaciones | **Sin integración activa** (ver `02`) |

No hay roles administrativos en el MVP. El modelo de datos es multi-usuario desde el inicio
(`userId` en toda entidad de negocio) para no bloquear un uso futuro compartido, pero la app se
entrega como herramienta personal.

### 5.2 Flujos principales

**F1 — Configuración inicial**
Registro → verificación de correo (si se habilita) → alta de cuenta de trading (real o demo,
divisa, saldo inicial) → registro del primer depósito → dashboard vacío con guía.

**F2 — Registro de una operación**
Nueva operación → formulario con valores por defecto (última cuenta, activo frecuente, importe
habitual) → validación → cálculo de resultado neto → guardado → opción “añadir nota al diario”.

**F3 — Importación**
Seleccionar archivo → detectar formato → mapear columnas → previsualizar (válidas, duplicadas,
erróneas) → confirmar → importación transaccional → informe con conteos y errores descargables.

**F4 — Revisión**
Dashboard con filtros → indicadores → gráfico de capital → perforar a historial filtrado →
detalle de operación → diario asociado.

**F5 — Feedback (Fase 4)**
Solicitud o generación programada → cálculo determinista de métricas del periodo → validación de
muestra mínima → generación de texto con evidencias → validación de esquema y de cifras → informe
guardado con snapshot de métricas.

**F6 — Conciliación de saldo**
El usuario registra el saldo que muestra el bróker (“saldo confirmado”) → la app compara con el
saldo calculado → si la diferencia supera la tolerancia, muestra un aviso de conciliación con la
diferencia y los movimientos sospechosos de explicarla.

### 5.3 Reglas de negocio

| ID | Regla |
|---|---|
| BR-01 | Una operación pertenece a **una** cuenta de trading y a **un** usuario. Nunca se comparten datos entre usuarios. |
| BR-02 | El resultado de una operación es `WIN`, `LOSS`, `DRAW`, `CANCELLED` u `OPEN`. Solo las tres primeras cuentan como liquidadas; `OPEN` y `CANCELLED` se excluyen de los cálculos de rendimiento. |
| BR-03 | El **saldo calculado** es una estimación derivada de movimientos y resultados; el **saldo confirmado** es el último saldo declarado desde la plataforma. Nunca se muestra el calculado como si viniera del bróker. |
| BR-04 | El resultado neto de una operación (`netPnl`) se calcula una sola vez en el dominio y **no** se registra además como movimiento financiero, para evitar doble contabilización. |
| BR-05 | Los importes se almacenan en **unidades menores enteras** (céntimos) y la rentabilidad en **puntos básicos** enteros. No se usa punto flotante en ningún cálculo monetario. |
| BR-06 | Las fechas se almacenan en **UTC**; las agrupaciones por día, semana, mes y hora se hacen en la zona horaria IANA del usuario. |
| BR-07 | Un `externalId` repetido dentro de la misma cuenta se rechaza. Sin `externalId`, se aplica una huella determinista (fecha de apertura + activo + dirección + importe + duración). |
| BR-08 | Las operaciones se borran de forma lógica (`deletedAt`) y quedan auditadas; nunca se elimina historial financiero de forma silenciosa. |
| BR-09 | Cualquier métrica mostrada con menos de 30 operaciones liquidadas se marca como **muestra insuficiente**; con 30–99, **tendencia preliminar**; con 100 o más, **muestra razonable**. En ningún caso se afirma significancia estadística. |
| BR-10 | El feedback de IA describe patrones observados y su tamaño de muestra; no predice el mercado, no emite señales y no garantiza resultados. |
| BR-11 | Una cuenta demo nunca se suma al capital real. Los indicadores globales excluyen demo salvo filtro explícito. |
| BR-12 | No se solicitan, almacenan ni transmiten credenciales, cookies o sesiones de Binomo. |

## 6. Qué NO es este producto

- No es un bot ni automatiza operaciones (y Binomo lo prohíbe explícitamente, ver `02`).
- No abre, cierra ni modifica operaciones en ninguna plataforma.
- No genera señales de compra/venta ni “predicciones” de mercado.
- No es asesoramiento financiero, fiscal ni legal.
- No garantiza ni proyecta rentabilidad futura.
- No sustituye los extractos oficiales del bróker.

## 7. Indicadores de éxito del producto (uso personal)

| Objetivo | Métrica | Objetivo a 30 días de uso |
|---|---|---|
| Registro constante | % de días con al menos una operación registrada | ≥ 80 % |
| Calidad del registro | % de operaciones con estrategia y nota de diario | ≥ 60 % |
| Utilidad percibida | Revisiones semanales abiertas | ≥ 3 de 4 |
| Confianza en los datos | Divergencias de saldo explicadas | 100 % de divergencias con aviso mostrado |
| Rapidez | Tiempo mediano de alta manual de operación | ≤ 45 s |

## 8. Glosario

| Término | Definición |
|---|---|
| **Operación (trade)** | Contrato binario con activo, dirección, importe, duración y resultado. |
| **CALL / PUT** | Dirección alcista / bajista. |
| **Stake** | Importe invertido en la operación. |
| **Payout** | Porcentaje de rentabilidad ofrecido (p. ej. 80 %). En datos: puntos básicos (8000). |
| **Net PnL** | Ganancia o pérdida neta de la operación, en unidades menores. |
| **Win Rate** | `victorias / (victorias + derrotas)`. Los empates no forman parte del denominador y se informan aparte. |
| **Profit Factor** | `ganancia bruta / pérdida bruta` (valor absoluto). Si no hay pérdidas, se muestra “sin pérdidas en el periodo”, no un número infinito. |
| **Expectativa** | `netPnL total / operaciones liquidadas`. |
| **Drawdown máximo** | Mayor caída porcentual desde un máximo de capital hasta un mínimo posterior. |
| **Saldo confirmado** | Último saldo declarado por el usuario desde la plataforma. |
| **Saldo calculado** | Saldo derivado por la app según la fórmula de `05-modelo-datos.md`. |
| **Muestra insuficiente** | Menos de 30 operaciones liquidadas en el recorte analizado. |
| **Cuenta real / demo** | Cuenta con dinero propio / cuenta con dinero virtual. |
