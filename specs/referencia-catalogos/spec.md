# spec · referencia-catalogos — Catálogos de referencia: errores comunes y banco de frases

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 3 — Práctica guiada
- **Módulos:** `src/domain/reference/reference.ts`, `src/domain/reference/common-error-catalog.ts`,
  `src/domain/reference/phrase-bank-catalog.ts`, `src/domain/reference/__tests__/common-error-catalog.test.ts`,
  `src/domain/reference/__tests__/phrase-bank-catalog.test.ts`, `src/lib/reference-data/common-errors.ts`,
  `src/lib/reference-data/phrase-bank.ts`

## Contexto
El material fuente de EMMA incluye apéndices de referencia estáticos (Apéndice E: errores
comunes con su corrección; Apéndice G: banco de frases por situación laboral). El dominio
`reference` define los tipos puros de estos apéndices y dos funciones de acceso: una que
sugiere errores comunes relevantes a partir de los errores reales de la sesión (para reforzar
la lección posterior), y otra que filtra frases del banco por situación de práctica.

## Historias de usuario
### US-1 — Reforzar la lección con un error común afín al mío
Como aprendiz, quiero que EMMA me muestre errores comunes del Apéndice E relacionados con lo
que yo mismo dije mal en la sesión, para reconocer que mi error es un patrón frecuente y no un
caso aislado.
- **Given** un error de sesión cuyo texto original/corregido comparte una palabra de contenido
  (≥5 letras) con un `CommonError` del catálogo **When** se piden los errores comunes relevantes
  **Then** ese `CommonError` aparece en el resultado.
- **Given** cuatro errores de sesión que coinciden con varios `CommonError` **When** se piden los
  errores comunes relevantes **Then** el resultado nunca supera 3 elementos.
- **Given** un error de sesión sin ninguna palabra de contenido en común con el catálogo **When**
  se piden los errores comunes relevantes **Then** el resultado es un arreglo vacío.

### US-2 — Consultar frases útiles para la situación que estoy practicando
Como aprendiz, quiero ver frases del Apéndice G específicas de la situación laboral que estoy
practicando (standup, code review, incidente, etc.), para tener andamiaje léxico listo antes de
hablar.
- **Given** una situación válida (p. ej. `"standup"`) **When** se piden las frases para esa
  situación **Then** todas las frases devueltas tienen `situation === "standup"` y ninguna de
  otra situación.
- **Given** `situation` es `undefined` (no se ha seleccionado escenario aún) **When** se piden
  las frases **Then** se devuelve un arreglo vacío, sin lanzar error.

## Requisitos funcionales
- **FR-001** `relevantCommonErrors(errors, max = 3)` debe extraer palabras de contenido
  (`/[a-záéíóúñü]{5,}/g`, minúsculas) de `original` y `corrected` de cada `SilentError` y
  compararlas contra las mismas palabras extraídas de `wrong`/`right` de cada `CommonError`.
- **FR-002** `relevantCommonErrors` debe devolver como máximo `max` (default 3) coincidencias,
  preservando el orden de `COMMON_ERRORS`.
- **FR-003** `relevantCommonErrors` debe devolver `[]` cuando el conjunto de palabras de
  contenido de la sesión queda vacío (p. ej. errores sin palabras ≥5 letras) o cuando ninguna
  coincide.
- **FR-004** `phrasesForSituation(situation)` debe devolver `[]` inmediatamente si `situation`
  es `undefined`, sin filtrar `PHRASE_BANK`.
- **FR-005** `phrasesForSituation(situation)` debe devolver únicamente las entradas de
  `PHRASE_BANK` cuyo campo `situation` sea estrictamente igual al parámetro recibido.
- **FR-006** Los tipos `CommonError` y `PhraseBankEntry` (dominio puro, sin IO) deben ser el
  único contrato que consumen los datos estáticos de `src/lib/reference-data/`; ningún caso de
  uso debe importar directamente de `src/lib/reference-data/`.

## Criterios de éxito
- **SC-001** El sugeridor de errores comunes nunca devuelve más de 3 resultados y devuelve `[]`
  cuando no hay coincidencia léxica real, evitando ruido en la lección post-sesión.
- **SC-002** El filtro de banco de frases por situación tiene 0% de fugas cruzadas (ninguna
  frase de otra situación aparece en el resultado).
- **SC-003** El dominio `reference` permanece puro (sin `fetch`/`fs`/React) y typecheck pasa sin
  errores en `src/domain/reference/`.
