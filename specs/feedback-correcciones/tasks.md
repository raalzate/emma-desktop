# tasks · feedback-correcciones

Desglose histórico de la implementación (Sprint 2 — Tutoría y andamiaje, cerrado).
Todas las tareas están completadas; el detalle de requisitos referencia los FR del spec.

Estado: - [x] T1 · - [x] T2 · - [x] T3 · - [x] T4 · - [x] T5

| ID | Descripción | Requisitos | Verificación |
|---|---|---|---|
| T1 | Tablas de dominio del reporte: filtro `isMeaningfulError` y `mostCommon` para patrones | FR-001, FR-002 | `src/domain/feedback/__tests__/feedback-tables.test.ts` |
| T2 | Formateo de la sección de lección del reporte con `LESSON_TIPS` y comentario por `character` | FR-003, FR-004 | `src/domain/feedback/__tests__/feedback-tables.test.ts` |
| T3 | Caso de uso `buildFeedbackReport` que ensambla tabla, patrones y `NO_ERRORS_TEMPLATE` | FR-001, FR-004 | `src/application/feedback/__tests__/build-report-use-case.test.ts` |
| T4 | Caso de uso `buildLesson`: filtro de errores accionables, validación `validLesson` y captura de excepciones | FR-005, FR-006, FR-008 | `src/application/feedback/__tests__/build-lesson-use-case.test.ts` |
| T5 | `composeSessionSummary` con respaldo determinista por error dominante cuando la lección es `null` | FR-007 | `src/domain/feedback/__tests__/session-summary.test.ts` |
