# spec · progresion-pathway — Progresión CEFR y ruta de aprendizaje

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 4 — Progreso y retención
- **Módulos:** `src/domain/progression`, `src/domain/pathway`, `src/domain/cefr`,
  `src/application/progression`, `src/application/pathway`, `src/app/progress`

## Contexto
EMMA necesita decidir, sesión a sesión, si un aprendiz ya domina su nivel CEFR actual
y qué escenario practicar después. Sin una regla objetiva, la promoción de nivel sería
arbitraria y la recomendación de práctica no reflejaría ni los errores recurrentes del
aprendiz ni el plan de estudio de 24 semanas. Este feature calcula el veredicto de cada
sesión, mantiene una racha de aprobaciones para promover A1→C1, y arma tanto el pathway
(escenarios por nivel) como la recomendación del siguiente escenario a practicar.

## Historias de usuario

### US-1 — Promoción de nivel CEFR
Como aprendiz, quiero que EMMA detecte cuando ya domino mi nivel actual, para avanzar
al siguiente sin depender de que un humano lo evalúe.
- **Given** un aprendiz en B1 con racha de 2 sesiones aprobadas **When** completa una
  tercera sesión con `errorsPerTurn <= 0.25` y al menos 5 turnos **Then** el sistema lo
  promueve a B2 y reinicia la racha a 0.
- **Given** un aprendiz en A1 **When** cierra una sesión con menos de 5 turnos **Then**
  la sesión no cuenta para la racha (ni la rompe ni la aprueba).
- **Given** un aprendiz en C1 con racha de 3 **When** se evalúa `nextLevel("C1")`
  **Then** no hay promoción posible (tope de la escalera) y el nivel se mantiene C1.

### US-2 — Pathway de escenarios por nivel
Como aprendiz, quiero ver qué escenarios me faltan para completar mi nivel CEFR, para
saber cuánto me falta y en qué orden practicar.
- **Given** un nivel CEFR con escenarios en catálogo **When** se construye el pathway
  del usuario **Then** cada escenario aparece con su estado (PENDING o PASSED) según lo
  persistido, sin duplicar ni omitir ninguno del catálogo.
- **Given** un pathway con todos los items en estado PASSED **When** se evalúa
  `isPathwayComplete` **Then** devuelve `true` sólo si además el pathway tiene al menos
  un item (un pathway vacío nunca se considera completo).

### US-3 — Recomendación del siguiente escenario
Como aprendiz, quiero que EMMA me sugiera qué escenario practicar después, para no
tener que elegir a ciegas entre docenas de opciones.
- **Given** un pathway con items pendientes y un error recurrente mapeado a un
  `scenarioType` concreto **When** se pide la recomendación **Then** ese escenario gana
  por `ERROR_FOCUS` sobre cualquier otro candidato con menor puntaje.
- **Given** ningún item pendiente coincide con metas, plan de 24 semanas ni error
  recurrente **When** se pide la recomendación **Then** se elige el primer item
  pendiente en orden de catálogo (`CATALOG_ORDER`), determinista.
- **Given** un pathway sin items pendientes **When** se pide la recomendación **Then**
  el resultado es `null`.

## Requisitos funcionales
- **FR-001** El sistema calcula `errorsPerTurn = errors / turns` (0 si `turns` es 0) y
  compara contra la barra de aprobación del nivel (`passBar`), que se endurece de 0.45
  en A1 a 0.12 en C1; niveles desconocidos usan la barra B1 (0.25) como fallback.
- **FR-002** Una sesión sólo cuenta para la racha de promoción si tiene al menos
  `MIN_TURNS_TO_COUNT = 5` turnos (`isPass`).
- **FR-003** La racha se reinicia a 0 en cualquier sesión que no aprueba; se incrementa
  en 1 en cada sesión aprobada.
- **FR-004** Al alcanzar `PROMOTION_STREAK = 3` sesiones aprobadas consecutivas, el
  sistema promueve al siguiente nivel CEFR (`nextLevel`) y reinicia la racha a 0; en el
  nivel tope (C1) no hay promoción y el nivel se mantiene.
- **FR-005** `EvaluateProgressionUseCase` persiste el nuevo estado (nivel + racha) vía
  `IProgressionRepository.upsert` y devuelve `{ promoted, oldLevel, newLevel, streak }`.
- **FR-006** `BuildPathwayUseCase` compone el pathway de un usuario cruzando el catálogo
  de escenarios del nivel CEFR (`scenariosForLevel`) con los estados guardados
  (`IPathwayRepository.getStatuses`); todo escenario sin estado guardado inicia PENDING.
- **FR-007** `recommendNext` puntúa cada item pendiente con boosts acumulables:
  `ERROR_BOOST=2` si coincide con el error recurrente mapeado, `PLAN_BOOST=2` si
  coincide con las unidades de la semana actual del plan de 24 semanas, `GOAL_BOOST=1`
  si coincide con una meta del aprendiz; empates de score se resuelven por el primer
  item en orden de catálogo.
- **FR-008** `RecordSessionErrorsUseCase` es no-op cuando el buffer de errores de la
  sesión está vacío; en otro caso colapsa los errores por categoría
  (`statsFromErrors`) y los agrega vía `IErrorStatsRepository.record`.

## Criterios de éxito
- **SC-001** Ninguna sesión con menos de 5 turnos altera la racha de promoción de un
  aprendiz (verificado por `promotion-policy.test.ts`).
- **SC-002** La barra de aprobación decrece monótonamente de A1 (0.45) a C1 (0.12),
  garantizando que niveles avanzados exigen menos errores por turno.
- **SC-003** `isPathwayComplete` nunca reporta `true` para un pathway sin items
  (invariante cubierta por pruebas de `src/domain/pathway`).
- **SC-004** La recomendación de próximo escenario es determinista: para el mismo
  pathway, metas y error recurrente, siempre devuelve el mismo `scenarioType`.
