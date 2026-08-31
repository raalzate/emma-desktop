# spec · tutor-coaching — Estado del aprendiz y andamiaje conversacional

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 2 — Tutoría y andamiaje
- **Módulos:** `src/domain/tutor`, `src/domain/coaching`, `src/application/tutor`, `src/application/coaching`

## Contexto
EMMA necesita saber en qué punto del plan de 24 semanas está el aprendiz (unidad
activa, tarjetas SRS vencidas, categorías de error débiles, huecos de checklist
A1-B2) para decidir qué recomendar y para armar su briefing de bienvenida/lección.
Durante la conversación misma, el aprendiz también recibe dos ayudas de coaching:
chips de respuesta sugerida (3 niveles) y autocompletado inline mientras teclea.
Ambas dinámicas se apoyan en el mismo puerto `LlmGenerate` pero mantienen su
lógica de decisión y de prompt en dominio puro, testeable sin IO.

## Historias de usuario

### US-1 — Recibir recomendaciones de práctica basadas en mi estado real
Como aprendiz, quiero que EMMA me recomiende qué practicar según mis tarjetas
vencidas, mis errores frecuentes y mi progreso, para no tener que decidirlo yo.
- **Given** tengo 6 tarjetas SRS vencidas **When** se construye mi `TutorContext`
  **Then** la primera recomendación es de tipo `srs-review` con `due: 6`.
- **Given** mi unidad activa es la 5 y mi categoría de error más frecuente es
  `article` **When** se calculan las recomendaciones **Then** aparece una de tipo
  `exercise` que ataca `article` en la unidad 5, si existe un ejercicio `fill` ahí.
- **Given** no tengo tarjetas vencidas, unidad activa ni errores registrados
  **When** se construye el contexto **Then** las recomendaciones caen al hueco de
  checklist del nivel más bajo incompleto (A1-B2), si existe.

### US-2 — Ver un briefing compacto de mi progreso
Como aprendiz, quiero un resumen breve en español de mi semana, unidad y
debilidades, para orientarme al empezar una sesión.
- **Given** un `TutorContext` con semana 4, unidad activa 5 y 3 tarjetas
  pendientes **When** se genera el briefing **Then** el texto incluye
  "Semana 4 del plan", "Unidad 5" y "3 tarjetas pendientes" separados por " · ".
- **Given** un `TutorContext` sin categorías débiles ni recomendaciones
  **When** se genera el briefing **Then** el texto omite esas líneas sin dejar
  separadores vacíos.

### US-3 — Recibir sugerencias de respuesta y autocompletado mientras escribo
Como aprendiz, quiero chips de respuesta escalonados (easy/mid/advanced) y un
autocompletado tipo Gmail, para no trabarme al responder en inglés.
- **Given** el último turno de EMMA como contexto **When** pido sugerencias
  **Then** recibo hasta 3, ordenadas `easy → mid → advanced`, y cualquiera cuyo
  contenido sea eco del turno de EMMA se descarta (`isEchoOfAgent`).
- **Given** ya tengo un borrador escrito en el composer **When** pido sugerencias
  **Then** el prompt de sistema incluye el apéndice de alineación al borrador y
  las 3 sugerencias deben respetar su intención.
- **Given** estoy tecleando una respuesta parcial y mi nivel es A1
  **When** pido autocompletado **Then** veo la continuación completa sugerida;
  **Given** mi nivel es B1 **Then** veo solo las primeras `HINT_WORDS_ADVANCED`
  (2) palabras de la continuación.

## Requisitos funcionales
- **FR-001** `buildTutorContext` es una función pura (sin IO, sin `Date.now()`):
  toda entrada (nivel, tarjetas, `today`, conteos de error, checklist marcado,
  unidad/escenario activo) llega por argumento.
- **FR-002** La unidad activa se resuelve con prioridad: `activeUnit` explícito
  primero, luego `unitForSession(activeScenarioType, level)`, si no `null`.
- **FR-003** Las categorías de error débiles se ordenan por conteo descendente
  y, en empate, alfabéticamente; se limitan a `WEAK_CATEGORIES_LIMIT` (3).
- **FR-004** `recommendPractice` evalúa reglas en orden fijo de prioridad
  (`srsRule → exerciseRule → minimalPairRule → scenarioRule → checklistRule`)
  y produce hasta `maxRecommendations` (5 por defecto), deteniéndose al llenar
  el cupo.
- **FR-005** La regla `srsRule` solo dispara si `pendingSrsCards >= 5`
  (`SRS_REVIEW_THRESHOLD`).
- **FR-006** `buildTutorBriefing` compone líneas (progreso, debilidad,
  recomendaciones) filtrando las que resultan `null`, sin dejar separadores
  vacíos; es determinista para la misma entrada.
- **FR-007** `suggestReplies` limita el resultado del LLM a 3 ítems, mapea cada
  posición del array a `LEVEL_HINTS` (`easy`, `mid`, `advanced`) y descarta
  cualquier sugerencia clasificada como eco del contexto por `isEchoOfAgent`.
- **FR-008** `hintForLevel` devuelve el sufijo completo para niveles A1/A2 y
  solo las primeras `HINT_WORDS_ADVANCED` palabras (preservando el espacio
  inicial) para B1 en adelante.
- **FR-009** `completePartialReply` devuelve únicamente la continuación tras el
  texto ya tecleado (recorta el prefijo si la propuesta del LLM empieza por
  él); si el LLM no devuelve nada usable, retorna `""`.

## Criterios de éxito
- **SC-001** Dado el mismo `TutorContextInputs`, `buildTutorContext` produce
  siempre el mismo `TutorContext` (determinismo verificado por pruebas
  unitarias en `src/domain/tutor/__tests__`).
- **SC-002** Ninguna recomendación de tipo `exercise` o `minimal-pair` se genera
  si no hay unidad activa (`activeUnit === null`).
- **SC-003** El 100% de las sugerencias de respuesta devueltas al aprendiz
  cumplen `!isEchoOfAgent(text, context)`.
- **SC-004** El briefing generado nunca supera ~120 palabras (regla documentada
  en `buildTutorBriefing`) y siempre es texto plano en español.
