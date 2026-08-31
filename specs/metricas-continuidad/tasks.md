# tasks · metricas-continuidad

Desglose histórico de la implementación (Sprint 4 — Progreso y retención, cerrado).
Todas las tareas están completadas; el detalle de requisitos referencia los FR del spec.

Estado: - [x] T1 · - [x] T2 · - [x] T3 · - [x] T4 · - [x] T5

| ID | Descripción | Requisitos | Verificación |
|---|---|---|---|
| T1 | computeSessionMetrics: latencia mediana, monólogo y densidad de error sin NaN | FR-001, FR-002 | src/domain/progression/__tests__/session-metrics.test.ts |
| T2 | trackSessionMetrics/getMetricsTrend: aislamiento de fallos de repositorio | FR-003, FR-004 | src/application/metrics/__tests__/track-session-metrics-use-case.test.ts |
| T3 | Resumen de continuidad de la simulación inconclusa (sesión, escenario, truncado) | FR-005, FR-006, FR-007 | `pnpm typecheck` (src/application/continuity/build-session-summary-use-case.ts) |
| T4 | Saludo de bienvenida personalizado con andamiaje opcional en español | FR-008 | src/application/welcome/__tests__/welcome-use-case.test.ts |
| T5 | Resolución de voz TTS priorizando género sobre nivel CEFR | FR-009 | `pnpm typecheck` (src/domain/welcome/voice-config.ts) |
