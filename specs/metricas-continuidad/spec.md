# spec · metricas-continuidad — Métricas de sesión, continuidad y bienvenida

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 4 — Progreso y retención
- **Módulos:** `src/application/metrics`, `src/domain/continuity`,
  `src/application/continuity`, `src/domain/welcome`, `src/application/welcome`

## Contexto
Al cerrar cada sesión de práctica, EMMA necesita: (1) medir objetivamente cómo le fue
al aprendiz (latencia de respuesta, monólogo sostenido, densidad de error) para
clasificarlo por nivel MCER; (2) recordar dónde quedó una simulación sin terminar para
retomarla en la próxima visita; y (3) generar un saludo personalizado en inglés que
adapte tono y vocabulario al nivel del aprendiz, con andamiaje opcional en español sobre
el plan de estudio. Estas tres capacidades comparten el principio de "nunca romper la
experiencia del usuario por un fallo de IO": las métricas tragan errores de persistencia
y la continuidad se degrada explícitamente en vez de fallar.

## Historias de usuario

### US-1 — Medir el progreso de una sesión
Como aprendiz, quiero que EMMA registre qué tan bien me fue en cada sesión, para ver mi
evolución real en vez de una sensación subjetiva.
- **Given** una sesión con turnos de EMMA y del aprendiz con marcas de tiempo **When**
  se calculan las métricas **Then** la latencia de respuesta es la mediana de los
  segundos entre cada turno de EMMA y la respuesta inmediata del aprendiz.
- **Given** el aprendiz no escribió ninguna palabra en la sesión **When** se calcula la
  densidad de error **Then** el resultado es 0 (no división por cero).
- **Given** el repositorio de métricas falla al guardar **When** se llama
  `trackSessionMetrics` **Then** el error se captura y loguea, sin propagarse (el cierre
  de sesión nunca se rompe por esto).

### US-2 — Retomar una simulación sin terminar
Como aprendiz que vuelve a EMMA, quiero ver un resumen de mi última conversación
inconclusa, para continuar donde la dejé sin repetir contexto.
- **Given** el hilo más reciente del aprendiz tiene menos turnos de usuario que el
  presupuesto del escenario **When** se construye el resumen de continuidad **Then**
  se devuelve un `SessionSummary` con el último intercambio no vacío, truncado a 160
  caracteres en frontera de palabra.
- **Given** el hilo más reciente ya alcanzó el presupuesto de turnos del escenario
  **When** se construye el resumen **Then** el resultado es `null` (sesión terminada,
  nada que retomar).
- **Given** el `scenarioType` del hilo ya no existe en el catálogo **When** se resuelve
  el escenario **Then** el resumen se marca `degraded: true` con `scenarioTitle: null`,
  en vez de fallar.

### US-3 — Saludo de bienvenida personalizado
Como aprendiz, quiero un saludo inicial adaptado a mi nivel e intereses, para sentir que
EMMA me conoce desde el primer mensaje.
- **Given** el perfil del aprendiz con nivel CEFR, rol, stack técnico y skills **When**
  se genera el saludo **Then** el prompt de usuario incluye esos cuatro campos, con
  fallback a `"unknown"` / `"not specified"` / `"none specified"` cuando faltan.
- **Given** un `tutorBriefingEs` (semana/unidad/pendientes del plan) **When** se
  construye el prompt de sistema **Then** se añade la instrucción de cerrar el saludo
  con UNA frase en español señalando qué sigue, sin romper la inmersión en inglés del
  resto del mensaje.
- **Given** un aprendiz de género "feminine" y nivel B2 **When** se resuelve la voz TTS
  **Then** gana el mapeo por género (`en-US-AriaNeural`) sobre el mapeo por nivel CEFR.

## Requisitos funcionales
- **FR-001** `computeSessionMetrics` calcula tres métricas medibles desde el chat: la
  mediana de latencia de respuesta (turno EMMA→usuario), las palabras del turno más
  largo del usuario (proxy de monólogo sostenido) y errores por 100 palabras escritas.
- **FR-002** Todas las métricas devuelven 0 cuando no hay datos suficientes (sin turnos
  de usuario, sin latencias medibles, o sin palabras escritas) en vez de `NaN` o error.
- **FR-003** `trackSessionMetrics` y `getMetricsTrend` capturan cualquier error del
  repositorio inyectado, lo loguean con `console.error` y devuelven un resultado neutro
  (no lanzan excepción hacia el llamador).
- **FR-004** `getMetricsTrend` promedia las últimas `last` métricas guardadas por cada
  dimensión (latencia, monólogo, densidad de error), devolviendo 0 si no hay entradas.
- **FR-005** `buildSessionSummary` devuelve `null` cuando el hilo no tiene
  `scenarioType` parseable o cuando el aprendiz ya agotó el presupuesto de turnos del
  escenario (`isFinished`).
- **FR-006** `truncateExchange` corta el texto a 160 caracteres (`MAX_EXCHANGE_CHARS`)
  en la última frontera de espacio disponible y agrega una elipsis, evitando cortar una
  palabra a la mitad.
- **FR-007** `buildSummary` marca `degraded: true` cuando el escenario no se pudo
  resolver (`scenario === null`) o cuando no hay intercambio previo con texto.
- **FR-008** `buildWelcome` invoca el puerto `LlmGenerate` con el prompt de sistema y de
  usuario construidos, con `WELCOME_MAX_TOKENS` como tope, y devuelve el texto
  recortado (`trim()`); nunca lanza si el LLM devuelve vacío.
- **FR-009** `resolveVoice` prioriza el mapeo por género sobre el mapeo por nivel CEFR;
  si ninguno aplica, cae a la voz por defecto `en-US-EmmaNeural`.

## Criterios de éxito
- **SC-001** Un fallo de persistencia de métricas nunca interrumpe el flujo de cierre de
  sesión visible para el aprendiz (verificado por `track-session-metrics-use-case`).
- **SC-002** El resumen de continuidad nunca expone un hilo ya terminado como "pendiente
  de retomar".
- **SC-003** Ningún `lastExchange` mostrado en el saludo de continuidad supera 160
  caracteres ni corta una palabra a la mitad.
- **SC-004** El saludo generado conserva el inglés como idioma de la conversación de
  práctica; el andamiaje del plan de estudio, si existe, aparece sólo como una frase
  adicional en español (Artículo 9 — inmersión + andamiaje).
