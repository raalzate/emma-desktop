# spec · motor-ia-local — Motor de IA local e híbrido (LiteRT-LM + nube)

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 1 — Fundación e inmersión
- **Módulos:** `src/lib/ai/litert-engine.ts`, `src/lib/ai/router.ts`, `src/lib/ai/providers.ts`, `src/lib/ai/remote-settings.ts`, `src/lib/ai/ai-readiness.ts`, `src/domain/ai/llm-port.ts`

## Contexto

EMMA Desktop es local-first: corre un modelo Gemma (`.litertlm`) vía
`@litert-lm/core` sobre WebGPU en el renderer, sin costo ni conexión. Para
tareas complejas o que exigen salida estructurada, puede escalar a un
proveedor de nube (Gemini/OpenAI/Anthropic) configurado por el usuario. Todo
el resto del sistema depende solo del puerto `LlmGenerate`
(`src/domain/ai/llm-port.ts`); nunca importa el motor concreto.

## Historias de usuario

### US-1 — Práctica offline con el modelo local
Como estudiante sin conexión, quiero conversar con EMMA usando el modelo
local, para poder practicar en cualquier momento.

- **Given** un modelo `.litertlm` descargado y seleccionado, y modo `local` o
  `hybrid` **When** se verifica `checkAiReadiness()` **Then** el resultado es
  `{ ready: true, reason: "ok" }`.
- **Given** una tarea con `tier: "light"` y sin proveedor remoto activo
  **When** el router decide el proveedor (`chooseProvider`) **Then** elige
  `"local"` con `fellBack: false`.
- **Given** una conversación local activa **When** el motor detecta 6 o más
  repeticiones consecutivas del mismo token al final del texto generado
  **Then** corta el streaming inmediatamente (`isDegenerating`).

### US-2 — Escalado automático a la nube para tareas complejas
Como estudiante, quiero que las tareas que requieren razonamiento profundo o
salida estructurada se resuelvan bien aunque el modelo local sea pequeño.

- **Given** una tarea con `tier: "heavy"` o `structured: true`, y una API key
  configurada **When** se enruta la tarea **Then** se ejecuta en `"remote"`
  sin intentar degradar a local (`fellBack: false`).
- **Given** una tarea `"heavy"` sin ningún proveedor remoto disponible
  **When** se enruta **Then** `route()` lanza un error explicando que falta
  configurar la API key, sin caer al modelo local.
- **Given** una tarea `"light"` cuyo prompt excede `maxLocalChars` **When** hay
  proveedor remoto disponible **Then** se enruta a `"remote"` con
  `fellBack: true` y razón "entrada grande → remoto".

### US-3 — Configuración del modo de IA
Como estudiante, quiero elegir entre modo local, remoto o híbrido, y guardar
mi proveedor/modelo preferido, para controlar costo y privacidad.

- **Given** el usuario activa modo `"remote"` y configura la API key para
  `gemini` **When** se llama `checkAiReadiness()` **Then** el resultado es
  `ready: true` solo si `getAiKeyStatus()` confirma la key para ese proveedor.
- **Given** ajustes corruptos o incompletos en `localStorage` **When** se
  cargan con `loadAiSettings()` **Then** `normalizeSettings` sanea a valores
  válidos (modo por defecto `"local"`, proveedor por defecto `"gemini"`).
- **Given** modo `"hybrid"` sin modelo local descargado pero con API key
  configurada **When** se evalúa disponibilidad **Then** el sistema reporta
  `ready: true` cayendo al proveedor remoto.

## Requisitos funcionales

- **FR-001** El puerto `LlmGenerate` es la única interfaz que domain/application
  consumen para generar texto; acepta `prompt`, `system`, `maxTokens`,
  `onToken`, y opcionalmente `sessionId`/`turnMessage` para continuidad.
- **FR-002** El router (`chooseProvider`) nunca envía una tarea `"heavy"` o
  `structured` al motor local, incluso si el local está disponible.
- **FR-003** En modo `"local"` forzado, el router jamás sale a la nube: si la
  tarea no tiene `buildPrompt`, `chooseProvider` devuelve `provider: null`.
- **FR-004** En modo `"remote"` forzado, toda tarea ejecutable en remoto
  (`buildPrompt` o `remoteFlow`) se enruta a `"remote"`, incluidas las
  ligeras.
- **FR-005** El motor local (`getEngine`) mantiene un único engine en memoria:
  al cambiar de archivo de modelo, libera (`.delete()`) el engine anterior
  antes de crear uno nuevo.
- **FR-006** Cada turno de conversación local se cierra con `close()` sobre la
  conversación (`litertGenerate`), liberando su KV-cache para evitar
  degradación progresiva del modelo entre turnos.
- **FR-007** `checkAiReadiness()` en modo local/híbrido, si el modelo
  seleccionado no está descargado pero existe otro descargado, reapunta
  automáticamente la selección al primero descargado.
- **FR-008** Las llaves de proveedores remotos nunca se guardan en
  `src/lib/ai/remote-settings.ts` (localStorage); solo se persiste la
  preferencia de modo/proveedor/modelo. Las llaves viven cifradas en el
  proceso main.

## Criterios de éxito

- **SC-001** El 100% de las tareas `"heavy"`/`structured` ejecutadas con
  proveedor remoto disponible resuelven en `"remote"` (verificado por
  `chooseProvider`/`route`, sin excepción de degradación a local).
- **SC-002** Ninguna tarea local deja un engine o conversación sin liberar:
  cada llamada a `litertGenerate` invoca `close()` en su bloque `finally`.
- **SC-003** `normalizeSettings` produce siempre un objeto `AiRemoteSettings`
  válido (mode/provider/models) para cualquier entrada arbitraria, sin lanzar
  excepciones.
- **SC-004** Los tests de `src/lib/ai/__tests__/litert-config.test.ts` y
  cualquier suite de router/providers pasan sin regresión tras cambios en el
  motor de IA.
