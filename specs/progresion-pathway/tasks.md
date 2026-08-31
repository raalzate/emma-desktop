# tasks · progresion-pathway

Desglose histórico de la implementación (Sprint 4 — Progreso y retención, cerrado).
Todas las tareas están completadas; el detalle de requisitos referencia los FR del spec.

Estado: - [x] T1 · - [x] T2 · - [x] T3 · - [x] T4 · - [x] T5

| ID | Descripción | Requisitos | Verificación |
|---|---|---|---|
| T1 | Escalera CEFR y barra de aprobación por nivel (A1 a C1, fallback B1) | FR-001 | src/domain/cefr/__tests__/cefr-ladder.test.ts |
| T2 | Política de promoción: racha de sesiones aprobadas y umbral de turnos | FR-002, FR-003, FR-004 | src/domain/progression/__tests__/promotion-policy.test.ts |
| T3 | Caso de uso que evalúa y persiste el veredicto de progresión de una sesión | FR-005 | src/application/progression/__tests__/evaluate-progression-use-case.test.ts |
| T4 | Construcción del pathway de escenarios por nivel y su estado de completitud | FR-006 | src/domain/pathway/__tests__/next-scenario-policy.test.ts |
| T5 | Recomendación determinista del siguiente escenario y captura de errores de sesión | FR-007, FR-008 | src/application/pathway/__tests__/recommend-next-scenario-use-case.test.ts, src/application/progression/__tests__/record-session-errors-use-case.test.ts |
