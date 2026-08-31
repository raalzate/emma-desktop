# spec · ejercicios-gramatica-fonetica — Ejercicios, gramática, fonética y retos

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 3 — Práctica guiada
- **Módulos:** `src/domain/exercises/exercise.ts`, `src/domain/exercises/evaluate-exercise.ts`,
  `src/domain/phonetics/pronunciation-check.ts`, `src/domain/phonetics/phonetics.ts`,
  `src/domain/phonetics/minimal-pair-drill.ts`, `src/application/grammar/check-grammar-use-case.ts`,
  `src/application/phonetics/check-pronunciation-use-case.ts`,
  `src/application/challenges/complete-challenge-use-case.ts`, `src/domain/curriculum/*`

## Contexto
El libro fuente (`English-for-Software-Engineers-fuente.md`) organiza cada unidad en pasos
fijos (Practice, Sound, Challenge). EMMA reproduce ese ciclo con corrección **determinista**
donde el libro trae solucionario (ejercicios cerrados, Apéndice I), verificación de
pronunciación por dictado con ASR (Whisper), un chequeo silencioso de gramática por LLM que
nunca interrumpe la conversación, y retos de producción libre que anclan el progreso a las
26 unidades del curriculum.

## Historias de usuario
### US-1 — Corregir ejercicios cerrados sin depender del LLM
Como aprendiz, quiero que mis respuestas a ejercicios de completar/transformar/corregir se
evalúen al instante contra el solucionario del libro, para practicar sin latencia ni consumo
de IA.
- **Given** un `UnitExercise` con 3 ítems y 3 respuestas del usuario **When** se llama
  `gradeExercise` **Then** devuelve `{ total: 3, correct, failedIndexes }` con los índices
  exactos de los ítems fallados.
- **Given** una respuesta con mayúsculas, puntuación final o apóstrofe tipográfico distinto
  al del solucionario **When** se evalúa con `evaluateItem` **Then** se normaliza y se
  considera correcta si coincide con `answer` o alguna de `altAnswers`.
- **Given** un número de respuestas distinto al número de ítems **When** se llama
  `gradeExercise` **Then** lanza un error explícito en vez de evaluar parcialmente.

### US-2 — Practicar pronunciación mediante dictado con ASR
Como aprendiz, quiero grabar mi voz y que EMMA me diga qué palabras no se entendieron, para
usar el ASR como "detector honesto" de errores de pronunciación.
- **Given** un texto objetivo y una transcripción idéntica **When** se llama
  `checkPronunciation` **Then** el `score` es 1 y `missedWords` está vacío.
- **Given** que el ASR omite una palabra intermedia **When** se alinean las palabras
  (`alignWords`) **Then** esa palabra se marca `ok: false, heard: null` sin desalinear el
  resto de la frase.
- **Given** que el motor de transcripción (`Transcribe`) lanza una excepción **When** se
  ejecuta `checkSpokenAttempt` **Then** se degrada a transcripción vacía en vez de romper el
  flujo, y el resultado incluye igualmente `verdicts`/`score`.

### US-3 — Recibir corrección gramatical silenciosa y completar retos
Como aprendiz, quiero que mis errores de gramática se acumulen sin interrumpir la
conversación, y quiero un reto de producción libre por unidad que marque mi avance.
- **Given** una frase con un error gramatical **When** se llama `checkGrammar` con un LLM que
  la corrige **Then** devuelve un `SilentError` con `original`, `corrected` y `label`
  clasificado por `classifyError`.
- **Given** que el LLM responde exactamente `"OK"` o el texto corregido es idéntico al
  original **When** se llama `checkGrammar` **Then** devuelve un arreglo vacío (nada que
  reportar).
- **Given** un escenario con unidad asociada y retos pendientes **When** se llama
  `getSessionChallenge` **Then** devuelve el primer reto no completado de esa unidad, o
  `null` si ya no quedan.

## Requisitos funcionales
- **FR-001** `normalizeAnswer` debe recortar espacios, pasar a minúsculas, colapsar espacios
  internos, quitar puntuación final (`.`, `!`, `?`) y unificar el apóstrofe tipográfico `’` a
  `'` antes de comparar respuestas.
- **FR-002** `evaluateItem` debe considerar correcta una respuesta si su forma normalizada
  coincide con `answer` normalizado o con cualquiera de `altAnswers` normalizados.
- **FR-003** `checkPronunciation` debe lanzar un error si el texto objetivo (`target`) está
  vacío, y calcular `score` como la proporción de palabras objetivo marcadas `ok: true` sobre
  el total de veredictos.
- **FR-004** `isIntelligible(score)` debe devolver `true` únicamente cuando `score >= 0.8`
  (umbral de 4/5 palabras reconocidas).
- **FR-005** `checkSpokenAttempt` debe lanzar un error si `target` está vacío (guard clause
  antes de invocar el ASR), y nunca debe propagar una excepción del puerto `Transcribe`.
- **FR-006** `checkGrammar` debe usar el prompt de sistema fijo `GRAMMAR_SYSTEM_PROMPT`
  (corrección mínima, conservadora, respuesta `OK` si no hay error) y devolver `[]` cuando el
  texto de entrada está vacío, sin llamar al LLM.
- **FR-007** `buildPerceptionRound` debe filtrar pares IPA (que empiezan por `/`) o sin letras
  antes de construir la ronda, y lanzar error si `size <= 0` o si no quedan pares pronunciables.
- **FR-008** `challengeForSession` debe devolver `null` si el escenario no tiene unidad
  asociada (`unitForSession`) o si no quedan retos pendientes en esa unidad; en otro caso
  devuelve el primer reto de `challengesForUnit` ausente en `completed`.

## Criterios de éxito
- **SC-001** Los ejercicios cerrados se corrigen sin ninguna llamada a IA (100% determinista,
  verificado por `evaluate-exercise.test.ts`).
- **SC-002** Un fallo del motor ASR o del LLM de gramática nunca interrumpe el flujo de
  práctica (siempre hay una ruta de degradación validada por pruebas).
- **SC-003** El score de pronunciación clasifica correctamente como "inteligible" solo cuando
  al menos el 80% de las palabras objetivo fueron reconocidas.
- **SC-004** El progreso de retos (`challengeProgress`) refleja exactamente el total de retos
  definidos en `ALL_UNITS` (26 unidades) y el conteo de completados sin duplicados.
