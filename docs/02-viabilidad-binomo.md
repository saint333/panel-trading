# 02 — Viabilidad de integración con Binomo

> **Conclusión anticipada:** Binomo **no ofrece API pública ni integración autorizada** para
> terceros, y su Acuerdo de Cliente prohíbe el uso de software especializado para operar. Por tanto,
> la vía de integración automática **no es viable ni legítima hoy**. El MVP se construye sobre
> **registro manual + importación de archivos aportados por el usuario**, con una arquitectura de
> adaptadores que permita activar una integración el día que exista un mecanismo autorizado.

## 1. Método y alcance de la investigación

- **Fecha de la investigación:** 2026-11-21.
- **Fuentes consultadas:** centro de ayuda oficial de Binomo, Acuerdo de Cliente publicado por
  Binomo, documentación de librerías de terceros (para verificar qué hacen y por qué quedan fuera),
  páginas de la industria que documentan la ausencia de API.
- **Preguntas a responder:**
  1. ¿Existe API oficial documentada? ¿Existe portal de desarrolladores o emisión de claves?
  2. ¿Existe un mecanismo autorizado de conexión (OAuth, socio, agregador)?
  3. ¿Se puede exportar el historial a CSV/Excel de forma nativa?
  4. ¿Qué dicen los términos de uso sobre bots, software especializado y acceso automatizado?
  5. ¿Qué información se puede obtener legítimamente?

> Limitación explícita: no se ha creado ninguna cuenta, no se ha iniciado sesión, no se ha
> inspeccionado tráfico autenticado ni se ha probado ningún endpoint privado. La conclusión se basa
> en documentación pública y en la propia declaración del bróker.

## 2. Hallazgos

### 2.1 No existe API pública

Binomo no publica API para desarrolladores: no hay portal de desarrolladores, ni documentación de
endpoints, ni generación de claves de API. La plataforma es propietaria y solo se accede por web y
apps móviles. No hay MetaTrader, cTrader, FIX ni pasarela de terceros.

Existen librerías comunitarias (por ejemplo `BinomoAPI` / `binomoapi`) que **replican los endpoints
HTTP y WebSocket que usa la aplicación web de Binomo**, e incluso permiten iniciar sesión con la
cookie de sesión (`authtoken`) del navegador. Eso es exactamente lo que este proyecto **no** va a
usar: es ingeniería inversa de una interfaz privada, depende de la sesión del usuario y puede
vulnerar el Acuerdo de Cliente. Su propia documentación reconoce que “no es una API oficial” y que
el cumplimiento de los términos es responsabilidad del usuario.

### 2.2 El Acuerdo de Cliente prohíbe el software especializado

El centro de ayuda oficial responde de forma explícita a “¿Puedo usar bots para operar?”: la
plataforma está pensada para ser usada por personas y **no se permite usar bots, inteligencia
artificial ni ningún tipo de software especializado para operar**; remite al apartado 12.12 del
Acuerdo de Cliente.

El texto del Acuerdo (vigente desde el 30 de septiembre de 2024) establece en 12.12 que, si el
cliente obtiene beneficios usando bots, inteligencia artificial, software especializado **no
aprobado directamente por la Compañía** o vulnerabilidades, esos beneficios **no se abonan** y no
generan responsabilidad para la Compañía. Además, el Acuerdo contempla la restricción de cuentas
cuando se sospecha fraude o uso de software prohibido.

**Lectura para este proyecto:** la app es de solo lectura y no ejecuta operaciones, lo que reduce
mucho el riesgo. Pero un acceso automatizado a endpoints privados sigue siendo “software
especializado” a los ojos del bróker y puede poner en riesgo la cuenta. **No se implementará.**

### 2.3 No hay exportación documentada de historial

El centro de ayuda explica **dónde ver** el historial de operaciones dentro de la plataforma, pero no
documenta una función de **exportación** a CSV/Excel ni un portal de extractos descargables. Es
posible que el soporte entregue un extracto a solicitud del titular; eso es un canal legítimo
porque el archivo lo aporta el usuario, no la app.

Consecuencia de diseño: la app **no puede prometer sincronización**. Promete importación de un
archivo que el usuario ya posee, con mapeo de columnas y previsualización.

### 2.4 Qué información es legítimamente obtenible

| Dato | ¿Disponible? | Vía legítima |
|---|---|---|
| Historial de operaciones | Sí, visible en la plataforma | Lectura manual por el usuario / captura de pantalla / archivo que entregue soporte |
| Saldo de la cuenta | Sí, visible | Declaración manual del usuario (“saldo confirmado”) |
| Depósitos y retiros | Sí, visibles | Registro manual de movimientos |
| Datos de mercado / velas | No se necesitan | — |
| Credenciales o cookies | **No** | Prohibido para este proyecto |
| Ejecución de operaciones | **No** | Fuera de alcance por diseño y por términos |

## 3. Matriz de mecanismos evaluados

| # | Mecanismo | Disponibilidad real | ¿Cumple los términos? | Esfuerzo | Decisión |
|---|---|---|---|---|---|
| A | API oficial de Binomo | No existe | N/A | — | **No disponible** |
| B | OAuth / conexión de socio autorizada | No existe | N/A | — | **No disponible** |
| C | Exportación nativa CSV/Excel | No documentada; no verificada | Sí, si el usuario descarga su archivo | Bajo | **Preparado, no dependiente** |
| D | Endpoints privados / WebSocket no documentados | Existen pero no son públicos | **No** (§12.12, riesgo de cuenta) | Alto | **Descartado** |
| E | Reutilización de cookie de sesión (`authtoken`) | Técnicamente posible | **No** | Medio | **Descartado** |
| F | Scraping de la web autenticada | Técnicamente posible | **No** | Alto y frágil | **Descartado** |
| G | Registro manual de operaciones | Siempre disponible | Sí | Bajo | **MVP — vía principal** |
| H | Importación de archivo aportado por el usuario | Disponible si el usuario obtiene el archivo | Sí | Medio | **MVP — vía secundaria** |
| I | OCR local de capturas de pantalla | Disponible en el dispositivo | Sí (dato propio) | Medio-alto | **Fase posterior, opcional** |
| J | Solicitud formal de acceso/API al bróker | No hay programa conocido | Sí (es una petición) | Muy bajo | **Acción del usuario, sin garantía** |

## 4. Decisión

1. **No se implementa ninguna integración automática con Binomo** en el MVP ni en las fases
   posteriores mientras no exista un mecanismo oficial y autorizado por escrito.
2. La arquitectura incorpora un **puerto de plataforma de trading** y adaptadores, para que la
   lógica de negocio no dependa de Binomo y para poder añadir otro bróker (o una API futura) sin
   reescribir el sistema.
3. Las vías de entrada de datos del MVP son **manual** (principal) e **importación de archivo**
   (secundaria). Ambas se diseñan con la misma validación y deduplicación.
4. El adaptador de Binomo existe como **capacidad declarada `unavailable`**: no contiene cliente HTTP,
   no envía peticiones, no acepta credenciales. Si en el futuro se autoriza, se implementa detrás del
   mismo puerto y se documenta su contrato.
5. Cualquier intento futuro de integración requiere: autorización escrita del bróker, revisión legal
   del Acuerdo vigente y una evaluación de seguridad específica.

### 4.1 Contrato conceptual del puerto (sin código en esta fase)

```
TradingPlatformPort
  capabilities() -> { listTrades, importFile, readBalance, webhooks }
  listTrades(cursor, since) -> Page<TradeDTO>        // disponible si capabilities.listTrades
  readBalance() -> BalanceDTO                        // disponible si capabilities.readBalance
  importFile(file, mapping) -> ImportResult          // implementado por FileImportAdapter
```

Adaptadores previstos:

| Adaptador | Estado MVP | Comportamiento |
|---|---|---|
| `ManualEntryAdapter` | Activo | El usuario introduce la operación; misma validación que la importación |
| `FileImportAdapter` | Activo | CSV/XLSX aportado por el usuario, con mapeo de columnas y vista previa |
| `BinomoAdapter` | Inactivo | `capabilities()` devuelve todo `false`; no hay red ni credenciales |
| `GenericBrokerAdapter` | Reservado | Punto de extensión para un bróker con API documentada |

## 5. Deduplicación (crítica para importaciones repetidas)

El usuario reimportará el mismo archivo. El sistema debe ser **idempotente**:

1. **Clave externa:** si el archivo trae identificador de operación y el mapeo lo marca como
   `externalId`, la restricción única es `(accountId, externalId)`.
2. **Huella determinista:** si no hay identificador, se calcula
   `sha256(accountId | openedAt UTC | assetSymbol | direction | stakeMinor | durationSeconds)`.
   Restricción única `(accountId, fingerprint)` para operaciones sin `externalId`.
3. **Dentro del archivo:** se descartan duplicados antes de insertar y se informan como
   “duplicadas en el archivo”.
4. **Transaccionalidad:** cada lote de importación se ejecuta en una transacción con registro en
   `ImportBatch`. Un fallo no deja datos parciales.
5. **Resultado auditable:** el informe devuelve `inserted`, `skippedExisting`, `skippedInFile`,
   `rejected` y el detalle de errores por fila (descargable).

Ni la huella ni el identificador se usan para “adivinar” operaciones distintas: ante ambigüedad se
pide confirmación al usuario en la vista previa.

## 6. Impacto en el producto y mitigaciones

| Impacto | Mitigación |
|---|---|
| Alta fricción: registrar cada operación a mano | Formulario ultrarrápido con valores por defecto, duplicar operación, plantillas y atajos; objetivo ≤ 45 s |
| Riesgo de error humano en importes y horas | Validaciones, vista previa, edición posterior y auditoría de cambios |
| Usuario cree que “sincroniza” | Lenguaje explícito en la UI: “Binomo no ofrece conexión oficial; las operaciones se registran manualmente o desde un archivo” |
| Historial incompleto | Indicador de cobertura (“operaciones registradas este mes”) y recordatorio de registro |
| Usuario pide credenciales de Binomo | La app no tiene campo para ellas y explica por qué |
| Frustración si esperaba automatización | Se comunica en onboarding y en la sección de importación |

## 7. Si en el futuro se autoriza el acceso

Condiciones de activación (todas obligatorias):

1. Documento oficial del bróker autorizando el acceso y su alcance (solo lectura, datos concretos).
2. Endpoint documentado, versionado y con autenticación estándar (OAuth 2.1 o clave revocable).
3. Revisión legal del Acuerdo vigente y de la jurisdicción del usuario.
4. Revisión de seguridad: almacenamiento de tokens en `SecureStore`, rotación, revocación, registro
   de auditoría, límites de frecuencia, sin secretos en logs.
5. Implementación del adaptador detrás de `TradingPlatformPort`, con pruebas de contrato y
   sincronización incremental por cursor, más conciliación contra el registro manual existente.

Hasta entonces, el adaptador permanece inactivo y la UI no muestra ningún botón de “conectar con
Binomo” que no funcione.

## 8. Fuentes

- Binomo Help Center — “Can I use bots for trading?”:
  https://helpcenter.binomo5.com/hc/en-us/articles/360048637933--Can-I-use-bots-for-trading
- Binomo — Client Agreement (apartado 12.12, vigente 30/09/2024): https://binomo.as/agreement
- Binomo Help Center — categoría Trading (“Where can I find the history of my trades?”):
  https://helpcenter.binomo5.com/hc/en-us/categories/360003511533-Trading
- BinomoAPI (librería no oficial, usada solo como evidencia de que no hay API pública):
  https://chipadevteam.github.io/BinomoAPI/faq
- Análisis de la industria sobre ausencia de API pública en Binomo:
  https://iatraderpro.com/en/does-binomo-have-official-api-2026

> Las fuentes pueden cambiar. Antes de retomar la integración, repetir la verificación y registrar
> la fecha y el texto exacto del Acuerdo vigente.
