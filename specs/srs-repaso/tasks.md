# tasks · srs-repaso

Desglose histórico de la implementación (Sprint 4 — Progreso y retención, cerrado).
Todas las tareas están completadas; el detalle de requisitos referencia los FR del spec.

Estado: - [x] T1 · - [x] T2 · - [x] T3 · - [x] T4

| ID | Descripción | Requisitos | Verificación |
|---|---|---|---|
| T1 | Sistema Leitner de 5 cajas: intervalos crecientes y regla de vencimiento (isDue) | FR-001, FR-003 | src/domain/srs/__tests__/leitner.test.ts |
| T2 | reviewCard: sube o resetea la caja de una tarjeta al responder | FR-002 | src/domain/srs/__tests__/srs-card.test.ts |
| T3 | Sesión de repaso: filtra vencidas, ordena por caja y corta al límite diario | FR-004, FR-005 | src/application/srs/__tests__/review-session-use-case.test.ts |
| T4 | Generación de tarjetas desde errores de sesión con deduplicación exacta | FR-006, FR-007, FR-008 | src/application/srs/__tests__/capture-session-errors-use-case.test.ts |
