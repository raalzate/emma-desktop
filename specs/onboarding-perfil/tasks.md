# tasks · onboarding-perfil

Desglose histórico de la implementación (Sprint 1 — Fundación e inmersión, cerrado).
Todas las tareas están completadas; el detalle de requisitos referencia los FR del spec.

Estado: - [x] T1 · - [x] T2 · - [x] T3 · - [x] T4 · - [x] T5 · - [x] T6

| ID | Descripción | Requisitos | Verificación |
|---|---|---|---|
| T1 | Modelar perfil A1 por defecto y catálogo CEFR en dominio puro | FR-001 | `src/domain/profile/user-profile.ts`, `src/domain/cefr/__tests__/cefr-ladder.test.ts` |
| T2 | Definir tipos de estado de onboarding y pasos con criticidad/skip | FR-002, FR-006 | `src/domain/onboarding/onboarding-state.ts`, `src/domain/onboarding/__tests__/onboarding-state.test.ts` |
| T3 | Implementar caso de uso agéntico: un turno, una llamada LLM, extracción DATA | FR-003, FR-004, FR-005, FR-007 | `src/application/onboarding/agentic-onboarding-use-case.ts`, `src/application/onboarding/__tests__/agentic-onboarding-use-case.test.ts` |
| T4 | Implementar motor de pasos y colector como alternativa al flujo agéntico | FR-006, FR-009 | `src/application/onboarding/onboarding-state-engine-use-case.ts`, `src/application/onboarding/onboarding-step-collector.ts`, `src/application/onboarding/__tests__/onboarding-step-collector.test.ts` |
| T5 | Modelar catálogo de metas y caso de uso de recolección con validación estricta | FR-008 | `src/domain/goals/goal-catalog.ts`, `src/domain/goals/user-goal.ts`, `src/application/goals/collect-goals-use-case.ts` |
| T6 | Cablear página de onboarding en el renderer sobre los casos de uso | FR-001 a FR-009 | `src/app/onboarding/page.tsx`, `pnpm test src/domain/onboarding src/application/onboarding` |
