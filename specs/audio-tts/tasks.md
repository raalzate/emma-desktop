# tasks · audio-tts

Desglose histórico de la implementación (Sprint 3 — Práctica guiada, cerrado).
Todas las tareas están completadas; el detalle de requisitos referencia los FR del spec.

Estado: - [x] T1 · - [x] T2 · - [x] T3 · - [x] T4 · - [x] T5

| ID | Descripción | Requisitos | Verificación |
|---|---|---|---|
| T1 | Sesión de audio con detección de silencio y auto-envío del turno | FR-001, FR-002, FR-003 | pnpm typecheck |
| T2 | Puerto Transcribe y caso de uso de transcripción tolerante a fallos | FR-004, FR-005 | pnpm typecheck |
| T3 | Adaptador Whisper local como motor de transcripción ASR | SC-001 | pnpm typecheck |
| T4 | Texto locutable sin emojis ni símbolos decorativos para TTS | FR-006, FR-007 | src/domain/tts/__tests__/speakable-text.test.ts |
| T5 | Adaptadores de síntesis de voz Edge-TTS y Web Speech con respaldo | FR-008 | pnpm typecheck |
