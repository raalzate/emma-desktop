# tasks · motor-ia-local

Desglose histórico de la implementación (Sprint 1 — Fundación e inmersión, cerrado).
Todas las tareas están completadas; el detalle de requisitos referencia los FR del spec.

Estado: - [x] T1 · - [x] T2 · - [x] T3 · - [x] T4 · - [x] T5

| ID | Descripción | Requisitos | Verificación |
|---|---|---|---|
| T1 | Definir el puerto `LlmGenerate` como único contrato consumido por domain/application | FR-001 | `src/domain/ai/llm-port.ts` |
| T2 | Implementar el motor local LiteRT-LM con ciclo de vida de engine y conversación con `close()` en `finally` | FR-005, FR-006 | `src/lib/ai/litert-engine.ts`, `src/lib/ai/__tests__/litert-config.test.ts` |
| T3 | Implementar el router de decisión local/remoto según tier, tamaño y modo forzado | FR-002, FR-003, FR-004 | `src/lib/ai/router.ts` |
| T4 | Implementar proveedores remotos y disponibilidad de IA con reapunte a modelo descargado | FR-007 | `src/lib/ai/providers.ts`, `src/lib/ai/ai-readiness.ts` |
| T5 | Persistir ajustes de modo/proveedor sin guardar llaves en localStorage, con saneo defensivo | FR-008 | `src/lib/ai/remote-settings.ts`, `pnpm test src/lib/ai` |
