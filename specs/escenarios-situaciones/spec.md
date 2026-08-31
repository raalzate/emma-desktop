# spec · escenarios-situaciones — Escenarios y role-play situacional

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 3 — Práctica guiada
- **Módulos:** `src/domain/scenarios/scenario.ts`, `src/domain/scenarios/scenario-catalog.ts`,
  `src/domain/situations/scene-briefing.ts`, `src/domain/situations/situations-catalog.ts`,
  `src/domain/situations/situation-variant.ts`, `src/domain/situations/situation-selector.ts`,
  `src/application/scene/build-scene-briefing-use-case.ts`,
  `src/application/scene/create-scene-contract-use-case.ts`, `src/app/practice/page.tsx`

## Contexto
EMMA practica inglés con role-play situado: cada `Scenario` (p. ej. "Daily Standup") tiene
varias `SituationVariant` (encuadres concretos, con tono/urgencia distinto) filtradas por
nivel CEFR y stack técnico del aprendiz. Antes del kickoff se genera un `SceneContract`
(hechos fijos en inglés + narrativa en español) para que el guardrail del LLM y la antesala
que lee el aprendiz compartan el mismo mundo (BUG-001). Si el LLM falla, el sistema cae a un
contrato determinista basado en el catálogo estático, para que el botón de comenzar nunca
quede bloqueado.

## Historias de usuario
### US-1 — Elegir escenario y situación compatibles con mi nivel
Como aprendiz, quiero que EMMA me proponga solo escenarios/situaciones acordes a mi nivel CEFR
y mi stack, para no enfrentarme a un role-play fuera de mi alcance.
- **Given** un nivel `B1` y escenario `daily_standup` **When** se piden situaciones para ese nivel
  **Then** solo se devuelven variantes cuyo `cefrLevels` incluye `B1` y que no están `retired`.
- **Given** una variante con `stackHints` vacío **When** se evalúa compatibilidad con cualquier
  stack **Then** se considera compatible (sin restricción de stack).
- **Given** una lista de variantes ya vistas (`exclude`) **When** se selecciona la siguiente
  situación **Then** el selector nunca devuelve un id presente en `exclude`.

### US-2 — Recibir una antesala inmersiva y coherente antes de empezar
Como aprendiz, quiero leer en español una mini-historia concreta de la escena antes de
empezar a hablar en inglés, para entrar en contexto sin salir de la inmersión de la práctica.
- **Given** un escenario y una situación con `framingDescription` **When** se construye el
  `SceneContract` con un LLM disponible **Then** la narrativa en español se genera a partir de
  los MISMOS hechos que reciben el guardrail del LLM (mismo contrato en ambos lados).
- **Given** que el LLM responde con hechos inválidos (script no latino, más de 5 líneas, líneas
  fuera de 3–120 caracteres) **When** se crea el contrato **Then** se usa el `framingDescription`
  del catálogo como contrato determinista y no se genera narrativa.
- **Given** que el LLM lanza una excepción **When** se crea el contrato **Then** se devuelve
  `{ facts: framingDescription, narrative: null }` sin propagar el error.

### US-3 — Ver un briefing estático de respaldo con andamiaje en español
Como aprendiz, quiero que el carácter de la situación (rutina, incidente, conflicto,
onboarding) determine el tono de la introducción, para orientarme antes de leer la misión en
inglés.
- **Given** una situación con `character: "incident"` **When** se construye el briefing estático
  **Then** el texto de ambientación (`hypothetical`) refleja urgencia/tensión, en español.
- **Given** un `framingDescription` con dos oraciones en inglés **When** se construye el briefing
  **Then** `missionLines` contiene exactamente esas dos oraciones, intactas (sin traducir).
- **Given** un `framingDescription` vacío **When** se construye el briefing **Then**
  `missionLines` es un arreglo vacío y no se lanza ningún error.

## Requisitos funcionales
- **FR-001** `scenariosForLevel(level)` debe devolver solo escenarios cuyo `cefrRange` (rango
  contiguo por índice en `CEFR_LADDER`) incluya el nivel dado, inclusive en ambos extremos.
- **FR-002** `situationsFor(scenarioType)` debe devolver todas las variantes de ese escenario,
  incluidas las `retired`; el filtrado de activas es responsabilidad del selector, no del
  catálogo.
- **FR-003** `selectSituation` debe excluir variantes `retired`, variantes cuyo `cefrLevels` no
  contenga el nivel pedido, variantes cuyo `stackHints` no esté vacío y no contenga el stack
  pedido, y cualquier id en `exclude`; debe devolver `null` si el pool resultante queda vacío.
- **FR-004** `buildSceneBriefing` debe mapear cada `SituationCharacter` (`routine`, `incident`,
  `conflict`, `onboarding`) a un texto de ambientación distinto en español, vía tabla fija
  `HYPOTHETICAL_BY_CHARACTER`.
- **FR-005** `buildSceneBriefing` debe partir `framingDescription` en oraciones (`splitSentences`)
  para `missionLines`, sin traducir ni alterar el texto en inglés.
- **FR-006** `createSceneContract` debe validar la salida cruda del LLM (`validFacts`): rechazar
  vacío, texto con script no latino, más de 5 líneas o alguna línea fuera de 3–120 caracteres;
  si es inválida, usar `situation.framingDescription` como hechos.
- **FR-007** Cuando los hechos se generan con éxito, `createSceneContract` debe pasar esos mismos
  hechos (`facts`) a `buildImmersiveBriefing` para que la narrativa se derive de ellos, no del
  framing estático.
- **FR-008** `buildImmersiveBriefing` debe validar la narrativa cruda (`validNarrative`):
  rechazar vacío y texto de más de 600 caracteres, devolviendo `narrative: null` en esos casos
  o si el LLM lanza una excepción.

## Criterios de éxito
- **SC-001** El 100% de las situaciones ofrecidas al aprendiz cumplen nivel CEFR y compatibilidad
  de stack (cero falsos positivos verificados por `situation-selector`).
- **SC-002** El botón de comenzar la escena nunca queda bloqueado por fallo del LLM: siempre hay
  un contrato determinista disponible (framing del catálogo).
- **SC-003** La narrativa en español y el guardrail en inglés del LLM comparten siempre el mismo
  conjunto de hechos cuando la generación tiene éxito (paridad de contrato, BUG-001 cerrado).
- **SC-004** Cada uno de los 4 caracteres de situación produce un texto de ambientación único
  (cobertura verificada en `scene-briefing.test.ts`).
