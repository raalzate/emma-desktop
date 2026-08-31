# tasks · traduccion-andamiaje

Desglose histórico de la implementación (Sprint 2 — Tutoría y andamiaje, cerrado).
Todas las tareas están completadas; el detalle de requisitos referencia los FR del spec.

Estado: - [x] T1 · - [x] T2 · - [x] T3 · - [x] T4

| ID | Descripción | Requisitos | Verificación |
|---|---|---|---|
| T1 | Dominio de idiomas soportados: `isSupported` y `resolveLanguageName` con respaldo por código | FR-001, FR-002 | `src/domain/translation/__tests__/supported-language.test.ts` |
| T2 | Prompt de traducción: `buildUserPrompt` y `SYSTEM_PROMPT` verbatim del original Python | FR-003, FR-004 | `src/domain/translation/__tests__/translation-prompt.test.ts` |
| T3 | `pairLines`: re-emparejado tolerante a blancos extra y líneas sueltas sin perder contenido | FR-005 | `src/domain/translation/__tests__/translation-prompt.test.ts` |
| T4 | Caso de uso `translate`: try/catch con retorno `{ pairs: [] }` y presupuesto `TRANSLATION_MAX_TOKENS` | FR-006, FR-007 | `src/application/translation/__tests__/translate-use-case.test.ts` |
