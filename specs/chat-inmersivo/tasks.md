# tasks · chat-inmersivo

Desglose histórico de la implementación (Sprint 1 — Fundación e inmersión, cerrado).
Todas las tareas están completadas; el detalle de requisitos referencia los FR del spec.

Estado: - [x] T1 · - [x] T2 · - [x] T3 · - [x] T4 · - [x] T5 · - [x] T6

| ID | Descripción | Requisitos | Verificación |
|---|---|---|---|
| T1 | Construir el prompt de simulación anclado a protopersona, escena y CEFR | FR-001, FR-007, FR-008 | `src/domain/chat/simulation-prompt.ts`, `src/domain/chat/__tests__/simulation-prompt.test.ts` |
| T2 | Plegar historial en un único prompt de texto con capas recientes/antiguas | FR-002 | `src/domain/chat/history-layers.ts`, `src/domain/chat/__tests__/history-layers.test.ts` |
| T3 | Encadenar saneo de respuesta: sanitize, remoción de fuga de identidad, poda de oraciones | FR-003, FR-005 | `src/domain/chat/sanitize-reply.ts`, `src/domain/chat/identity-guard.ts`, `src/domain/chat/chat-brevity.ts`, `src/domain/chat/__tests__/sanitize-reply.test.ts`, `src/domain/chat/__tests__/identity-guard.test.ts` |
| T4 | Implementar el caso de uso de turno de chat con timeout, streaming parcial y recuperación en personaje | FR-004 | `src/application/chat/run-chat-turn-use-case.ts`, `src/application/chat/__tests__/run-chat-turn-use-case.test.ts` |
| T5 | Implementar el caso de uso "Teach me" con cadena de tres secciones, validación de borde y caché | FR-006 | `src/application/english-teacher/teach-use-case.ts`, `src/application/english-teacher/teach-cache.ts`, `src/application/english-teacher/__tests__/teach-use-case.test.ts` |
| T6 | Cablear página de chat en el renderer sobre los casos de uso de turno y andamiaje | FR-001 a FR-008 | `src/app/chat/page.tsx`, `pnpm test src/domain/chat src/application/chat` |
