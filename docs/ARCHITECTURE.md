# Arquitectura — EMMA Desktop

Arquitectura **por capas + hexagonal (puertos y adaptadores)**. Objetivo:
dominio testeable sin IO, IA intercambiable (local/nube), paridad con EMMA (Python).

## Regla de dependencias

Las dependencias apuntan **hacia adentro**. Una capa nunca importa de una capa
más externa.

```
┌─────────────────────────────────────────────────────────┐
│ interface / components   (React, Electron renderer, IPC) │  ← más externa
│  ┌────────────────────────────────────────────────────┐ │
│  │ infrastructure   (store JSON vía IPC, adaptadores IA)│ │
│  │  ┌───────────────────────────────────────────────┐ │ │
│  │  │ application   (casos de uso; orquestación)     │ │ │
│  │  │  ┌──────────────────────────────────────────┐ │ │ │
│  │  │  │ domain   (reglas puras, puertos, tipos)  │ │ │ │  ← más interna
│  │  │  └──────────────────────────────────────────┘ │ │ │
│  │  └───────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

| Capa | Ruta | Puede importar de | Prohibido |
|---|---|---|---|
| domain | `src/domain/` | solo `domain` | React, Electron, `fetch`, `fs`, IO, SDKs |
| application | `src/application/` | `domain` | React, Electron, IO directo (usa puertos) |
| infrastructure | `src/infrastructure/`, `src/lib/ai/` | `domain`, `application` | acoplar UI |
| interface | `src/interface/`, `src/components/`, `src/app/` | todas | poner reglas de negocio aquí |

### Excepción: catálogos de dominio sobre datos estáticos

Un módulo de `domain` puede importar **datos estáticos** de los módulos `*-data` de `src/lib/`
(`scenario-catalog` → `scenarios-data`, `unit-catalog` → `curriculum-data`,
`scene-state` → `scene-checklists`). Condiciones: el archivo de `lib` contiene
solo literales —sin IO, sin React, sin adaptadores— y lo único que importa de
vuelta del dominio es `import type`, que se borra al compilar. Por eso el ciclo
aparente `scene-state ↔ scene-checklists` no existe en tiempo de ejecución.

## Puertos (interfaces del dominio)

El dominio define **puertos** (interfaces); afuera viven los **adaptadores**.

- `src/domain/ai/llm-port.ts` → `LlmGenerate`, `TtsResult`, `WordTiming`.
  Adaptador: `src/lib/ai/llm-adapter.ts` sobre `router.ts` (decide local/remoto).
- Repos de persistencia (perfil, progresión, errores…) → interfaz en `domain`,
  adaptador en `infrastructure/persistence` sobre el store JSON del main vía IPC
  (`store-client.ts` → handlers `store-get`/`store-set`).

**Inyección:** los casos de uso reciben el puerto por argumento, nunca lo importan
concreto. Ejemplo canónico: `application/english-teacher/teach-use-case.ts`
recibe `llm: LlmGenerate` en `TeachArgs`.

## Patrón de IA (escalado local/remoto)

`src/lib/ai/`: `router.ts` (motor por tarea), `providers.ts` (local/remoto),
`litert-engine.ts` (WebGPU), `remote-settings.ts` (modo local/hybrid/remote).
El dominio solo ve `LlmGenerate`. Cada llamada respeta su presupuesto de tokens
(`domain/shared/token-budgets.ts`).

## Procesos Electron

- **main** (`main.ts`, `main/`): ventana, config, IPC, esquemas, logger,
  servicios. Llaves de nube cifradas con `safeStorage`. La persistencia vive aquí:
  store JSON por colección (`main/services/store.ts`, un documento por colección
  bajo `userData/emma/store/`, escritura atómica) — reemplaza a SQLite.
- **preload** (`preload.ts`): puente IPC tipado (contextBridge).
- **renderer** (Next.js): UI, IA local WebGPU, STT (Whisper), TTS (Web Speech).

## Dónde va cada cosa

- ¿Regla que no necesita IO ni framework? → `domain`.
- ¿Orquesta varias reglas + un puerto? → `application` (caso de uso).
- ¿Habla con el store, red, disco o un SDK? → `infrastructure` (adaptador de un puerto).
- ¿Es React/Electron/IPC? → `interface` / `components` / `main`.

Si dudas, empújalo hacia adentro (más puro) y saca el IO a un puerto.
