# tasks · ejercicios-gramatica-fonetica

Desglose histórico de la implementación (Sprint 3 — Práctica guiada, cerrado).
Todas las tareas están completadas; el detalle de requisitos referencia los FR del spec.

Estado: - [x] T1 · - [x] T2 · - [x] T3 · - [x] T4 · - [x] T5 · - [x] T6

| ID | Descripción | Requisitos | Verificación |
|---|---|---|---|
| T1 | Evaluación determinista de ejercicios cerrados contra el solucionario | FR-001, FR-002 | src/domain/exercises/__tests__/evaluate-exercise.test.ts |
| T2 | Verificación de pronunciación por alineación de palabras con ASR | FR-003, FR-004 | src/domain/phonetics/__tests__/pronunciation-check.test.ts |
| T3 | Ronda de pares mínimos de fonética con filtrado de pares pronunciables | FR-007 | src/domain/phonetics/__tests__/minimal-pair-drill.test.ts |
| T4 | Corrección gramatical silenciosa vía LLM con prompt de sistema fijo | FR-006 | pnpm typecheck |
| T5 | Caso de uso de dictado y verificación de pronunciación tolerante a fallos | FR-005 | src/application/phonetics/__tests__/check-pronunciation-use-case.test.ts |
| T6 | Retos de producción libre por unidad y avance sobre el curriculum | FR-008 | src/application/challenges/__tests__/complete-challenge-use-case.test.ts |
