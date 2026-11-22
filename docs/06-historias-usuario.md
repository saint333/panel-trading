# 06 — Historias de usuario

Prioridades MoSCoW: **M** = Must (MVP), **S** = Should (MVP si el tiempo lo permite), **C** = Could
(fases posteriores), **W** = Won't (fuera de alcance).

Hitos: ver `11-roadmap.md` (M1…M8).

---

## Autenticación y cuenta (M2)

### US-01 — Crear cuenta
**Como** nuevo usuario **quiero** registrarme con correo y contraseña **para** tener mis datos
privados y sincronizados.
- Prioridad: **M** · Hito: M2
- AC:
  - Correo válido y único (case-insensitive); contraseña mínimo 10 caracteres con comprobación de
    fortaleza y bloqueo de contraseñas comprometidas conocidas (lista local básica).
  - Error genérico ante correo ya registrado, sin revelar si existe.
  - Tras el registro se crea `UserSettings` con `locale=es` y zona horaria detectada, editable.
  - La sesión se inicia automáticamente y el refresh token queda en SecureStore.

### US-02 — Iniciar sesión y mantener sesión
**Como** usuario registrado **quiero** entrar y no tener que escribir la contraseña cada vez
**para** registrar operaciones rápido.
- Prioridad: **M** · Hito: M2
- AC:
  - Access token de 15 min; refresh rotativo de 30 días con detección de reutilización.
  - Al reabrir la app con refresh válido, se entra directamente al dashboard.
  - Con refresh inválido o revocado se pide login y se limpia el almacenamiento seguro.
  - Tras 5 intentos fallidos en 15 min se aplica espera progresiva.

### US-03 — Cerrar sesión en un dispositivo
**Como** usuario **quiero** revocar sesiones **para** protegerme si pierdo el teléfono.
- Prioridad: **S** · Hito: M2
- AC:
  - Lista de dispositivos con nombre, último uso y fecha de creación.
  - Revocar uno o todos; el revocado falla en su siguiente refresh.
  - La acción queda en `AuditLog`.

### US-04 — Bloqueo local de la app
**Como** usuario **quiero** un PIN/biometría al abrir **para** que nadie vea mis cifras.
- Prioridad: **C** · Hito: M7
- AC:
  - Se activa desde Ajustes; usa SecureStore/Keychain/Keystore.
  - Tras 3 fallos, biometría deshabilitada y PIN obligatorio.
  - No bloquea notificaciones locales (solo el contenido sensible).

---

## Cuentas de trading (M2)

### US-05 — Crear cuenta real o demo
**Como** usuario **quiero** separar mis cuentas reales y demo **para** no mezclar resultados.
- Prioridad: **M** · Hito: M2
- AC:
  - Campos: etiqueta, tipo (REAL/DEMO), divisa, saldo inicial, plataforma.
  - El tipo es obligatorio y no se puede inferir por defecto.
  - Al crear la primera cuenta se registra el saldo inicial como movimiento `ADJUSTMENT` inicial
    (no editable directamente después).
  - Los indicadores globales excluyen demo salvo filtro explícito.

### US-06 — Declarar saldo confirmado
**Como** usuario **quiero** registrar el saldo que veo en el bróker **para** compararlo con el
calculado.
- Prioridad: **M** · Hito: M4
- AC:
  - Campo de importe y fecha; queda en `BalanceSnapshot`.
  - Se muestra la diferencia con el calculado y se etiqueta claramente cuál es cuál.
  - La app nunca presenta el calculado como si viniera del bróker.

### US-07 — Archivar cuenta
**Como** usuario **quiero** archivar una cuenta vieja **para** no verla en los selectores.
- Prioridad: **S** · Hito: M4
- AC:
  - Archivar no borra operaciones ni movimientos.
  - La cuenta archivada no aparece por defecto en filtros; se puede consultar explícitamente.
  - No se puede archivar la única cuenta activa.

---

## Operaciones (M3)

### US-08 — Registrar operación manual rápidamente
**Como** usuario **quiero** registrar una operación en menos de 45 segundos **para** no perder el
hábito.
- Prioridad: **M** · Hito: M3
- AC:
  - Valores precargados: última cuenta, último activo, importe y duración habituales.
  - Campos: fecha/hora (por defecto ahora), activo, dirección, importe, payout, resultado, duración,
    vencimiento calculado automáticamente, cuenta, estrategia opcional, notas.
  - El resultado neto se muestra en vivo antes de guardar.
  - Validación local idéntica a la del servidor; sin guardar datos inválidos.
  - Con `Idempotency-Key`; doble pulsación no duplica.

### US-09 — Duplicar una operación
**Como** usuario **quiero** duplicar la última operación **para** registrar operaciones parecidas.
- Prioridad: **S** · Hito: M3
- AC:
  - Duplica todos los campos excepto el resultado; la fecha pasa a “ahora”.
  - No se guarda hasta confirmar.

### US-10 — Editar una operación manual
**Como** usuario **quiero** corregir un importe o resultado mal introducido.
- Prioridad: **M** · Hito: M3
- AC:
  - Solo operaciones con `source = MANUAL` (las importadas requieren “reemplazar importación”).
  - Se guarda `version`; si otro dispositivo cambió el registro, se avisa del conflicto.
  - El cambio queda en `AuditLog` con valores anterior y nuevo (importes incluidos, sin notas).

### US-11 — Eliminar una operación
**Como** usuario **quiero** eliminar un registro erróneo **para** que no distorsione las métricas.
- Prioridad: **M** · Hito: M3
- AC:
  - Confirmación explícita con importe y fecha en el diálogo.
  - Borrado lógico; deja de contar en saldo y métricas.
  - Se puede deshacer desde un toast durante 10 segundos.

### US-12 — Ver el detalle de una operación
**Como** usuario **quiero** ver todos los datos y su contribución al saldo.
- Prioridad: **M** · Hito: M3
- AC:
  - Muestra stake, payout, resultado, neto, duración, hora local con zona, cuenta, estrategia,
    notas, origen (manual/archivo) y fecha de registro.
  - Indica la operación anterior y posterior en la secuencia de esa cuenta.
  - Acceso al diario y, en Fase 4, a capturas.

---

## Historial y búsqueda (M3)

### US-13 — Filtrar el historial
**Como** usuario **quiero** combinar filtros **para** encontrar operaciones concretas.
- Prioridad: **M** · Hito: M3
- AC:
  - Filtros: rango de fechas, cuenta, tipo de cuenta, resultado, activo, rango de importe, estrategia,
    texto en notas.
  - Los filtros se combinan con AND y se reflejan en la URL interna (se conservan al volver del detalle).
  - Contador de resultados y opción “limpiar filtros”.
  - Paginación por cursor, 50 por página.

### US-14 — Distinguir resultados de un vistazo
**Como** usuario **quiero** identificar ganadas, perdidas, empates y canceladas sin leer.
- Prioridad: **M** · Hito: M3
- AC:
  - Color + icono + texto (no solo color).
  - Contraste AA en tema claro y oscuro.
  - La fila muestra activo, dirección, importe, neto y fecha local.

---

## Importación (M4)

### US-15 — Importar un archivo CSV/XLSX
**Como** usuario **quiero** importar un archivo que ya tengo **para** no registrar cientos de
operaciones a mano.
- Prioridad: **M** · Hito: M4
- AC:
  - Acepta `.csv` (UTF-8 con/sin BOM, `;` o `,`) y `.xlsx` hasta 10 000 filas / 5 MB.
  - Detecta encabezados y propone mapeo de columnas editable.
  - Vista previa con tres pestañas: válidas, duplicadas, con error.
  - Confirmación explícita; importación transaccional.
  - Informe final con conteos y descarga de errores.

### US-16 — Evitar duplicados
**Como** usuario **quiero** reimportar sin crear duplicados.
- Prioridad: **M** · Hito: M4
- AC:
  - Deduplicación por `externalId` o huella determinista (ver `05`).
  - Duplicados existentes y duplicados dentro del mismo archivo se informan por separado.
  - Si todo el archivo es duplicado, se avisa antes de confirmar y no se escribe nada.

### US-17 — Revisar el historial de importaciones
**Como** usuario **quiero** ver qué archivos importé y qué pasó con cada uno.
- Prioridad: **S** · Hito: M4
- AC:
  - Lista con archivo, fecha, cuenta, filas totales, insertadas, omitidas y rechazadas.
  - Detalle de errores por fila con número de fila y motivo legible.

---

## Finanzas (M4)

### US-18 — Registrar depósitos, retiros y ajustes
**Como** usuario **quiero** registrar movimientos de dinero **para** que el saldo calculado sea
correcto.
- Prioridad: **M** · Hito: M4
- AC:
  - Tipos: depósito, retiro, comisión, bono, ajuste, corrección.
  - Importe siempre positivo; el tipo determina el signo.
  - Ajustes y correcciones exigen nota.
  - Edición y borrado lógico con auditoría.

### US-19 — Ver la fórmula y el desglose del saldo
**Como** usuario **quiero** entender de dónde sale el saldo calculado.
- Prioridad: **M** · Hito: M4
- AC:
  - Desglose: saldo inicial, depósitos, retiros, comisiones, bonos, ajustes, PnL de operaciones.
  - Cada línea enlaza al listado filtrado correspondiente.
  - Etiqueta visible: “Saldo calculado por la app” vs “Saldo confirmado por el usuario”.
  - Si hay divergencia, banner de conciliación con la diferencia.

### US-20 — Exportar mis datos
**Como** usuario **quiero** descargar mis operaciones y movimientos **para** respaldo o análisis
externo.
- Prioridad: **M** · Hito: M4
- AC:
  - CSV de operaciones con los filtros aplicados y encabezados en español.
  - Incluye moneda, importes en formato decimal comprensible y zona horaria usada.
  - El archivo se genera en el servidor y se descarga por URL firmada temporal.

---

## Dashboard (M5)

### US-21 — Ver el estado general al abrir la app
**Como** usuario **quiero** un dashboard con mis cifras clave **para** saber cómo voy.
- Prioridad: **M** · Hito: M5
- AC:
  - Indicadores: saldo (calculado y confirmado con etiqueta), capital inicial, depositado, retirado,
    invertido, ganancias, pérdidas, neto, nº operaciones, ganadas, perdidas, win rate, promedio por
    operación.
  - Filtros: rango de fechas (hoy, 7 días, 30 días, mes actual, personalizado), cuenta, activo.
  - Cada indicador muestra su periodo y, si aplica, el nivel de muestra.
  - Animación de carga con skeletons; nunca “0” mientras se desconoce el dato.

### US-22 — Ver la evolución del capital
**Como** usuario **quiero** una gráfica de capital **para** entender mi progreso.
- Prioridad: **M** · Hito: M5
- AC:
  - Línea de capital con eje temporal y tooltip táctil (fecha + valor).
  - Marca el inicio del periodo y el máximo/mínimo.
  - Funciona con 5 puntos y con 5 000 (downsampling si es necesario).
  - Accesible: resumen textual del inicio, fin y variación.

### US-23 — Comparar ganancias y pérdidas por periodo
**Como** usuario **quiero** ver barras por día/semana/mes **para** detectar días malos.
- Prioridad: **M** · Hito: M5
- AC:
  - Barras positivas/negativas con selector de granularidad.
  - Tocar una barra filtra el historial a ese periodo.
  - Los periodos sin operaciones se muestran vacíos, no como cero engañoso.

### US-24 — Ver rendimiento por activo y por hora
**Como** usuario **quiero** saber dónde y cuándo rindo mejor.
- Prioridad: **S** (activo) / **C** (hora) · Hito: M5 / M6
- AC:
  - Tabla y gráfico por activo: operaciones, win rate, neto, muestra.
  - Mapa de calor por hora local: intensidad por neto y tamaño de muestra.
  - Los grupos con menos de 30 operaciones se atenúan y se marcan como muestra insuficiente.

---

## Analítica avanzada (M6)

### US-25 — Consultar métricas avanzadas
**Como** usuario **quiero** profit factor, expectativa, rachas y drawdown.
- Prioridad: **S** · Hito: M6
- AC:
  - Fórmulas exactas de `05`; valores `null` explicados (“sin pérdidas en el periodo”).
  - Drawdown en porcentaje y en importe, con fecha del máximo y del mínimo.
  - Cada métrica tiene una ayuda (“¿cómo se calcula?”) con la fórmula y exclusiones.
  - Nunca se muestra una métrica sin indicar el periodo y `n`.

### US-26 — Analizar por estrategia
**Como** usuario **quiero** comparar mis estrategias **para** descartar las que no funcionan.
- Prioridad: **S** · Hito: M6
- AC:
  - Comparativa de neto, win rate, expectativa y nº de operaciones por estrategia.
  - Estrategias sin operaciones no aparecen; las archivadas se pueden incluir.
  - Las operaciones sin estrategia se agrupan como “Sin estrategia”.

### US-27 — Ver la distribución del capital arriesgado
**Como** usuario **quiero** saber qué porcentaje de mi capital arriesgo **para** controlar el riesgo.
- Prioridad: **C** · Hito: M6
- AC:
  - Histograma de `stake / capital en ese momento` en tramos (≤1 %, 1–2 %, 2–5 %, 5–10 %, >10 %).
  - Cada tramo muestra nº de operaciones y resultado neto.
  - Aviso educativo si más del 20 % de las operaciones superan el 5 % del capital.

---

## Diario (M3 texto / M6 adjuntos)

### US-28 — Escribir el diario de una operación
**Como** usuario **quiero** registrar por qué operé y qué sentí **para** detectar errores repetidos.
- Prioridad: **M** · Hito: M3
- AC:
  - Campos: estrategia, motivo, emoción previa (lista + texto), ¿respeté el plan? (sí/no/parcial),
    errores, aprendizaje.
  - Autoguardado de borrador local; guardado explícito en servidor.
  - Se puede escribir después, desde el detalle o desde la sección Diario.

### US-29 — Revisar el diario por errores
**Como** usuario **quiero** filtrar entradas por error y disciplina **para** ver patrones.
- Prioridad: **C** · Hito: M6
- AC:
  - Lista cronológica con snippet y etiquetas.
  - Filtros por estrategia, error y “no respeté el plan”.
  - Búsqueda de texto en motivo/errores/aprendizaje.

### US-30 — Adjuntar una captura
**Como** usuario **quiero** guardar la captura de la operación **para** revisarla después.
- Prioridad: **C** · Hito: M6
- AC:
  - Imagen comprimida, EXIF eliminado, máx. 5 MB.
  - Almacenamiento privado, acceso por URL firmada de 5 minutos.
  - Se puede eliminar la captura sin borrar la entrada del diario.

---

## Feedback IA (M6)

### US-31 — Recibir feedback diario
**Como** usuario **quiero** un resumen del día con observaciones **para** corregir a tiempo.
- Prioridad: **S** · Hito: M6
- AC:
  - Se genera bajo demanda y, opcionalmente, programado al cierre del día local.
  - Cada afirmación incluye la métrica y su valor, y el periodo.
  - Si hay menos de 5 operaciones, el informe es breve y declara muestra insuficiente.
  - No contiene recomendaciones de operar, señales ni predicciones.

### US-32 — Recibir feedback semanal/mensual con comparación
**Como** usuario **quiero** comparar con el periodo anterior.
- Prioridad: **S** · Hito: M6
- AC:
  - Compara métricas equivalentes y explica la variación en puntos porcentuales y absolutos.
  - Destaca máximo 3 problemas y máximo 3 fortalezas, priorizados por impacto y muestra.
  - Si el periodo anterior no tiene datos suficientes, lo dice en lugar de comparar.

### US-33 — Verificar por qué la IA dice algo
**Como** usuario **quiero** ver los datos que respaldan una observación.
- Prioridad: **S** · Hito: M6
- AC:
  - Cada hallazgo enlaza al recorte de historial que lo sustenta.
  - Se muestra `promptVersion`, modelo y fecha de generación.
  - Si una cifra del texto no coincide con el snapshot de métricas, el informe se rechaza y se
    regenera; nunca se muestra.

---

## Alertas (M7)

### US-34 — Configurar límites de pérdida y rachas
**Como** usuario **quiero** avisos cuando pierdo el control **para** parar a tiempo.
- Prioridad: **C** · Hito: M7
- AC:
  - Reglas: pérdida diaria (importe o %), racha de N pérdidas, superación de importe máximo por
    operación, incremento de importe tras pérdida.
  - Notificación local informativa, sin lenguaje que incite a “recuperar”.
  - Horario de silencio configurable.
  - Cada alerta queda registrada y se puede marcar como vista.

### US-35 — Recibir resúmenes programados
**Como** usuario **quiero** un resumen diario/semanal **para** mantener el hábito.
- Prioridad: **C** · Hito: M7
- AC:
  - Hora local configurable; contenido mínimo (neto, nº operaciones, win rate, racha actual).
  - Se puede desactivar por tipo.
  - Si no hubo operaciones, el resumen lo dice y no inventa actividad.

---

## Ajustes, privacidad y calidad (M2 / M7)

### US-36 — Cambiar tema e idioma
**Como** usuario **quiero** elegir tema claro/oscuro **para** usarla cómodamente.
- Prioridad: **M** (tema) / **C** (idioma distinto de es) · Hito: M2 / M7
- AC:
  - Tema: sistema, claro, oscuro; persistente.
  - Todos los textos desde i18n; el locale afecta formato de números y fechas.
  - Cambio de tema sin reinicio.

### US-37 — Exportar y eliminar mis datos
**Como** usuario **quiero** controlar mi información **para** cumplir mis derechos de privacidad.
- Prioridad: **S** · Hito: M7
- AC:
  - Exportación completa en ZIP (JSON + CSV) generada en servidor.
  - Eliminación de cuenta con confirmación escrita, periodo de gracia de 7 días y anonimización.
  - Se explica qué se conserva por obligación legal/auditoría y por cuánto tiempo.

### US-38 — Entender una cifra dudosa
**Como** usuario **quiero** que la app explique sus cálculos **para** confiar en ella.
- Prioridad: **M** · Hito: M5
- AC:
  - Cada métrica tiene una hoja de ayuda con fórmula, exclusiones y periodo.
  - Los valores nulos se explican en lugar de mostrarse como 0.
  - El saldo siempre indica su origen (calculado/confirmado).
