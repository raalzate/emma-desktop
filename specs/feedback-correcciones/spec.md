# spec · feedback-correcciones — Reporte y lección post-sesión

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 2 — Tutoría y andamiaje
- **Módulos:** `src/domain/feedback`, `src/application/feedback`

## Contexto
EMMA corrige en silencio durante la simulación (nunca interrumpe) y guarda cada
error como `SilentError`. Al terminar la sesión, ese historial se convierte en
dos artefactos: un reporte de feedback en Markdown (con tabla de errores,
patrones recurrentes y comentario según el carácter de la situación) y una
lección hablada en inglés generada por el LLM, con un respaldo determinista en
español cuando el LLM falla o no aporta nada útil.

## Historias de usuario

### US-1 — Ver un reporte de mis errores al terminar la simulación
Como aprendiz, quiero un reporte claro de qué dije mal y qué debí decir, para
entender mis patrones de error tras la sesión.
- **Given** terminé una simulación con 3 `SilentError` capturados **When** se
  construye el reporte (`buildFeedbackReport`) **Then** obtengo una tabla con
  una fila por error, una sección de patrones recurrentes ordenada por
  frecuencia y una sección de lección con los 2 tipos de error más comunes.
- **Given** terminé una simulación sin errores capturados **When** se construye
  el reporte **Then** obtengo el `NO_ERRORS_TEMPLATE` con el nombre del
  escenario y el número de turnos, sin tabla ni sección de lección.
- **Given** un error cuya corrección es idéntica al texto original (falso
  positivo) **When** se filtran los errores (`isMeaningfulError`) **Then** ese
  error no aparece en la tabla ni cuenta para "no errors".

### US-2 — Recibir una lección hablada de EMMA en inglés
Como aprendiz, quiero que EMMA me explique en inglés hablado por qué me
equivoqué y me dé un reto de práctica, para reforzar el aprendizaje inmerso.
- **Given** tengo errores accionables (`isActionableCorrection`) **When** se
  pide la lección (`buildLesson`) **Then** el prompt al LLM incluye cada error
  con su etiqueta, texto original y corrección, y el system prompt exige 4-7
  oraciones en inglés sin markdown.
- **Given** el LLM devuelve texto con escritura no latina o vacío o de más de
  `MAX_LESSON_CHARS` **When** se valida la respuesta (`validLesson`)
  **Then** `buildLesson` retorna `null` para que el llamador use el respaldo.
- **Given** ninguno de mis errores es accionable **When** se pide la lección
  **Then** `buildLesson` retorna `null` sin llamar al LLM.

### US-3 — Ver un resumen de sesión legible cuando no hay lección del LLM
Como aprendiz, quiero un resumen en español con secciones claras (correcciones,
lección, siguiente paso) aunque el LLM no responda, para no perder feedback.
- **Given** `lesson` es `null` y mi error dominante es `article` **When** se
  compone el resumen (`composeSessionSummary`) **Then** la sección de lección
  usa `LESSON_TIPS.article` como respaldo determinista.
- **Given** no tengo errores en la sesión **When** se compone el resumen
  **Then** el texto felicita sin correcciones y aun así incluye la sección de
  siguiente paso con el nivel actual.

## Requisitos funcionales
- **FR-001** `buildFeedbackReport` filtra errores donde `corrected === original`
  (`isMeaningfulError`) antes de decidir si la sesión tuvo errores.
- **FR-002** El orden de "patrones recurrentes" es por conteo descendente,
  empatando por orden de primera aparición (`mostCommon`, equivalente a
  `Counter.most_common`).
- **FR-003** La sección de lección del reporte (`formatLesson`) usa como máximo
  los 2 tipos de error más frecuentes y cae a `LESSON_TIPS.grammar` si la
  etiqueta no tiene tip propio.
- **FR-004** Si la sesión tiene una `FeedbackSituation` activa, el reporte
  agrega un bloque de comentario según su `character` (`CHARACTER_COMMENTARY`:
  incident/onboarding/conflict/routine).
- **FR-005** `buildLesson` filtra primero por `isActionableCorrection`; si no
  queda ninguno, retorna `null` sin invocar al LLM.
- **FR-006** La respuesta cruda del LLM para la lección se valida en el borde
  (`validLesson`): no vacía, `<= MAX_LESSON_CHARS` (1200) y sin escritura no
  latina (`hasNonLatinScript`); si falla cualquiera, retorna `null`.
- **FR-007** `composeSessionSummary` usa la lección del LLM si viene no nula;
  si no, cae al tip de la categoría de error dominante (`LESSON_TIPS`), con
  `grammar` como respaldo final.
- **FR-008** `buildLesson` captura cualquier excepción del LLM (`try/catch`) y
  retorna `null` en vez de propagar el error.

## Criterios de éxito
- **SC-001** El 100% de las sesiones sin errores accionables producen un
  reporte/resumen sin sección de tabla de correcciones.
- **SC-002** La lección hablada generada por el LLM, cuando se acepta, está
  siempre en inglés y sin marcado Markdown (contrato validado por
  `validLesson` + el system prompt).
- **SC-003** Ante fallo o timeout del LLM, el aprendiz siempre recibe un
  resumen de sesión (nunca una excepción no controlada), gracias al respaldo
  determinista de `LESSON_TIPS`.
- **SC-004** Ninguna fila de la tabla de reporte contiene un error cuya
  corrección sea textualmente igual al original.
