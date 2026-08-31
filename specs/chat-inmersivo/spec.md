# spec · chat-inmersivo — Chat inmersivo con EMMA (simulación en inglés)

- **Estado:** implementada — spec histórica, documentada retroactivamente el 2026-08-31
- **Sprint:** Sprint 1 — Fundación e inmersión
- **Módulos:** `src/domain/english-teacher`, `src/domain/chat`, `src/domain/personas`, `src/application/english-teacher`, `src/application/chat`, `src/app/chat`

## Contexto

El corazón de EMMA es la simulación conversacional: el estudiante practica
inglés de trabajo interpretando un rol frente a una "protopersona" (colega,
entrevistador, etc.) que nunca revela ser una IA ni cambia de idioma. Cada
turno arma un prompt de escena completo (persona, situación, hechos fijos,
nivel CEFR, metas) y sanea agresivamente la respuesta del modelo para
mantener la inmersión. Por separado, el modo "Teach me" explica en español
(andamiaje) lo que la persona acaba de decir en inglés.

## Historias de usuario

### US-1 — Conversación de simulación en personaje
Como estudiante, quiero conversar con una persona de escenario que nunca
rompe el personaje, para practicar inglés en un contexto realista.

- **Given** un escenario con `scenarioType` y `emmaRole` definidos **When** se
  construye el prompt de sistema (`buildSimulationPrompt`) **Then** incluye,
  en orden, el bloque de persona, el objetivo de escena con presupuesto de
  turnos, el estilo de personaje, el perfil del aprendiz y el nivel CEFR.
- **Given** una respuesta del modelo que contiene una fuga de identidad
  ("I'm an AI...") **When** se limpia la respuesta (`cleanReply`) **Then** la
  fuga se elimina antes de mostrarse al usuario.
- **Given** una respuesta idéntica al último turno de la persona **When** se
  limpia la respuesta **Then** se descarta (cadena vacía) para forzar
  reintento o recuperación en personaje.

### US-2 — Resiliencia ante fallas del modelo
Como estudiante, quiero que la conversación no se rompa si el modelo tarda o
responde basura, para no perder inmersión por errores técnicos.

- **Given** el LLM no responde dentro de `LLM_TIMEOUT_SECONDS` **When** ya se
  emitieron tokens parciales por streaming **Then** se usa el texto parcial
  saneado en vez del mensaje de fallback genérico.
- **Given** dos generaciones inválidas consecutivas (meta-texto, fuga o
  repetición) **When** se agotan los reintentos **Then** se responde con una
  línea de recuperación EN PERSONAJE (`pickRecovery`), nunca la misma línea
  dos turnos seguidos.
- **Given** streaming en curso **When** el texto acumulado aún no cruza una
  frontera de oración o supera `STREAM_HOLDBACK_CHARS` **Then** no se emite
  nada a la UI hasta confirmar que el fragmento es seguro (`isStreamSafe`).

### US-3 — Andamiaje "Teach me" en español
Como estudiante, quiero pedir una explicación en español de lo que EMMA
acaba de decir en inglés, para entender pronunciación, gramática y opciones
de respuesta sin salir de la inmersión de la conversación.

- **Given** un mensaje de la persona en inglés **When** se ejecuta `teach()`
  **Then** se generan tres secciones en cadena: tabla de pronunciación,
  puntos gramaticales y sugerencias de respuesta, cada una con su propio
  presupuesto de tokens.
- **Given** una solicitud de `teach()` ya resuelta previamente para el mismo
  `responseId` **When** se vuelve a pedir **Then** se devuelve el resultado
  cacheado sin llamar de nuevo al LLM.
- **Given** una falla en cualquiera de las tres llamadas de la cadena
  **When** se captura la excepción **Then** se devuelve un resultado de error
  (`errorResult`) en vez de propagar la excepción a la UI.

## Requisitos funcionales

- **FR-001** El prompt de simulación (`buildSimulationPrompt`) SIEMPRE ancla
  a la IA a una protopersona concreta con nombre y rol (`personaFor`), nunca a
  un "asistente" genérico.
- **FR-002** El historial de conversación se pliega en un único prompt de
  texto (no un array de mensajes) porque `LlmGenerate` solo acepta `prompt`;
  se usa `layerHistory` para colapsar turnos antiguos en una nota y mantener
  verbatim los recientes.
- **FR-003** Cada respuesta de simulación se limpia con la cadena: saneo de
  texto (`sanitizeReply`) → remoción de fuga de identidad
  (`removeIdentityLeak`) → remoción de saludo/opener repetido → poda a máximo
  3 oraciones (`polishChatReply`).
- **FR-004** Si el timeout se cumple sin ningún token emitido, la respuesta es
  exactamente el mensaje fijo `"EMMA is having trouble responding right now.
  Please try again."`.
- **FR-005** El validador de turno (`validateReply`) puede rechazar una
  respuesta limpia (p. ej. por repetir un ítem de checklist); en ese caso se
  trata igual que una respuesta vacía y dispara el flujo de reintento.
- **FR-006** El caso de uso `teach()` valida en el borde: `text` no vacío y
  `userId` positivo, lanzando error antes de tocar el LLM si no se cumplen.
- **FR-007** El tuning de persona (`PersonaTuning`: tono, actitud, estilo de
  voz) se sanea con `normalizePersonaTuning` a valores del catálogo permitido
  (`TONES`, `ATTITUDES`, `VOICE_STYLES`) antes de renderizarse en el prompt.
- **FR-008** El límite de turnos de una sesión de simulación depende del
  `scenarioType` (`MAX_TURNS_BY_SCENARIO`); si el tipo no está mapeado, se usa
  `DEFAULT_MAX_TURNS` (10).

## Criterios de éxito

- **SC-001** Ninguna respuesta de simulación mostrada al usuario final
  contiene menciones de ser una IA/modelo de lenguaje (fuga de identidad
  detectable por `hasIdentityLeak`).
- **SC-002** El 100% de las respuestas de simulación entregadas al usuario
  tienen como máximo 3 oraciones (`CHAT_REPLY_MAX_SENTENCES`).
- **SC-003** Una petición repetida de `teach()` con el mismo `responseId` no
  genera una segunda llamada al LLM (verificable por el hit de caché en
  `teach-cache`).
- **SC-004** La conversación de simulación permanece 100% en inglés: ningún
  bloque del prompt de sistema ni la respuesta final introduce texto en
  español dentro del diálogo hablado.
