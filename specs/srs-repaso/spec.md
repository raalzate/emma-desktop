# spec · srs-repaso — Repaso espaciado (SRS / Leitner)

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 4 — Progreso y retención
- **Módulos:** `src/domain/srs`, `src/application/srs`

## Contexto
Practicar una vez no fija el aprendizaje: los errores del aprendiz deben volver a
aparecer en intervalos crecientes hasta consolidarse. EMMA implementa un sistema
Leitner de 5 cajas (repaso espaciado, "0.5 del libro") que convierte automáticamente
los errores silenciosos de una sesión de chat en tarjetas de estudio, y decide qué
tarjetas están vencidas cada día sin depender de `Date` (el "día" es un entero
inyectado por el llamador, manteniendo el dominio puro y determinista).

## Historias de usuario

### US-1 — Repasar tarjetas vencidas
Como aprendiz, quiero repasar sólo las tarjetas que ya tocan hoy, para no perder tiempo
revisando contenido que aún no necesita refuerzo.
- **Given** tarjetas en distintas cajas con distintos `lastReviewedDay` **When** se
  inicia una sesión de repaso para el día `today` **Then** sólo se devuelven las
  tarjetas cuyo intervalo de caja ya venció (`isDue`), ordenadas por caja ascendente
  (las más frágiles primero).
- **Given** más tarjetas vencidas que el límite de sesión **When** se inicia la sesión
  **Then** el resultado se corta a `limit` (por defecto 15, "new/day" del libro).
- **Given** una tarjeta en caja 5 revisada hace 10 días **When** se evalúa `isDue` para
  hoy **Then** no está vencida porque el intervalo de caja 5 es 16 días.

### US-2 — Responder una tarjeta y actualizar su caja
Como aprendiz, quiero que acertar o fallar una tarjeta cambie cuándo vuelvo a verla,
para que el sistema concentre la repetición donde más la necesito.
- **Given** una tarjeta en caja 3 **When** se responde correctamente **Then** sube a
  caja 4 y su `lastReviewedDay` se actualiza a hoy.
- **Given** una tarjeta en caja 5 (tope) **When** se responde correctamente **Then**
  permanece en caja 5 (no hay caja 6).
- **Given** una tarjeta en cualquier caja **When** se responde incorrectamente **Then**
  cae a caja 1, sin importar en qué caja estaba.

### US-3 — Generar tarjetas a partir de errores de sesión
Como aprendiz, quiero que mis errores de una conversación se conviertan automáticamente
en material de repaso, para no tener que crear tarjetas manualmente.
- **Given** el buffer de errores silenciosos de una sesión terminada **When** se
  capturan los errores **Then** cada error genera una tarjeta `sentence-production` en
  caja 1, con `front` pidiendo corregir el original y `back` con la versión corregida.
- **Given** dos errores con el mismo par original/corregido **When** se generan las
  tarjetas **Then** sólo se crea una tarjeta (deduplicación exacta por par).
- **Given** tarjetas nuevas que ya existen por `id` en el repositorio **When** se
  agregan (`addCards`) **Then** no se duplican y el resultado reporta cuántas se
  añadieron realmente.

## Requisitos funcionales
- **FR-001** El sistema define 5 cajas Leitner (1-5) con intervalos crecientes en días:
  1→1, 2→2, 3→4, 4→8, 5→16 (`BOX_INTERVALS_DAYS`).
- **FR-002** `reviewCard` sube la tarjeta una caja al acertar (tope caja 5) y la resetea
  a caja 1 al fallar; siempre actualiza `lastReviewedDay` al día inyectado.
- **FR-003** `isDue` marca una tarjeta como vencida cuando `today - lastReviewedDay >=`
  el intervalo de su caja actual.
- **FR-004** `startReviewSession` filtra tarjetas vencidas, las ordena por caja
  ascendente y corta al límite (`DEFAULT_SESSION_LIMIT = 15`).
- **FR-005** `answerCard` lanza error si el `cardId` no existe en el repositorio antes
  de aplicar el resultado del repaso.
- **FR-006** `buildCardsFromErrors` deduplica por la combinación exacta
  `${original} ${corrected}`, generando tarjetas `sentence-production` en caja 1 con el
  día de creación como `lastReviewedDay`.
- **FR-007** `buildCardFromChunk` genera una tarjeta `chunk-cloze` ocultando la palabra
  más larga del chunk con `"___"` y usando la función/traducción en español como pista.
- **FR-008** `captureSessionErrors` orquesta `buildCardsFromErrors` + `addCards`: genera
  tarjetas desde los errores de la sesión y las persiste sin duplicar ids existentes,
  devolviendo la cantidad efectivamente añadida.

## Criterios de éxito
- **SC-001** Ninguna tarjeta supera la caja 5 ni desciende de la caja 1, sin importar la
  secuencia de aciertos/fallos.
- **SC-002** Una sesión de repaso nunca devuelve más tarjetas que el límite configurado,
  incluso cuando hay más vencidas disponibles.
- **SC-003** La generación de tarjetas desde errores de sesión es idempotente respecto a
  duplicados: repetir el mismo par original/corregido nunca produce dos tarjetas.
