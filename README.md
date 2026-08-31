# EMMA Desktop

Port de **EMMA** (tutora de inglés conversacional para profesionales de TI) desde
Python/Chainlit a una app de escritorio **Electron + Next.js + TypeScript**, con IA
**local e híbrida**, siguiendo las tecnologías, patrones y configuración del proyecto
`dev-presale` (ProcessFlow Architect).

## Objetivo

Conservar **el 100% de las funcionalidades** de EMMA, reimplementadas con la misma
arquitectura por capas (domain / application / infrastructure / interface) y el
patrón de escalado de IA (router local/remoto) de `dev-presale`.

## Stack (igual que dev-presale)

- **Electron 39** — shell de escritorio. WebGPU habilitado (IA local).
- **Next.js 15 (App Router, `output: 'export'`)** — UI, servida por `electron-serve`
  bajo `app://` en producción y por el dev-server en desarrollo.
- **React 18 + TypeScript 5 + Tailwind 3 + shadcn/Radix** — componentes.
- **IA local: Gemma 4 (`.litertlm`) vía `@litert-lm/core` en el renderer (WebGPU)** —
  reemplaza a `llama-cpp-python`. Modelos descargados a `userData/models/litert`,
  servidos por el protocolo `litert-model://`.
- **IA remota (híbrida, opcional): Gemini / OpenAI / Anthropic** — llaves cifradas
  con `safeStorage` en el proceso main; llamadas por `fetch` (sin SDKs).
- **STT: Whisper vía `@huggingface/transformers`** en el renderer (reemplaza a
  faster-whisper).
- **TTS + karaoke: Web Speech API** (`speechSynthesis` con eventos `boundary` para
  los timings de palabra) — reemplaza a edge-tts.
- **Gramática silenciosa: llamada estructurada a Gemma** (reemplaza al modelo T5).
- **Persistencia: SQLite (`better-sqlite3`)** en el proceso main (perfil, progresión,
  errores, roadmap, resúmenes de sesión), expuesta por IPC.
- **Tests: Vitest.**

## Patrón de IA (escalado local/remoto)

`src/lib/ai/`: `router.ts` (decide motor por tarea), `providers.ts` (local/remote),
`litert-engine.ts` (WebGPU), `remote-settings.ts` (modo local/hybrid/remote).
El dominio depende SOLO del puerto `LlmGenerate` (`src/domain/ai/llm-port.ts`); el
adaptador `src/lib/ai/llm-adapter.ts` lo implementa sobre el router.

## Mapa de funcionalidades (paridad con EMMA)

| Funcionalidad EMMA | Módulo en emma-desktop |
|---|---|
| Onboarding conversacional (6 pasos) | `domain/onboarding`, `application/onboarding` |
| Conversación por turnos con Emma (inmersión) | `domain/chat`, `application/chat` |
| 32 escenarios + roles | `domain/scenarios`, `src/lib/scenarios-data.ts` |
| Situaciones dinámicas (variantes) | `domain/situations`, `src/lib/situations-data.ts` |
| Personalidad configurable | `domain/chat-settings` |
| "Teach me" (fonética + gramática + respuestas) | `domain/english-teacher`, `application/english-teacher` |
| Gramática silenciosa | `application/grammar` |
| Progresión CEFR (A1→C1) | `domain/progression`, `application/progression` |
| Roadmap / pathway / metas | `domain/pathway`, `domain/goals` |
| Reporte "Code Review Lingüístico" | `application/feedback` |
| Sugerencias de respuesta + typeahead | `domain/coaching`, `application/coaching` |
| Traducción bajo demanda | `domain/translation`, `application/translation` |
| Continuidad / resúmenes de sesión | `domain/continuity`, `application/continuity` |
| Notas de voz + karaoke | `interface` (renderer) + Web Speech API |
| Bienvenida personalizada | `domain/welcome`, `application/welcome` |
| Entrada por voz (STT) | `domain/audio`, `application/audio` + Whisper (renderer) |

## Scripts

```bash
npm install
npm run electron-dev     # Next dev + tsc watch + Electron
npm run build            # next export + tsc electron + move-out
npm run electron-build:mac | :win | :linux
npm run test             # vitest
npm run typecheck
```

## Estructura

```
main.ts, preload.ts          # shell Electron (entry + bridge)
main/                        # proceso main: config, window, ipc, schemes, logger, services/
src/app/                     # Next App Router (páginas)
src/components/              # UI React (ui/ shadcn + features)
src/domain/                  # reglas puras (sin React/Electron/IO)
src/application/             # casos de uso (orquestan dominio + puertos inyectados)
src/infrastructure/          # adaptadores (repos SQLite vía IPC, IA)
src/lib/ai/                  # router/providers/engine de IA
```
