# tasks · tutor-coaching

Desglose histórico de la implementación (Sprint 2 — Tutoría y andamiaje, cerrado).
Todas las tareas están completadas; el detalle de requisitos referencia los FR del spec.

Estado: - [x] T1 · - [x] T2 · - [x] T3 · - [x] T4 · - [x] T5 · - [x] T6

| ID | Descripción | Requisitos | Verificación |
|---|---|---|---|
| T1 | Modelar `TutorContext` puro: resolución de unidad activa y ranking de categorías débiles | FR-001, FR-002, FR-003 | `src/domain/tutor/__tests__/tutor-context.test.ts` |
| T2 | Implementar `recommendPractice` con reglas priorizadas y tope de recomendaciones | FR-004, FR-005 | `src/domain/tutor/__tests__/practice-recommender.test.ts` |
| T3 | Componer `buildTutorBriefing` filtrando líneas nulas sin separadores vacíos | FR-006 | `src/domain/tutor/__tests__/tutor-context.test.ts` |
| T4 | Caso de uso `getTutorContext` que inyecta repos/puertos y arma el `TutorContext` | FR-001, FR-002 | `src/application/tutor/__tests__/get-tutor-context-use-case.test.ts` |
| T5 | Dominio de sugerencias de respuesta: `suggestReplies`, `hintForLevel`, filtro de eco | FR-007, FR-008 | `src/domain/coaching/__tests__/reply-suggestion.test.ts`, `src/application/coaching/__tests__/suggest-replies-use-case.test.ts` |
| T6 | Caso de uso `completePartialReply` para autocompletado tipo Gmail sobre el borrador | FR-009 | `src/application/coaching/__tests__/complete-partial-reply-use-case.test.ts` |
