# 12 — Criterios de aceptación

## 1. Definition of Done (por historia)

Una historia está terminada cuando:

1. Cumple todos sus criterios de aceptación, demostrados en un dispositivo o vía API.
2. Tiene pruebas automatizadas en el nivel adecuado (`09`).
3. Validaciones de formulario y servidor provienen del mismo esquema compartido.
4. Maneja carga, vacío, error y sin conexión (si muestra datos).
5. Tiene textos en i18n, sin literales en componentes.
6. Es accesible (etiquetas, contraste, tamaño táctil).
7. No introduce `any` implícito, ciclos de dependencia ni lógica duplicada.
8. Actualiza la documentación afectada (`05` si hay esquema, `04` si hay contrato).
9. Pasa CI completo y no deja `skip`/`only`.
10. Fue revisada contra el checklist de seguridad si toca datos, auth o archivos.

## 2. Aceptación por módulo

### AC-01 — Autenticación y sesión
- Registro con correo nuevo → sesión iniciada y dashboard vacío.
- Correo repetido → error genérico; no se filtra existencia.
- Refresh: access expirado se renueva sin que el usuario lo note.
- Refresh reutilizado → 401 y sesión revocada; se pide login.
- 5 intentos fallidos → espera progresiva.
- Revocar sesión desde otro dispositivo → el revocado no renueva.
- Contraseña y tokens nunca aparecen en logs.
- Sin conexión: se muestra último estado o pantalla de login, sin bucles de reintento.

### AC-02 — Cuentas
- Crear cuenta REAL y DEMO; el tipo es obligatorio y visible.
- Los indicadores globales excluyen DEMO por defecto (verificable con datos mezclados).
- Declarar saldo confirmado muestra diferencia y no altera el calculado.
- Archivar cuenta conserva operaciones y las excluye de selectores.
- No se puede archivar la única cuenta activa.

### AC-03 — Operaciones
- Alta completa en ≤ 45 s con precarga; neto visible antes de guardar.
- Doble pulsación no crea duplicados.
- Importe 0, negativo, payout > 100 %, duración ≤ 0 o vencimiento anterior → bloqueado.
- WIN/LOSS/DRAW/CANCELLED/OPEN producen el `netPnl` de `05`.
- Edición con conflicto de versión avisa y no sobrescribe.
- Borrar pide confirmación, excluye de métricas y permite deshacer 10 s.
- El detalle muestra todos los campos y la hora local con zona.

### AC-04 — Historial
- Filtros combinados devuelven exactamente el conjunto esperado (probado con fixtures).
- Los filtros se conservan al entrar y volver del detalle.
- Paginación sin duplicados ni saltos; cursor inválido → 400.
- Resultado distinguible por color **y** icono **y** texto.
- Búsqueda en notas insensible a mayúsculas y acentos.

### AC-05 — Importación
- CSV con `;`, BOM y coma decimal importa correctamente.
- Vista previa separa válidas, duplicadas y erróneas con conteos exactos.
- Confirmar importa todo o nada; un fallo no deja filas parciales.
- Reimportar el mismo archivo 3 veces deja el mismo estado.
- Archivo de 10 001 filas se rechaza con mensaje claro.
- Informe final descargable con errores por fila.
- Fórmulas de Excel y HTML en celdas se tratan como texto.

### AC-06 — Finanzas
- El desglose del saldo coincide con la fórmula canónica.
- Registro de resultado de operación **no** crea movimiento adicional.
- Depósito, retiro, comisión, bono y ajuste afectan el saldo con el signo correcto.
- Ajuste o corrección sin nota → bloqueado.
- Divergencia con confirmado → banner persistente con importe exacto.
- Cada línea del desglose abre el listado filtrado correspondiente.
- Etiquetas “Saldo calculado por la app” y “Saldo confirmado” siempre visibles.

### AC-07 — Dashboard
- Los 13 indicadores aparecen con periodo y `n`.
- Con 0 operaciones se muestra estado vacío, no una cuadrícula de ceros.
- Los filtros afectan a todos los indicadores y gráficos de la pantalla.
- Los gráficos responden al toque y muestran fecha y valor.
- Con 5 000 puntos la interacción sigue fluida.
- Cada métrica tiene ayuda con fórmula y exclusiones.
- Offline: datos cacheados con “actualizado hace X” y banner.

### AC-08 — Analítica avanzada
- Profit factor sin pérdidas → `null` + “sin pérdidas en el periodo”.
- Win rate sin decididas → `null`, nunca `0`.
- Rachas correctas con empates intercalados (no los cuentan ni los cortan).
- Drawdown porcentual y absoluto coincide con cálculo manual en un fixture.
- Grupos con `n < 30` muestran “muestra insuficiente”.
- Los totales de los grupos suman el total del periodo (cuando las categorías son excluyentes).

### AC-09 — Diario
- Se puede crear y editar desde el detalle y desde la sección Diario.
- Borrador sobrevive a cierre de la app.
- “¿Respeté el plan?” tiene tres estados y se refleja en filtros.
- El texto no se envía a IA (verificable en el payload de `feedback`).
- Adjuntos (Fase 4): comprimidos, sin EXIF, acceso solo por URL firmada de 5 min.

### AC-10 — Feedback IA
- Informe diario, semanal y mensual generado bajo demanda.
- Cada hallazgo incluye métrica, valor, periodo y nivel de muestra.
- Snapshot de métricas almacenado e inmutable.
- Una cifra inventada provoca rechazo y regeneración; el informe inválido no se muestra.
- Menos de 30 operaciones → lenguaje de muestra insuficiente.
- Filtro de frases bloquea “predice”, “garantiza”, “señal de compra/venta”, “recupera pérdidas”.
- El payload no contiene correo, notas, diario, capturas ni IDs de cuenta.
- Se respetan límites diarios y caché por periodo.

### AC-11 — Alertas
- Pérdida diaria superada → notificación local informativa y evento registrado.
- Racha de N pérdidas → alerta una sola vez por racha.
- Importe inusual e incremento tras pérdida → detectados con datos de prueba.
- Silencio horario respetado.
- Ningún texto invita a operar más.
- Desactivar una regla detiene las alertas inmediatamente.

### AC-12 — Ajustes, privacidad y calidad
- Tema claro/oscuro/sistema persistente y aplicado sin reinicio.
- Cambio de zona horaria recalcula agrupaciones (con prueba DST).
- Exportación completa generada y descargable.
- Borrado de cuenta con confirmación escrita y gracia de 7 días.
- Disclaimer visible en onboarding y ajustes.
- Ninguna pantalla con texto hardcodeado fuera de i18n.

## 3. Checklist de seguridad (previo a release)

- [ ] Todos los endpoints autenticados, salvo `health` y `auth/login|register|refresh`.
- [ ] Pruebas de IDOR en cada recurso (`GET/PATCH/DELETE`).
- [ ] `userId` siempre del token; nunca del body/query.
- [ ] Rate limiting activo y probado en auth, escritura y feedback.
- [ ] Argon2id con parámetros actuales; sin contraseñas en logs ni en Sentry.
- [ ] Refresh rotativo con detección de reutilización y revocación en cascada.
- [ ] HTTPS/HSTS en producción; CORS solo para orígenes necesarios.
- [ ] Validación estricta de entrada (Zod) y límites de tamaño de archivo.
- [ ] Uploads: MIME real, extensión, tamaño, nombre saneado, antivirus/escaneo si aplica.
- [ ] Bucket privado; URLs firmadas de corta duración; sin listados públicos.
- [ ] Scrubbing de PII en logs y Sentry.
- [ ] `gitleaks` limpio; ningún secreto en el repositorio.
- [ ] Dependencias sin vulnerabilidades altas/críticas sin justificar.
- [ ] Backup y restauración probados en staging.
- [ ] Exportación/borrado de datos probados de extremo a extremo.
- [ ] Revisión de textos: sin promesas de rentabilidad, sin señales, sin “conectar Binomo”.
- [ ] Revisión de cumplimiento: sin credenciales, cookies, WebSocket ni endpoints privados.

## 4. Checklist de release

- [ ] Versión y `CHANGELOG` actualizados.
- [ ] Migraciones aplicadas y ensayadas desde cero en staging.
- [ ] CI completo en verde; E2E Maestro en Android e iOS.
- [ ] Pruebas de carga dentro de objetivos (`09`).
- [ ] Build firmado Android (AAB) e iOS (TestFlight).
- [ ] Icono, splash, nombre, descripción y capturas sin marca de terceros ni promesas.
- [ ] Política de privacidad publicada y enlazada.
- [ ] Monitoreo y alertas de error activos.
- [ ] Runbook: rollback, restore, rotación de secretos, contacto.
- [ ] Riesgos residuales aceptados por escrito.

## 5. Decisiones que requieren confirmación del usuario antes de M1

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| D-01 | **Automatización con Binomo** | (a) aceptar registro manual/importación; (b) esperar a una API oficial | **(a)** — (b) no tiene fecha ni garantía |
| D-02 | **Distribución** | (a) uso personal (build interno/TestFlight); (b) publicación pública en tiendas | **(a)** primero; evaluar (b) con revisión legal y de políticas |
| D-03 | **Proveedor de IA** | (a) Groq nivel gratuito; (b) Gemini (mejor calidad, pero entrena con los datos del nivel gratuito); (c) Cloudflare Workers AI | **(a)** Groq: 0 USD, JSON estricto, sin retención por defecto. Solo requiere crear una cuenta gratuita, sin tarjeta |
| D-04 | **Infraestructura** | (a) Neon + Render; (b) Fly.io; (c) VPS propio | **(a)** por coste y simplicidad; no se contrata nada sin aprobación explícita |
| D-05 | **Divisa y zona horaria** | Confirmar divisa de la cuenta real y zona IANA | Necesario para validar cálculos y agrupaciones |
| D-06 | **Datos iniciales** | ¿Importar historial existente desde el primer día o empezar de cero? | Empezar de cero y probar el importador con un archivo real |
| D-07 | **Alcance del MVP** | ¿Se confirma M1–M5 como MVP y M6–M8 como fases posteriores? | Sí, para reducir riesgo de sobrecarga |

## 6. Criterio de aceptación global del plan

La Fase 1 se considera aceptada cuando el usuario confirma que:

1. La limitación de Binomo (sin API, sin exportación documentada, sin automatización) es aceptable.
2. El alcance del MVP (`10`) refleja lo que quiere usar a diario.
3. Las decisiones de stack y arquitectura (`03`, `04`) le parecen razonables.
4. El roadmap (`11`) y su duración estimada son aceptables.
5. No hay requisitos del plan original sin respuesta (matriz de `07`, sección 3).
