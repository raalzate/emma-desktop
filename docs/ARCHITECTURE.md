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

- `src/domain/audio/i-audio-store.ts` → `IAudioStore` (`save`/`load`/`remove`/
  `removeByConversation`/`removeAll`/`list`/`usage`): el audio guardado del repaso
  (#281). El binario **no** viaja por el store JSON. Adaptador:
  `src/infrastructure/audio/ipc-audio-store.ts` sobre los canales `audio-clip-*` del
  main, con la respuesta validada con Zod también a la vuelta.
- `src/domain/setup/i-setup-probe.ts` → `ISetupProbe` (`probeVoice`/`probeAi`/
  `probeMic`, cada una con su `AbortSignal`): el chequeo de setup mide con las MISMAS
  piezas que usa la práctica. Adaptador: `src/infrastructure/setup/browser-setup-probe.ts`
  (nunca abre el micrófono: el permiso lo consulta el main con `systemPreferences`).
- `src/domain/setup/i-setup-check-repository.ts` → `ISetupCheckRepository`
  (`last`/`history`/`append`/`acknowledgeLast`): historial del chequeo (colección
  `setupChecks`, tope de 20, sólo mediciones y diagnósticos). Adaptador:
  `src/infrastructure/persistence/setup-check-repository.ts`.

El perfil de nivel y el historial se cablean en `src/interface/di/repositories.ts`
(`profileLevel`, `chatHistory`). El audio y el chequeo se exponen a la UI por dos
fachadas que atan casos de uso y puertos: `src/interface/audio-facade.ts` (con una
cola para las escrituras de tarjetas: el store JSON es leer-modificar-escribir) y
`src/interface/setup-facade.ts` (`run`/`needsFirstRun`/`acknowledge`).

**Inyección:** los casos de uso reciben el puerto por argumento, nunca lo importan
concreto. Ejemplo canónico: `application/english-teacher/teach-use-case.ts`
recibe `llm: LlmGenerate` en `TeachArgs`.

## Patrón de IA (escalado local/remoto)

`src/lib/ai/`: `router.ts` (motor por tarea), `providers.ts` (local/remoto),
`litert-engine.ts` (WebGPU), `remote-settings.ts` (modo local/hybrid/remote).
El dominio solo ve `LlmGenerate`. Cada llamada respeta su presupuesto de tokens
(`domain/shared/token-budgets.ts`).

**Puerta de IA y equipos modestos (#261):** `src/interface/ai-gate.tsx` bloquea la
app hasta que hay motor, y ofrece los dos caminos: descargar Gemma (por defecto)
o pegar una llave de Gemini (`src/components/settings/cloud-quick-setup.tsx`, modo
`remote`). `src/lib/ai/device-probe.ts` mide WebGPU y RAM y
`src/domain/ai/engine-recommendation.ts` decide el orden: sin WebGPU o con menos RAM
que el modelo más liviano, la nube va primero. En el main,
`main/services/ai-remote-http.ts` (puro) arma las peticiones —llave de Gemini en
`x-goog-api-key`, nunca en la URL—, verifica la llave listando modelos antes de
cifrarla, reintenta 429/5xx con espera creciente y valida con Zod la entrada del IPC.

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

## Audio guardado y chequeo de setup (#281)

**Árbol de providers** (`src/interface/app-providers.tsx`), de afuera hacia adentro:

```
MotionProvider
└─ EmmaProvider            runtime, perfil, repos
   ├─ AiGate               bloquea hasta que hay motor de IA (local o nube)
   │  └─ SetupCheckGate    primer arranque: chequeo de voz, IA y micrófono
   │     └─ children       onboarding / app
   ├─ SetupIssueListener   fallos en vivo → sugiere el chequeo (máx. 1 cada 10 min)
   ├─ Toaster
   └─ CelebrationLayer
```

`SetupCheckGate` vive **dentro** de `AiGate` (siempre hay un motor que probar) y
devuelve `null` hasta que el runtime está listo, para no montar el onboarding ni
calentar la voz mientras la sonda mide. Corre sólo si no hay un chequeo reconocido
(`needsFirstRunCheck`); un perfil con el onboarding completo o un historial ilegible
no bloquean. Veredicto `blocked` ⇒ sin botón para seguir; `warn` ⇒ «Continue anyway».
Durante la práctica, `use-karaoke.ts` reporta la caída a la voz del sistema por el bus
`emma:setup-issue` (`src/interface/live-failure-bus.ts`).

**Almacén de audio en el main** (`main/services/audio-store.ts`, handlers en
`main/services/audio-ipc.ts`, Zod en `main/services/audio-protocol.ts`). Misma base
que el store JSON (`EMMA_DB_DIR` o `userData/emma`):

```
userData/emma/
├─ store/                 colecciones JSON (srs, setupChecks, audioPrefs, …)
└─ audio/
   ├─ index.json          metadatos de cada clip: única fuente de verdad, escritura atómica
   └─ clips/<id>.webm     binario Opus/WebM
```

Al arrancar, `reconcile()` borra archivos huérfanos y entradas sin archivo. Hay tres
orígenes de clip: la nota de voz del aprendiz (`learner`, al enviar un turno hablado),
las frases de Emma (`emma`, al cerrar el diálogo de la lección, en serie y cancelable:
Kokoro atiende una síntesis a la vez) y la lectura en voz alta del repaso (`attempt`,
una vigente por tarjeta). Las dos primeras crean una tarjeta `audio-recall`. Tope por
defecto 500 MB (`DEFAULT_AUDIO_CAP_BYTES`): al llenarse sólo se desalojan clips de
tarjetas dominadas (caja 5); si no alcanza, el clip nuevo se rechaza. Sin clip, la
tarjeta se degrada a texto (`presentAudioCard`). Borrar una conversación borra sus
clips después del historial (`src/components/chat/delete-conversation.ts`); «Clear
chat history» y «Delete all data» borran todo el audio.

**Formato y transcodificación.** Todo se graba con el mismo `MediaRecorder`
(Opus a 32 kbps, tope duro de 60 s; `src/infrastructure/audio/clip-recorder-options.ts`).
Kokoro entrega WAV a 24 kHz: `src/infrastructure/audio/wav-to-opus.ts` lo decodifica con
Web Audio, lo reproduce hacia un `MediaStreamAudioDestinationNode` (no suena por los
parlantes) y lo graba con ese mismo `MediaRecorder`, en tiempo real y en segundo plano.
Sin ffmpeg ni dependencias nativas nuevas.

**Privacidad: el audio nunca sale del equipo.** No hay canal de audio hacia la nube:
ni el router/proveedores de IA (`src/lib/ai/**`) ni el adaptador remoto
(`main/services/ai-remote*`) pueden importar módulos de audio ni tocar canales
`audio-*`. Freno: `src/lib/ai/__tests__/audio-no-sale.test.ts` (con prueba de vida
sobre un cebo). El historial del chequeo tampoco guarda audio ni prompts.

## Procesos Electron

- **main** (`main.ts`, `main/`): ventana, config, IPC, esquemas, logger,
  servicios. Llaves de nube cifradas con `safeStorage`. La persistencia vive aquí:
  store JSON por colección (`main/services/store.ts`, un documento por colección
  bajo `userData/emma/store/`, escritura atómica) — reemplaza a SQLite. El audio
  guardado vive aparte, en `userData/emma/audio/` (ver «Audio guardado y chequeo de
  setup»), y el permiso real del micrófono se consulta aquí (`mic-access-status`).
- **utilityProcess «EMMA voice»** (`main/services/tts-native/host.ts`, #269): Kokoro-82M
  con `onnxruntime-node` en CPU multihilo, ~0,25 s de cómputo por s de audio (el WASM de un
  hilo iba a ~3,4). Proceso aparte para que un crash nativo no tumbe la app; el cliente
  (`main/services/tts-native/client.ts`) lo relanza si muere. Modelo en
  `userData/models/kokoro`. Los binarios van fuera del asar (`asarUnpack`) y cada
  instalador lleva sólo los de su plataforma. Lo prueba `pnpm voice:smoke` en CI
  (Windows y macOS, `.github/workflows/voice-smoke.yml`) y en el release.
- **preload** (`preload.ts`): puente IPC tipado (contextBridge).
- **renderer** (Next.js): UI, IA local WebGPU, STT (Whisper), TTS: Kokoro nativo por IPC
  (`src/infrastructure/tts/native-engine.ts`); si no arranca, Kokoro en un Worker WASM, y
  Web Speech como último respaldo. Sin voces de nube: el runtime WASM de onnxruntime
  va empaquetado en `public/ort/` (copiado en el build por `scripts/copy-ort-wasm.mjs`).

## Dónde va cada cosa

- ¿Regla que no necesita IO ni framework? → `domain`.
- ¿Orquesta varias reglas + un puerto? → `application` (caso de uso).
- ¿Habla con el store, red, disco o un SDK? → `infrastructure` (adaptador de un puerto).
- ¿Es React/Electron/IPC? → `interface` / `components` / `main`.

Si dudas, empújalo hacia adentro (más puro) y saca el IO a un puerto.
