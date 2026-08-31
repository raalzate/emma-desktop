# tasks · escenarios-situaciones

Desglose histórico de la implementación (Sprint 3 — Práctica guiada, cerrado).
Todas las tareas están completadas; el detalle de requisitos referencia los FR del spec.

Estado: - [x] T1 · - [x] T2 · - [x] T3 · - [x] T4 · - [x] T5 · - [x] T6

| ID | Descripción | Requisitos | Verificación |
|---|---|---|---|
| T1 | Catálogo de escenarios y variantes de situación por nivel CEFR | FR-001, FR-002 | pnpm typecheck |
| T2 | Selector de situación compatible con nivel, stack y exclusiones | FR-003 | pnpm typecheck |
| T3 | Briefing estático de escena por carácter de situación | FR-004, FR-005 | src/domain/situations/__tests__/scene-briefing.test.ts |
| T4 | Caso de uso construir briefing de escena a partir de hechos del LLM | FR-007, FR-008 | src/application/scene/__tests__/build-scene-briefing-use-case.test.ts |
| T5 | Caso de uso crear contrato de escena con validación y fallback determinista | FR-006, FR-007 | src/application/scene/__tests__/create-scene-contract-use-case.test.ts |
| T6 | Pantalla de práctica que consume el contrato de escena antes del kickoff | SC-002 | pnpm build |
