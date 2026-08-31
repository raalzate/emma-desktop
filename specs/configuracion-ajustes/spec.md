# spec · configuracion-ajustes — Ajustes de conversación y configuración de la app

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 4 — Progreso y retención
- **Módulos:** `src/domain/chat-settings` (chat-settings.ts, settings-renderer.ts),
  `src/domain/personas/persona-tuning.ts`, `src/app/settings/page.tsx`,
  `src/components/settings` (personality-form, persona-tuning-form,
  personality-options, remote-ai-config, model-manager),
  `src/infrastructure/persistence` (chat-settings-repository, persona-tuning-repository)

## Contexto
EMMA necesita que el aprendiz pueda ajustar cómo le habla la tutora (tono, actitud,
estilo de entrega, idioma de apoyo, nivel de detalle) y cómo se comportan los
personajes de escena (protopersonas) por separado, sin tocar código. La página de
Configuración agrupa esto junto con el modelo local, la IA en la nube opcional y datos
del sistema, pero el foco de esta spec es el dominio `chat-settings` (personalidad de
Emma) y su contraparte de afinación por escena (`persona-tuning`), que comparten
enums y renderizado de directivas para el prompt.

## Historias de usuario

### US-1 — Personalizar el tono y actitud de Emma
Como aprendiz, quiero ajustar el tono, la actitud y el nivel de detalle con que Emma me
habla, para que la práctica se sienta cómoda con mi estilo de aprendizaje.
- **Given** el contexto de Emma está listo con ajustes cargados **When** el aprendiz
  cambia el tono a "casual" en la pestaña "Emma (tutora)" y presiona "Guardar
  personalidad" **Then** `saveChatSettings` persiste el borrador y `setSettings`
  actualiza el contexto compartido de la app.
- **Given** la persistencia contiene un valor corrupto o ausente para una clave de
  `ChatSettings` (p. ej. `tone` inexistente) **When** se normaliza al cargar
  **Then** `normalizeChatSettings` rellena esa clave con su valor por defecto
  (`DEFAULT_CHAT_SETTINGS`) sin lanzar excepción.
- **Given** un `ChatSettings` con `verbosity: "detailed"` **When** se construye el
  bloque de prompt para Emma **Then** `renderSettingsBlock` incluye la directiva
  "answer with a thorough multi-paragraph explanation".

### US-2 — Ajustar el comportamiento de cada protopersona
Como aprendiz, quiero afinar tono, actitud y estilo de voz de cada personaje de escena
por separado del ajuste de Emma, para que cada simulación mantenga su propio carácter.
- **Given** el aprendiz selecciona una protopersona en la pestaña "Protopersonas"
  **When** ajusta sus campos y presiona "Guardar protopersona" **Then**
  `savePersonaTuning` persiste esa configuración asociada solo a esa escena, sin
  modificar el `ChatSettings` de Emma.
- **Given** una protopersona sin afinación previa guardada **When** se abre su
  formulario **Then** los campos muestran `DEFAULT_PERSONA_TUNING`.
- **Given** la identidad y voz de una protopersona son fijas **When** se renderiza su
  formulario **Then** no se ofrece un selector de género de voz (solo tono, actitud y
  estilo de voz son configurables).

## Requisitos funcionales
- **FR-001** `normalizeChatSettings` sanea un objeto arbitrario a un `ChatSettings`
  válido: para cada clave (`tone`, `attitude`, `voiceStyle`, `language`, `verbosity`),
  si el valor recibido no pertenece al enum permitido, usa el valor de
  `DEFAULT_CHAT_SETTINGS` para esa clave.
- **FR-002** `renderSettingsBlock` produce un bloque determinista "AGENT STYLE" con
  exactamente 5 líneas `Label: value — directiva`, una por cada dimensión de
  `ChatSettings`, para que el modelo encarne el estilo en vez de solo leer una
  etiqueta.
- **FR-003** El género de voz de Emma es fijo (`EMMA_VOICE = "feminine"`) y no forma
  parte de `ChatSettings`; no existe control de UI para cambiarlo.
- **FR-004** La página de Configuración (`/settings`) agrupa en pestañas los ajustes de
  personalidad de Emma, afinación de protopersonas, modelo local, IA en la nube
  (híbrido/remoto opcional), información del sistema y gestión de datos.
- **FR-005** `PersonalityForm` mantiene un borrador local (`draft`) inicializado desde
  el contexto compartido (`useEmma().settings`) y solo persiste/propaga los cambios al
  presionar "Guardar personalidad".
- **FR-006** `PersonaTuningForm` mantiene un mapa de afinaciones por clave de escena
  (`Record<string, PersonaTuning>`), cargado con `loadPersonaTunings` y persistido por
  escena individual con `savePersonaTuning`, sin afectar las demás protopersonas.

## Criterios de éxito
- **SC-001** `normalizeChatSettings` nunca devuelve un `ChatSettings` con un valor
  fuera de su enum permitido, sin importar la forma de la entrada.
- **SC-002** El bloque generado por `renderSettingsBlock` siempre contiene las 5
  etiquetas (Tone, Attitude, Voice profile, Output language, Verbosity) en el orden
  definido, verificable por matching de línea `Label: value`.
- **SC-003** Guardar la personalidad de Emma o la afinación de una protopersona nunca
  altera los ajustes de la otra superficie (aislamiento de estado verificado por los
  repositorios independientes `chat-settings-repository` y `persona-tuning-repository`).
