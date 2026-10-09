# Arquitectura — EMMA Desktop

Arquitectura **por capas + hexagonal (puertos y adaptadores)**. Objetivo:
dominio testeable sin IO, IA intercambiable (local/nube) y comportamiento
estable fijado por pruebas.

> EMMA Desktop nació como reescritura de un prototipo anterior de la misma
> tutora. Ese prototipo no forma parte de este repo y no está disponible para
> contrastar nada: el comportamiento vigente es el que fijan las pruebas de
> `pnpm test`, no el recuerdo de aquella versión.

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
- `src/domain/profile/i-profile-level-repository.ts` → `IProfileLevelRepository`
  (`setEnglishLevel`): escribe `profile.englishLevel`, la fuente de verdad del nivel
  que lee toda la app. Adaptador: `src/infrastructure/persistence/profile-repository.ts`.
- `src/domain/chat/i-chat-history-repository.ts` → `IChatHistoryRepository`
  (`list`/`save`/`remove`/`rename`): historial de conversaciones. Adaptador:
  `src/infrastructure/persistence/chat-history-repository.ts`.
- Gamificación (#216) → `src/domain/gamification/i-gamification-repository.ts`.
  Sólo se persisten eventos de XP (colección `gamification`); nivel de jugador,
  racha diaria, meta del día y logros se derivan en el dominio. El renderer
  otorga XP por una sola puerta (`components/gamification/award-activity.ts`),
  que anuncia el premio con el evento de ventana `emma:xp-awarded`: la capa de
  celebración y la tarjeta de la barra lateral lo escuchan sin store global.

El perfil de nivel y el historial se cablean en `src/interface/di/repositories.ts`
(`profileLevel`, `chatHistory`).

**Inyección:** los casos de uso reciben el puerto por argumento, nunca lo importan
concreto. Ejemplo canónico: `application/english-teacher/teach-use-case.ts`
recibe `llm: LlmGenerate` en `TeachArgs`.

## Patrón de IA (escalado local/remoto)

`src/lib/ai/`: `router.ts` (motor por tarea), `providers.ts` (local/remoto),
`litert-engine.ts` (WebGPU), `remote-settings.ts` (modo local/hybrid/remote).
El dominio solo ve `LlmGenerate`. Cada llamada respeta su presupuesto de tokens
(`domain/shared/token-budgets.ts`).

## Niveles: CEFR por dentro, «Level 1–5» por fuera

La escala CEFR (A1…C1) sigue siendo el modelo interno: tipos, reglas de
progresión, prompts al LLM y claves del almacén. La UI **nunca** la muestra:
pinta «Level N» con `levelLabel`/`levelNumber` de `src/domain/cefr/cefr-ladder.ts`.
Freno: `src/components/__tests__/niveles-propios.test.ts` (falla si un código CEFR
o la palabra CEFR aparece en texto visible).

## Cierre de sesión y promoción

Al terminar una simulación (`src/components/chat/use-end-session.ts`, que usa
`src/components/chat/use-finish-session.ts`):

1. `EmmaRuntime.finishSession` corrige, enseña, deja repaso, mide y recomienda
   (en secuencia; ningún guardado bloquea el cierre) y devuelve cuántas
   correcciones reportables hubo.
2. `EvaluateProgressionUseCase` actualiza racha y nivel en `progression`. **Si
   promueve**, escribe el nivel nuevo en el perfil (`IProfileLevelRepository`) y
   archiva las conversaciones del nivel superado con
   `src/application/chat/archive-history-on-level-up-use-case.ts`
   (`IChatHistoryRepository`). La barra lateral las muestra en «Archived»,
   agrupadas por nivel y de solo lectura.
3. `closingPlanFor` (`src/domain/lessons/closing-plan.ts`, puro) decide el
   cierre: con correcciones, las lecciones de remediación se **asignan solas**
   con `assignSessionLessons` (idempotente por conversación) y el diálogo lleva a
   «My lessons»; sin correcciones, pregunta «Practice again» o «Continue».

La autoevaluación (checklists de «can-do») se retiró: no influía en el nivel.

## Movimiento (animaciones)

Las prácticas y la lista de lecciones animan con `motion` **solo** a través de
`src/components/motion/` (envoltorios + presets, cada uno con su variante reducida
para `prefers-reduced-motion`). Freno:
`src/components/__tests__/movimiento-centralizado.test.ts` (falla si un componente
animado importa `motion/react` directo).

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
