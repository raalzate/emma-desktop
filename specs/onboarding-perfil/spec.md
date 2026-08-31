# spec · onboarding-perfil — Onboarding conversacional y perfil del estudiante

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 1 — Fundación e inmersión
- **Módulos:** `src/domain/onboarding`, `src/domain/profile`, `src/domain/cefr`, `src/domain/goals`, `src/application/onboarding`, `src/application/goals`, `src/app/onboarding`

## Contexto

Antes de practicar, EMMA necesita conocer al estudiante (nombre, rol, stack, años
de experiencia, habilidades a practicar) sin someterlo a un formulario frío. El
onboarding lo resuelve como una charla dirigida por IA (estilo ReAct): un
saludo instantáneo, una pregunta natural por turno y extracción silenciosa de
datos, hasta completar el perfil mínimo. El nivel CEFR nunca se pregunta:
todo estudiante arranca en A1 y sube practicando escenarios.

## Historias de usuario

### US-1 — Primer contacto conversacional
Como estudiante nuevo, quiero que EMMA me salude y me pregunte mis datos
charlando en inglés, para no sentir que lleno un formulario.

- **Given** un perfil recién creado (sin campos) **When** arranca el onboarding
  **Then** se muestra al instante el saludo fijo `INSTANT_GREETING` sin esperar
  al LLM.
- **Given** el estudiante responde "I'm a backend developer with Python and
  AWS" **When** el motor procesa el turno **Then** extrae y persiste `role`,
  `techStack` normalizados (p. ej. "Python, AWS") en un solo intercambio.
- **Given** todos los campos requeridos (`name`, `role`, `techStack`, `skills`)
  ya están completos **When** se evalúa el siguiente turno **Then** el bucle
  se detiene, se emite `buildClosingSummary` y se marca `markCompleted`.

### US-2 — Retomar un onboarding interrumpido
Como estudiante que cerró la app a mitad del onboarding, quiero continuar
donde quedé, para no repetir preguntas ya respondidas.

- **Given** un perfil con `name` ya guardado y `onboardingState: "in_progress"`
  **When** se reinicia el flujo **Then** el saludo es "Welcome back, {name}!
  Let's pick up right where we left off." en vez del saludo inicial.
- **Given** un perfil con pasos ya completados (`onboardingStepLastCompleted`)
  **When** el motor de pasos calcula `remainingSteps` **Then** solo pregunta
  por los pasos posteriores al último completado, en el orden fijo definido en
  `ONBOARDING_STEPS`.

### US-3 — Selección de metas de aprendizaje
Como estudiante, quiero elegir mis metas de aprendizaje de un catálogo
predefinido, para que EMMA priorice escenarios relevantes.

- **Given** el catálogo de metas (`GOAL_CATALOG`) **When** el estudiante
  responde con números o nombres separados por coma **Then** se resuelven a
  nombres canónicos válidos y se persisten reemplazando las metas anteriores.
- **Given** una entrada que no matchea ninguna meta del catálogo **When** se
  valida la selección **Then** se re-pregunta con la lista numerada hasta
  recibir al menos una meta válida.
- **Given** metas ya existentes para el usuario **When** el estudiante envía
  una respuesta vacía **Then** se conservan las metas existentes sin
  modificarlas.

## Requisitos funcionales

- **FR-001** El sistema NO pregunta el nivel de inglés en el onboarding: todo
  perfil nuevo se crea con `englishLevel: "A1"` (`emptyProfile`).
- **FR-002** El onboarding conversacional recolecta exactamente los campos de
  `REQUIRED_FIELDS`: `name`, `role`, `techStack`, `skills`; `yearsInRole` es
  opcional pero se extrae si aparece.
- **FR-003** Cada turno hace UNA sola llamada al LLM que reacciona al último
  intercambio, pregunta por el primer campo faltante (`missingFields`) y
  cierra con una línea `DATA: {json}` no visible al usuario (`parseTurn`).
- **FR-004** El valor extraído se fusiona sobre el contexto previo sin
  degradar datos ya buenos: cadenas de menos de 2 caracteres se descartan
  (`mergeContext`).
- **FR-005** Los valores de `techStack` y `skills` se normalizan a listas
  canónicas: alias conocidos (`python`→`Python`, `js`→`JavaScript`, etc.),
  eliminación de muletillas y deduplicación (`normalizeContext`).
- **FR-006** Solo el paso `name` es crítico (`CRITICAL_STEPS`); el resto de
  los pasos del motor de estados (`age`, `role`, `years_in_role`, `tech_stack`,
  `skills`) admite el comando `skip` (`canSkip`).
- **FR-007** El onboarding se puede retomar: si el perfil existente ya tiene
  `name`, el saludo cambia a un mensaje de bienvenida de regreso en lugar del
  saludo inicial.
- **FR-008** Una meta de aprendizaje solo es válida si su `goalName` existe en
  `GOAL_CATALOG` y su `priorityWeight` coincide exactamente con el peso del
  catálogo (`createUserGoal` lanza error si no).
- **FR-009** Al completar el onboarding se invoca `repo.markCompleted()`
  exactamente una vez, independientemente de si se llegó por el flujo
  agéntico o por el motor de pasos.

## Criterios de éxito

- **SC-001** El saludo inicial se renderiza en menos de un ciclo de evento
  (sin esperar respuesta del LLM), verificable por `INSTANT_GREETING` mostrado
  antes de cualquier llamada `llm(...)`.
- **SC-002** Con las cuatro respuestas de `REQUIRED_FIELDS` dadas en un
  intercambio cada una, el onboarding completa en como máximo `maxTurns` (12
  por defecto) turnos.
- **SC-003** Ningún test de `agentic-onboarding-use-case.test.ts`,
  `onboarding-step-collector.test.ts` u `onboarding-state-engine-use-case.test.ts`
  falla tras cambios en el flujo (regresión cero).
- **SC-004** El catálogo de metas rechaza el 100% de las entradas con
  `priorityWeight` que no coincide con `GOAL_CATALOG`, sin excepción.
